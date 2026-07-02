"""
ControlNet-style spatial encoder for interior design.

This module provides:
- ControlNetSpatialEncoder: a PyTorch module that encodes room layout geometry
  (walls, furniture bounding boxes, depth structure) into control signals
  suitable for conditioning a diffusion model.

- encode_room_layout(): high-level helper converting room state + placed furniture
  into control tensors.

No actual Stable Diffusion weights are loaded here; this is the spatial front-end
you plug into the image-generation backend (ComfyUI / FLUX / your own UNet).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Tuple, Optional

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    HAS_TORCH = True
except ImportError:  # pragma: no cover
    HAS_TORCH = False


if HAS_TORCH:

    class ConvBlock(nn.Module):
        def __init__(self, in_ch: int, out_ch: int, *, norm: bool = True):
            super().__init__()
            layers: List[nn.Module] = [nn.Conv2d(in_ch, out_ch, 3, padding=1)]
            if norm:
                layers.append(nn.GroupNorm(8, out_ch))
            layers.append(nn.SiLU(inplace=True))
            self.net = nn.Sequential(*layers)

        def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
            return self.net(x)

    class Down(nn.Module):
        def __init__(self, ch: int):
            super().__init__()
            self.net = nn.Sequential(nn.MaxPool2d(2), ConvBlock(ch, ch))

        def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
            return self.net(x)

    class Up(nn.Module):
        def __init__(self, ch: int):
            super().__init__()
            self.net = nn.Sequential(
                nn.Upsample(scale_factor=2, mode="nearest"),
                ConvBlock(ch, ch),
            )

        def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
            return self.net(x)

    class ControlNetSpatialEncoder(nn.Module):
        """
        Tiny ControlNet-style encoder, specialised for interior geometry.

        Input:  multi-channel control image:
                ch0 = walls (1)
                ch1 = furniture masks (1)
                ch2 = depth / occupancy (1)
                ch3 = style hint (1 optional)
        Output: control conditioning tensor Bx64xH/8xW/8
        """

        def __init__(self, in_channels: int = 3, base: int = 64):
            super().__init__()
            self.stem = ConvBlock(in_channels, base)
            self.d1 = Down(base)
            self.d2 = Down(base * 2)
            self.d3 = Down(base * 4)
            self.mid = ConvBlock(base * 8, base * 8)
            self.u3 = Up(base * 8)
            self.u2 = Up(base * 4)
            self.u1 = Up(base * 2)
            self.head = nn.Conv2d(base, 8, 3, padding=1)

        def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
            x0 = self.stem(x)
            x1 = self.d1(x0)
            x2 = self.d2(x1)
            x3 = self.d3(x2)
            y = self.mid(x3)
            y = self.u3(y) + x3
            y = self.u2(y) + x2
            y = self.u1(y) + x1
            return torch.tanh(self.head(y))

else:  # pragma: no cover

    class _FallbackControlNetSpatialEncoder:  # type: ignore[no-redef]
        """Zero-weight fallback when PyTorch isn't installed; keeps imports safe."""

        def __init__(self, *args, **kwargs):
            pass

        def __call__(self, *_args, **_kwargs):
            raise RuntimeError("PyTorch is required to run ControlNetSpatialEncoder.")

    ControlNetSpatialEncoder = _FallbackControlNetSpatialEncoder  # type: ignore[assignment,misc]


# ---------------------------------------------------------------------------
# Geometry rasterisation (pure numpy, no torch required)
# ---------------------------------------------------------------------------

@dataclass
class RasterSpec:
    width_px: int = 1024
    height_px: int = 576
    wall_thickness_px: int = 6


def _world_to_pixel(points: List[Tuple[float, float]],
                    origin: Tuple[float, float],
                    scale: float,
                    spec: RasterSpec) -> List[Tuple[int, int]]:
    ox, oy = origin
    return [
        (
            int(round((px - ox) * scale)),
            int(round(spec.height_px - 1 - (py - oy) * scale)),  # flip Y for image coords
        )
        for px, py in points
    ]


def _bresenham(x0: int, y0: int, x1: int, y1: int) -> List[Tuple[int, int]]:
    """Integer line rasterisation."""
    pts = []
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        pts.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    return pts


def _draw_polygon(canvas: np.ndarray, poly_xy: List[Tuple[float, float]],
                  origin: Tuple[float, float], scale: float,
                  spec: RasterSpec, value: float = 1.0) -> None:
    poly_px = _world_to_pixel(poly_xy, origin, scale, spec)
    if len(poly_px) < 2:
        return
    for (x0, y0), (x1, y1) in zip(poly_px, poly_px[1:] + poly_px[:1]):
        for x, y in _bresenham(x0, y0, x1, y1):
            if 0 <= x < spec.width_px and 0 <= y < spec.height_px:
                canvas[y, x] = value


def _fill_polygon(canvas: np.ndarray, poly_xy: List[Tuple[float, float]],
                  origin: Tuple[float, float], scale: float,
                  spec: RasterSpec, value: float = 1.0) -> None:
    """Naive scan-line fill (good enough for convex-ish polygons)."""
    from PIL import Image, ImageDraw  # type: ignore[import]
    img = Image.fromarray((canvas * 255).astype(np.uint8), mode="L")
    draw = ImageDraw.Draw(img)
    poly_px = _world_to_pixel(poly_xy, origin, scale, spec)
    try:
        draw.polygon(poly_px, fill=int(value * 255))
    except Exception:
        # fallback to outline if fill fails
        draw.polygon(poly_px)
    canvas[:] = np.asarray(img, dtype=np.float32) / 255.0


def encode_room_layout(*, room_polygon: List[Tuple[float, float]],
                       furniture_boxes: Optional[List[Tuple[float, float, float, float]]] = None,
                       spec: Optional[RasterSpec] = None,
                       origin: Optional[Tuple[float, float]] = None,
                       world_scale: Optional[float] = None
                       ) -> np.ndarray:
    """
    Encode room + furniture into a multi-channel control image:
        channel 0 = room boundary (walls)
        channel 1 = furniture footprint
        channel 2 = occupancy / depth hint

    Returns HxWx3 float32 array with values in [0, 1].
    """
    spec = spec or RasterSpec()
    if origin is None:
        xs = [p[0] for p in room_polygon]
        ys = [p[1] for p in room_polygon]
        origin = (min(xs), min(ys))
        sx = max(xs) - min(xs) or 1.0
        sy = max(ys) - min(ys) or 1.0
        world_scale = min(spec.width_px / sx, spec.height_px / sy) if world_scale is None else world_scale
    elif world_scale is None:
        sx = max(p[0] for p in room_polygon) - min(p[0] for p in room_polygon) or 1.0
        sy = max(p[1] for p in room_polygon) - min(p[1] for p in room_polygon) or 1.0
        world_scale = min(spec.width_px / sx, spec.height_px / sy)

    wall = np.zeros((spec.height_px, spec.width_px), dtype=np.float32)
    fur = np.zeros_like(wall)
    occ = np.zeros_like(wall)

    # walls (boundary)
    _draw_polygon(wall, room_polygon, origin, world_scale, spec, value=1.0)
    _fill_polygon(wall, room_polygon, origin, world_scale, spec, value=0.0)

    # furniture
    for box in (furniture_boxes or []):
        x, y, w, d = box
        quad = [(x, y), (x + w, y), (x + w, y + d), (x, y + d)]
        _fill_polygon(fur, quad, origin, world_scale, spec, value=1.0)
        _fill_polygon(occ, quad, origin, world_scale, spec, value=0.8)

    control = np.stack([wall, fur, occ], axis=-1)
    return control


def to_torch_tensor(control: np.ndarray) -> "torch.Tensor":
    """Convert HxWxC numpy control map to BxCxHxW torch tensor."""
    if not HAS_TORCH:
        raise RuntimeError("PyTorch not installed; cannot create torch tensor.")
    arr = np.transpose(control, (2, 0, 1))
    t = torch.from_numpy(arr).float().unsqueeze(0)
    return t
