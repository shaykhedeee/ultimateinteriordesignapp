import React from 'react';
import type { SurfaceCandidate } from './types';

export type SurfaceCandidateOverlayProps = {
  candidates: SurfaceCandidate[];
  selectedSurfaceId?: string;
  onSelect(surface: SurfaceCandidate): void;
};

export function SurfaceCandidateOverlay(props: SurfaceCandidateOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {props.candidates.map((candidate) => {
        const selected = candidate.id === props.selectedSurfaceId;
        return (
          <button
            key={candidate.id}
            type="button"
            onClick={() => props.onSelect(candidate)}
            className={`pointer-events-auto absolute rounded-xl border text-left transition-all ${
              selected
                ? 'border-violet-400 bg-violet-500/15 shadow-[0_0_0_1px_rgba(167,139,250,0.5)]'
                : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
            }`}
            style={{
              left: `${candidate.bounds.x}%`,
              top: `${candidate.bounds.y}%`,
              width: `${candidate.bounds.width}%`,
              height: `${candidate.bounds.height}%`,
            }}
          >
            <div className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              {candidate.label} · {Math.round(candidate.confidence * 100)}%
            </div>
          </button>
        );
      })}
    </div>
  );
}
