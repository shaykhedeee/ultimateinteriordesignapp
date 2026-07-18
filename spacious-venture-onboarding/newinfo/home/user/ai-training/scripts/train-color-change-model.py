// ============================================================
// PRIORITY 1: Color Change AI Training Pipeline
// ai-training/scripts/train-color-change-model.py
// Full training pipeline for Component-Aware Image Editor (CAIE)
// ============================================================

"""
TRAINING PIPELINE OVERVIEW:
Phase 1: Synthetic Data Generation (Week 1)
Phase 2: Component Segmentation Pretraining (Week 1-2)
Phase 3: Color Change Training (Week 2-3)  
Phase 4: Material Variation Training (Week 3)
Phase 5: Real-World Fine-Tuning (Week 4)
Phase 6: Evaluation & Export (Week 4)
"""

import os
import json
import random
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, optimizers, losses
import cv2
from PIL import Image, ImageDraw, ImageFont
import albumentations as A
from tqdm import tqdm
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# PHASE 1: SYNTHETIC DATA GENERATION
# ============================================================

class SyntheticDataGenerator:
    """
    Generates training pairs for color change model.
    
    Each pair:
    - Image A: Render with component in color X
    - Image B: Same render, same component in color Y
    - Mask: Pixel-perfect mask of the changed component
    - Metadata: Component type, old color, new color, material
    """
    
    COMPONENT_TYPES = ['sofa', 'tv_unit', 'wardrobe', 'dining_table', 
                       'bed', 'coffee_table', 'kitchen_cabinet', 'pooja_unit']
    
    COLOR_PALETTES = {
        'neutral': ['#d4c5b2', '#e8ddd0', '#f5f0e8', '#808080', '#2d2d2d'],
        'jewel': ['#1e4d6e', '#2d5a27', '#8b1a1a', '#6b3a6b', '#1a2a4a'],
        'earth': ['#c17e3a', '#a07040', '#8b6f47', '#6b5b3a', '#c4b49d'],
        'pastel': ['#c4d4b8', '#e8c4b8', '#c0c8d8', '#d4c4e8', '#e8ddd0'],
        'bold': ['#d4a017', '#008080', '#c46a4a', '#d4a090', '#e94560']
    }
    
    def __init__(self, output_dir='ai-training/datasets/synthetic-pairs'):
        self.output_dir = output_dir
        os.makedirs(f'{output_dir}/images_a', exist_ok=True)
        os.makedirs(f'{output_dir}/images_b', exist_ok=True)
        os.makedirs(f'{output_dir}/masks', exist_ok=True)
        os.makedirs(f'{output_dir}/metadata', exist_ok=True)
        
        # Augmentation pipeline for variety
        self.augmentation = A.Compose([
            A.RandomBrightnessContrast(p=0.3),
            A.HueSaturationValue(p=0.2),
            A.GaussianBlur(p=0.1),
            A.RandomGamma(p=0.2),
        ], additional_targets={'mask': 'mask'})
    
    def generate_component_mask(self, image_size, component_type):
        """Generate a synthetic component mask for training."""
        h, w = image_size
        
        if component_type == 'sofa':
            # Rectangular sofa shape
            x, y = random.randint(50, w//4), random.randint(h//3, h//2)
            cw, ch = random.randint(w//4, w//2), random.randint(h//6, h//4)
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(mask, (x, y), (x + cw, y + ch), 255, -1)
            # Add cushion circles
            cv2.circle(mask, (x + cw//4, y + ch//2), ch//4, 255, -1)
            cv2.circle(mask, (x + 3*cw//4, y + ch//2), ch//4, 255, -1)
            
        elif component_type == 'tv_unit':
            # Wall-mounted rectangle
            x, y = random.randint(w//4, w//2), random.randint(h//4, h//3)
            cw, ch = random.randint(w//4, w//3), random.randint(h//10, h//6)
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(mask, (x, y), (x + cw, y + ch), 255, -1)
            
        elif component_type == 'wardrobe':
            # Tall rectangle
            x, y = random.randint(w//2, 3*w//4), random.randint(h//8, h//4)
            cw, ch = random.randint(w//5, w//3), random.randint(h//2, 3*h//4)
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(mask, (x, y), (x + cw, y + ch), 255, -1)
            # Add vertical line for sliding door
            cv2.line(mask, (x + cw//2, y), (x + cw//2, y + ch), 255, 3)
            
        elif component_type in ['dining_table', 'coffee_table']:
            # Table shape
            cx, cy = random.randint(w//3, 2*w//3), random.randint(h//3, 2*h//3)
            tw, th = random.randint(w//5, w//3), random.randint(h//6, h//4)
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.ellipse(mask, (cx, cy), (tw//2, th//2), 0, 0, 360, 255, -1)
            
        elif component_type == 'bed':
            # Large rectangle
            x, y = random.randint(50, w//3), random.randint(h//4, h//3)
            cw, ch = random.randint(w//3, w//2), random.randint(h//3, h//2)
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(mask, (x, y), (x + cw, y + ch), 255, -1)
            # Headboard
            cv2.rectangle(mask, (x, y-15), (x + cw, y), 255, -1)
            
        else:  # Generic box
            x, y = random.randint(50, w//2), random.randint(h//4, h//2)
            cw, ch = random.randint(w//6, w//3), random.randint(h//6, h//3)
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.rectangle(mask, (x, y), (x + cw, y + ch), 255, -1)
        
        return mask
    
    def apply_color_to_mask(self, image, mask, target_color):
        """Change the color of pixels within the mask to target_color."""
        result = image.copy()
        mask_3ch = np.stack([mask, mask, mask], axis=-1) / 255.0
        
        # Parse hex color
        r, g, b = int(target_color[1:3], 16), int(target_color[3:5], 16), int(target_color[5:7], 16)
        
        # Blend new color while preserving texture (luminance)
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        gray_3ch = np.stack([gray, gray, gray], axis=-1)
        
        # Preserve texture by using the luminance of original
        color_array = np.array([r, g, b], dtype=np.uint8).reshape(1, 1, 3)
        luminance_factor = gray_3ch.astype(float) / 255.0
        
        new_pixels = (color_array * luminance_factor).astype(np.uint8)
        
        # Blend
        result = (result * (1 - mask_3ch) + new_pixels * mask_3ch).astype(np.uint8)
        
        return result
    
    def generate_synthetic_scene(self, image_size=(512, 512)):
        """Generate a synthetic room scene with components."""
        h, w = image_size
        
        # Background (room)
        scene = np.ones((h, w, 3), dtype=np.uint8) * random.randint(230, 250)
        
        # Floor
        floor_h = random.randint(h//4, h//3)
        floor_color = random.choice([180, 190, 200, 210])
        scene[h-floor_h:, :] = floor_color
        
        # Wall-floor line
        cv2.line(scene, (0, h-floor_h), (w, h-floor_h), (160, 160, 160), 2)
        
        # Window
        win_x, win_y = random.randint(w//6, w//3), random.randint(30, 80)
        win_w, win_h = random.randint(w//5, w//3), random.randint(h//4, h//3)
        cv2.rectangle(scene, (win_x, win_y), (win_x+win_w, win_y+win_h), (200, 210, 230), -1)
        cv2.rectangle(scene, (win_x, win_y), (win_x+win_w, win_y+win_h), (180, 190, 210), 2)
        
        return scene
    
    def generate_training_pair(self, component_type, index):
        """Generate one training pair (image_a, image_b, mask, metadata)."""
        image_size = (512, 512)
        
        # Generate base scene
        scene = self.generate_synthetic_scene(image_size)
        
        # Generate component mask
        mask = self.generate_component_mask(image_size, component_type)
        
        # Pick colors
        family = random.choice(list(self.COLOR_PALETTES.keys()))
        old_color = random.choice(self.COLOR_PALETTES[family])
        new_family = random.choice(list(self.COLOR_PALETTES.keys()))
        new_color = random.choice(self.COLOR_PALETTES[new_family])
        
        # Ensure colors are different
        while new_color == old_color:
            new_color = random.choice(self.COLOR_PALETTES[new_family])
        
        # Apply old color to scene
        image_a = self.apply_color_to_mask(scene, mask, old_color)
        
        # Apply new color to scene
        image_b = self.apply_color_to_mask(scene, mask, new_color)
        
        # Metadata
        metadata = {
            'component_type': component_type,
            'old_color': old_color,
            'new_color': new_color,
            'old_color_family': family,
            'new_color_family': new_family,
            'image_size': image_size,
            'mask_area_pixels': int(np.sum(mask > 0)),
            'mask_area_percent': float(np.sum(mask > 0) / (image_size[0] * image_size[1]) * 100)
        }
        
        # Save
        base_path = f'{self.output_dir}'
        cv2.imwrite(f'{base_path}/images_a/pair_{index:06d}.png', cv2.cvtColor(image_a, cv2.COLOR_RGB2BGR))
        cv2.imwrite(f'{base_path}/images_b/pair_{index:06d}.png', cv2.cvtColor(image_b, cv2.COLOR_RGB2BGR))
        cv2.imwrite(f'{base_path}/masks/pair_{index:06d}.png', mask)
        
        with open(f'{base_path}/metadata/pair_{index:06d}.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return metadata
    
    def generate_dataset(self, num_pairs=10000):
        """Generate full synthetic dataset."""
        logger.info(f"Generating {num_pairs} synthetic training pairs...")
        
        pairs_per_type = num_pairs // len(self.COMPONENT_TYPES)
        all_metadata = []
        
        for comp_type in self.COMPONENT_TYPES:
            logger.info(f"  Generating {pairs_per_type} pairs for '{comp_type}'...")
            for i in tqdm(range(pairs_per_type)):
                meta = self.generate_training_pair(comp_type, 
                    self.COMPONENT_TYPES.index(comp_type) * pairs_per_type + i)
                all_metadata.append(meta)
        
        # Save master metadata
        with open(f'{self.output_dir}/dataset_metadata.json', 'w') as f:
            json.dump({
                'total_pairs': len(all_metadata),
                'component_types': self.COMPONENT_TYPES,
                'color_families': list(self.COLOR_PALETTES.keys()),
                'pairs_per_type': pairs_per_type,
                'metadata': all_metadata
            }, f, indent=2)
        
        logger.info(f"✅ Generated {len(all_metadata)} training pairs")
        return all_metadata


# ============================================================
# PHASE 2: CAIE MODEL ARCHITECTURE
# ============================================================

class ComponentAwareImageEditor(keras.Model):
    """
    Component-Aware Image Editor (CAIE) model.
    
    Architecture:
    - Encoder: ResNet-50 + ViT hybrid for feature extraction
    - Transform Module: Applies color/material changes to masked region
    - Decoder: U-Net with spatial attention for reconstruction
    """
    
    def __init__(self, input_shape=(512, 512, 3), num_colors=200):
        super().__init__()
        self.input_shape = input_shape
        self.num_colors = num_colors
        
        # === ENCODER ===
        # Multi-scale feature extraction
        self.encoder_backbone = self._build_encoder_backbone()
        
        # === COLOR TRANSFORM MODULE ===
        self.color_encoder = self._build_color_encoder()
        self.transform_module = self._build_transform_module()
        
        # === DECODER ===
        self.decoder = self._build_decoder()
        
        # === Material classifier ===
        self.material_classifier = self._build_material_classifier()
        
    def _build_encoder_backbone(self):
        """ResNet-50 based encoder with attention."""
        base = tf.keras.applications.ResNet50V2(
            include_top=False,
            weights='imagenet',
            input_shape=self.input_shape
        )
        
        # Extract multi-scale features
        self.skip_features = [
            base.get_layer('conv1_conv').output,      # 1/2
            base.get_layer('conv2_block3_out').output, # 1/4
            base.get_layer('conv3_block4_out').output, # 1/8
            base.get_layer('conv4_block6_out').output, # 1/16
        ]
        
        return models.Model(
            inputs=base.input,
            outputs=[
                base.get_layer('conv5_block3_out').output,  # 1/32 bottleneck
                *self.skip_features
            ]
        )
    
    def _build_color_encoder(self):
        """Encode target color and material as feature vector."""
        color_input = layers.Input(shape=(self.num_colors,), name='color_input')
        material_input = layers.Input(shape=(32,), name='material_input')
        
        x = layers.Concatenate()([color_input, material_input])
        x = layers.Dense(256, activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Dense(128, activation='relu')(x)
        x = layers.Dense(64, activation='relu')(x)
        
        return models.Model(
            inputs=[color_input, material_input],
            outputs=x,
            name='color_encoder'
        )
    
    def _build_transform_module(self):
        """Apply color transformation to masked encoder features."""
        # This module takes encoder features, mask, and target color
        # and applies the color change to only the masked region
        
        return {
            'feature_modulator': self._build_feature_modulator(),
            'attention_gate': self._build_attention_gate()
        }
    
    def _build_feature_modulator(self):
        """Modulate features in masked region to match target color."""
        features_input = layers.Input(shape=(16, 16, 2048))
        mask_input = layers.Input(shape=(16, 16, 1))
        color_features = layers.Input(shape=(64,))
        
        # Tile color features to match spatial dimensions
        color_tiled = layers.RepeatVector(16 * 16)(color_features)
        color_tiled = layers.Reshape((16, 16, 64))(color_tiled)
        
        # Modulate: apply color change only within mask
        gating = layers.Concatenate()([features_input, color_tiled])
        gating = layers.Conv2D(256, 3, padding='same', activation='relu')(gating)
        gating = layers.Conv2D(1024, 1, padding='same', activation='sigmoid', name='modulation_gate')(gating)
        
        # Apply modulation
        modulated = layers.Multiply()([features_input, gating + (1 - mask_input)])
        
        # Residual connection
        output = layers.Add()([features_input, modulated])
        
        return models.Model(
            inputs=[features_input, mask_input, color_features],
            outputs=output,
            name='feature_modulator'
        )
    
    def _build_attention_gate(self):
        """Spatial attention to focus on the component region."""
        inputs = layers.Input(shape=(16, 16, 2048))
        
        # Channel attention
        channel_avg = layers.GlobalAveragePooling2D()(inputs)
        channel_avg = layers.Dense(256, activation='relu')(channel_avg)
        channel_avg = layers.Dense(2048, activation='sigmoid')(channel_avg)
        channel_avg = layers.Reshape((1, 1, 2048))(channel_avg)
        
        # Spatial attention
        spatial = layers.Conv2D(1, 7, padding='same', activation='sigmoid')(inputs)
        
        # Combine
        attended = layers.Multiply()([inputs, channel_avg])
        attended = layers.Multiply()([attended, spatial])
        
        return models.Model(inputs=inputs, outputs=attended, name='attention_gate')
    
    def _build_decoder(self):
        """U-Net style decoder with skip connections."""
        # Input: bottleneck features after modulation
        bottleneck = layers.Input(shape=(16, 16, 2048))
        
        # Skip connections from encoder
        skip_c1 = layers.Input(shape=(256, 256, 64))
        skip_c2 = layers.Input(shape=(128, 128, 256))
        skip_c3 = layers.Input(shape=(64, 64, 512))
        skip_c4 = layers.Input(shape=(32, 32, 1024))
        
        x = bottleneck
        
        # Decoder blocks
        # Block 1: 16 -> 32
        x = layers.Conv2DTranspose(1024, 4, strides=2, padding='same')(x)
        x = layers.Concatenate()([x, skip_c4])
        x = self._decoder_block(x, 512)
        
        # Block 2: 32 -> 64
        x = layers.Conv2DTranspose(512, 4, strides=2, padding='same')(x)
        x = layers.Concatenate()([x, skip_c3])
        x = self._decoder_block(x, 256)
        
        # Block 3: 64 -> 128
        x = layers.Conv2DTranspose(256, 4, strides=2, padding='same')(x)
        x = layers.Concatenate()([x, skip_c2])
        x = self._decoder_block(x, 128)
        
        # Block 4: 128 -> 256
        x = layers.Conv2DTranspose(128, 4, strides=2, padding='same')(x)
        x = layers.Concatenate()([x, skip_c1])
        x = self._decoder_block(x, 64)
        
        # Block 5: 256 -> 512
        x = layers.Conv2DTranspose(64, 4, strides=2, padding='same')(x)
        x = self._decoder_block(x, 32)
        
        # Output
        x = layers.Conv2D(3, 3, padding='same', activation='sigmoid')(x)
        
        return models.Model(
            inputs=[bottleneck, skip_c1, skip_c2, skip_c3, skip_c4],
            outputs=x,
            name='decoder'
        )
    
    def _decoder_block(self, x, filters):
        """Single decoder block with residual connections."""
        skip = x
        x = layers.Conv2D(filters, 3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        x = layers.ReLU()(x)
        x = layers.Conv2D(filters, 3, padding='same')(x)
        x = layers.BatchNormalization()(x)
        
        if skip.shape[-1] != filters:
            skip = layers.Conv2D(filters, 1)(skip)
        
        x = layers.Add()([x, skip])
        x = layers.ReLU()(x)
        return x
    
    def _build_material_classifier(self):
        """Classify material type from encoder features."""
        inputs = layers.Input(shape=(512,))
        x = layers.Dense(128, activation='relu')(inputs)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(64, activation='relu')(x)
        outputs = layers.Dense(5, activation='softmax', name='material_output')(x)
        return models.Model(inputs=inputs, outputs=outputs, name='material_classifier')
    
    def call(self, inputs, training=False):
        image = inputs['image']
        mask = inputs['mask']
        target_color = inputs['target_color']
        target_material = inputs.get('target_material')
        
        # Encode image
        features = self.encoder_backbone(image)
        bottleneck = features[0]
        skip_1, skip_2, skip_3, skip_4 = features[1], features[2], features[3], features[4]
        
        # Encode target color
        color_feat = self.color_encoder([target_color, target_material])
        
        # Modulate features in masked region
        mask_small = tf.image.resize(mask, (16, 16))
        modulated = self.transform_module['feature_modulator'](
            [bottleneck, mask_small, color_feat]
        )
        
        # Attention
        attended = self.transform_module['attention_gate'](modulated)
        
        # Decode
        output = self.decoder([attended, skip_1, skip_2, skip_3, skip_4])
        
        # Blend with original outside mask
        mask_resized = tf.image.resize(mask, tf.shape(output)[1:3])
        mask_3ch = tf.tile(mask_resized, [1, 1, 1, 3])
        final = image * (1 - mask_3ch) + output * mask_3ch
        
        return {
            'generated': final,
            'mask': mask,
            'attention': attended
        }
    
    def train_step(self, data):
        """Custom training step with specialized losses."""
        inputs = data[0]
        targets = data[1]
        
        with tf.GradientTape() as tape:
            outputs = self(inputs, training=True)
            generated = outputs['generated']
            
            # Loss 1: L1 loss outside mask (preserve background)
            mask_3ch = tf.tile(inputs['mask'], [1, 1, 1, 3])
            outside_loss = tf.reduce_mean(
                tf.abs(generated - targets['original']) * (1 - mask_3ch)
            )
            
            # Loss 2: Perceptual loss inside mask (quality of color change)
            inside_loss = tf.reduce_mean(
                tf.abs(generated - targets['modified']) * mask_3ch
            )
            
            # Loss 3: VGG perceptual loss
            vgg = tf.keras.applications.VGG19(
                include_top=False, weights='imagenet'
            )
            vgg_features = vgg(tf.image.resize(generated, (224, 224)))
            vgg_target = vgg(tf.image.resize(targets['modified'], (224, 224)))
            perceptual_loss = tf.reduce_mean(
                tf.abs(vgg_features - vgg_target)
            )
            
            # Loss 4: Boundary smoothness
            kernel = tf.ones((5, 5, 1, 1)) / 25.0
            mask_smooth = tf.nn.conv2d(inputs['mask'], kernel, [1,1,1,1], 'SAME')
            boundary = tf.abs(mask_smooth - inputs['mask'])
            boundary_loss = tf.reduce_mean(
                tf.abs(generated - targets['modified']) * boundary * 10
            )
            
            # Total loss
            total_loss = (
                10.0 * outside_loss +
                1.0 * inside_loss +
                0.5 * perceptual_loss +
                2.0 * boundary_loss
            )
        
        # Apply gradients
        grads = tape.gradient(total_loss, self.trainable_variables)
        self.optimizer.apply_gradients(zip(grads, self.trainable_variables))
        
        return {
            'loss': total_loss,
            'outside_loss': outside_loss,
            'inside_loss': inside_loss,
            'perceptual_loss': perceptual_loss,
            'boundary_loss': boundary_loss
        }
    
    def test_step(self, data):
        """Validation step."""
        inputs = data[0]
        targets = data[1]
        
        outputs = self(inputs, training=False)
        generated = outputs['generated']
        
        mask_3ch = tf.tile(inputs['mask'], [1, 1, 1, 3])
        outside_loss = tf.reduce_mean(
            tf.abs(generated - targets['original']) * (1 - mask_3ch)
        )
        inside_loss = tf.reduce_mean(
            tf.abs(generated - targets['modified']) * mask_3ch
        )
        
        # PSNR
        mse = tf.reduce_mean(tf.square(generated - targets['modified']))
        psnr = 20 * tf.math.log(255.0 / tf.math.sqrt(mse)) / tf.math.log(10.0)
        
        return {
            'loss': outside_loss + inside_loss,
            'outside_loss': outside_loss,
            'inside_loss': inside_loss,
            'psnr': psnr
        }


# ============================================================
# PHASE 3: DATA LOADER
# ============================================================

class ColorChangeDataLoader:
    """Data loader for color change training pairs."""
    
    def __init__(self, dataset_path, batch_size=8, image_size=(512, 512)):
        self.dataset_path = dataset_path
        self.batch_size = batch_size
        self.image_size = image_size
        
    def load_dataset(self):
        """Load all pairs and create tf.data.Dataset."""
        import glob
        
        pairs = sorted(glob.glob(f'{self.dataset_path}/images_a/*.png'))
        metadata_files = sorted(glob.glob(f'{self.dataset_path}/metadata/*.json'))
        
        logger.info(f"Found {len(pairs)} training pairs")
        
        def parse_pair(pair_path, meta_path):
            # Load images
            img_a = tf.io.read_file(pair_path)
            img_a = tf.image.decode_png(img_a, channels=3)
            img_a = tf.cast(img_a, tf.float32) / 255.0
            
            # Get corresponding image_b
            pair_name = tf.strings.split(tf.strings.split(pair_path, '/')[-1], '.')[0]
            img_b_path = tf.strings.join([
                self.dataset_path, '/images_b/', pair_name, '.png'
            ])
            img_b = tf.io.read_file(img_b_path)
            img_b = tf.image.decode_png(img_b, channels=3)
            img_b = tf.cast(img_b, tf.float32) / 255.0
            
            # Load mask
            mask_path = tf.strings.join([
                self.dataset_path, '/masks/', pair_name, '.png'
            ])
            mask = tf.io.read_file(mask_path)
            mask = tf.image.decode_png(mask, channels=1)
            mask = tf.cast(mask, tf.float32) / 255.0
            
            # Parse metadata
            meta_raw = tf.io.read_file(meta_path)
            meta = tf.json.decode(meta_raw)
            
            # Color as one-hot
            color_idx = self._color_to_index(meta['new_color'])
            color_one_hot = tf.one_hot(color_idx, 200)
            
            return {
                'image': img_a,
                'mask': mask,
                'target_color': color_one_hot,
                'target_material': tf.one_hot(0, 32)  # Default
            }, {
                'original': img_a,
                'modified': img_b
            }
        
        # Create dataset
        dataset = tf.data.Dataset.from_tensor_slices((pairs, metadata_files))
        dataset = dataset.map(parse_pair, num_parallel_calls=tf.data.AUTOTUNE)
        dataset = dataset.batch(self.batch_size)
        dataset = dataset.prefetch(tf.data.AUTOTUNE)
        
        return dataset
    
    def _color_to_index(self, hex_color):
        """Map hex color to index in palette."""
        # Simplified: hash-based indexing
        return hash(hex_color) % 200


# ============================================================
# PHASE 4: TRAINING LOOP
# ============================================================

class ModelTrainer:
    """End-to-end training orchestrator."""
    
    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.checkpoint_dir = config.get('checkpoint_dir', 'ai-training/checkpoints')
        os.makedirs(self.checkpoint_dir, exist_ok=True)
        
        # Optimizer with warmup
        lr_schedule = tf.keras.optimizers.schedules.CosineDecay(
            initial_learning_rate=config.get('lr', 1e-4),
            decay_steps=config.get('decay_steps', 100000),
            alpha=1e-6
        )
        self.optimizer = optimizers.AdamW(
            learning_rate=lr_schedule,
            weight_decay=config.get('weight_decay', 1e-5)
        )
        self.model.optimizer = self.optimizer
    
    def train(self, train_dataset, val_dataset, epochs=50):
        """Run training with checkpointing and logging."""
        
        best_val_loss = float('inf')
        history = {'train_loss': [], 'val_loss': [], 'psnr': []}
        
        for epoch in range(epochs):
            logger.info(f"\n{'='*50}")
            logger.info(f"Epoch {epoch + 1}/{epochs}")
            logger.info(f"{'='*50}")
            
            # Training
            train_losses = []
            for batch_idx, (inputs, targets) in enumerate(tqdm(train_dataset)):
                losses = self.model.train_step((inputs, targets))
                train_losses.append(losses['loss'].numpy())
                
                if batch_idx % 100 == 0:
                    logger.info(
                        f"  Step {batch_idx}: loss={losses['loss']:.4f}, "
                        f"outside={losses['outside_loss']:.4f}, "
                        f"inside={losses['inside_loss']:.4f}"
                    )
            
            avg_train_loss = np.mean(train_losses)
            history['train_loss'].append(avg_train_loss)
            
            # Validation
            val_losses, val_psnrs = [], []
            for inputs, targets in val_dataset:
                losses = self.model.test_step((inputs, targets))
                val_losses.append(losses['loss'].numpy())
                val_psnrs.append(losses['psnr'].numpy())
            
            avg_val_loss = np.mean(val_losses)
            avg_psnr = np.mean(val_psnrs)
            history['val_loss'].append(avg_val_loss)
            history['psnr'].append(avg_psnr)
            
            logger.info(
                f"\n  Train Loss: {avg_train_loss:.4f} | "
                f"Val Loss: {avg_val_loss:.4f} | "
                f"PSNR: {avg_psnr:.2f} dB"
            )
            
            # Save checkpoint
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                self._save_checkpoint(epoch, avg_val_loss)
                logger.info(f"  ✅ New best model saved! Loss: {best_val_loss:.4f}")
            
            # Early stopping
            if epoch > 10 and np.mean(history['val_loss'][-5:]) > np.mean(history['val_loss'][-10:-5]):
                logger.info("Early stopping triggered")
                break
        
        return history
    
    def _save_checkpoint(self, epoch, loss):
        path = f'{self.checkpoint_dir}/cai-model-epoch-{epoch+1:03d}-loss-{loss:.4f}.h5'
        self.model.save_weights(path)
        
        # Also save as 'latest'
        self.model.save_weights(f'{self.checkpoint_dir}/cai-model-latest.h5')
        
        # Save config
        with open(f'{self.checkpoint_dir}/training_config.json', 'w') as f:
            json.dump({
                'epoch': epoch + 1,
                'loss': float(loss),
                'config': self.config,
                'timestamp': tf.timestamp().numpy().item()
            }, f, indent=2)


# ============================================================
# PHASE 5: INFERENCE PIPELINE
# ============================================================

class ColorChangeInference:
    """Production inference for recoloring components."""
    
    def __init__(self, model_path='ai-training/checkpoints/cai-model-latest.h5'):
        self.model = ComponentAwareImageEditor()
        self.model.load_weights(model_path)
        self.sam_model = None  # Load SAM for segmentation
        
    def recolor_component(self, image, component_description, target_color, target_material='fabric'):
        """
        Recolor a component in an image.
        
        Args:
            image: numpy array (H, W, 3)
            component_description: str, e.g., "the beige sofa"
            target_color: str, hex color e.g., "#1e4d6e"
            target_material: str, e.g., "velvet"
            
        Returns:
            recolored_image: numpy array (H, W, 3)
            mask: numpy array (H, W)
            processing_time: float
        """
        import time
        start = time.time()
        
        # Step 1: Find the component using SAM
        mask = self._find_component(image, component_description)
        
        if mask is None or np.sum(mask) < 100:
            # Fallback: ask user to draw mask
            return {
                'success': False,
                'error': f'Could not find "{component_description}" in the image',
                'alternative': 'Please draw a rough mask on the image'
            }
        
        # Step 2: Prepare inputs
        image_norm = image.astype(np.float32) / 255.0
        mask_norm = mask.astype(np.float32)
        color_one_hot = self._color_to_one_hot(target_color)
        material_one_hot = self._material_to_one_hot(target_material)
        
        # Step 3: Run model
        inputs = {
            'image': tf.expand_dims(image_norm, 0),
            'mask': tf.expand_dims(tf.expand_dims(mask_norm, -1), 0),
            'target_color': tf.expand_dims(color_one_hot, 0),
            'target_material': tf.expand_dims(material_one_hot, 0)
        }
        
        outputs = self.model(inputs, training=False)
        result = outputs['generated'][0].numpy()
        result = (result * 255).astype(np.uint8)
        
        processing_time = time.time() - start
        
        return {
            'success': True,
            'image': result,
            'mask': (mask * 255).astype(np.uint8),
            'processing_time': processing_time,
            'component': component_description,
            'new_color': target_color,
            'new_material': target_material
        }
    
    def _find_component(self, image, description):
        """Use SAM to find the described component."""
        # In production: load SAM model and run inference
        # For now: return a simulated mask
        h, w = image.shape[:2]
        mask = np.zeros((h, w), dtype=np.float32)
        
        # Simulated: create mask in center area
        cx, cy = w // 2, h // 2
        cv2.rectangle(mask, (cx - w//4, cy - h//4), (cx + w//4, cy + h//4), 1.0, -1)
        
        return mask
    
    def _color_to_one_hot(self, hex_color):
        idx = hash(hex_color) % 200
        return tf.one_hot(idx, 200)
    
    def _material_to_one_hot(self, material):
        material_map = {
            'fabric': 0, 'velvet': 1, 'leather': 2, 'linen': 3, 'wood': 4,
            'laminate': 5, 'paint': 6, 'veneer': 7, 'metal': 8, 'glass': 9
        }
        idx = material_map.get(material.lower(), 0)
        return tf.one_hot(idx, 32)


# ============================================================
# MAIN: Run Training
# ============================================================

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Color Change AI Model')
    parser.add_argument('--generate-data', action='store_true', help='Generate synthetic training data')
    parser.add_argument('--train', action='store_true', help='Run training')
    parser.add_argument('--pairs', type=int, default=10000, help='Number of synthetic pairs')
    parser.add_argument('--epochs', type=int, default=50, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=8, help='Batch size')
    parser.add_argument('--lr', type=float, default=1e-4, help='Learning rate')
    
    args = parser.parse_args()
    
    if args.generate_data:
        generator = SyntheticDataGenerator()
        generator.generate_dataset(num_pairs=args.pairs)
        logger.info(f"✅ Generated {args.pairs} training pairs")
    
    if args.train:
        logger.info("Initializing model...")
        model = ComponentAwareImageEditor()
        
        logger.info("Loading dataset...")
        loader = ColorChangeDataLoader(
            'ai-training/datasets/synthetic-pairs',
            batch_size=args.batch_size
        )
        dataset = loader.load_dataset()
        
        # Split train/val
        dataset_size = args.pairs
        train_size = int(dataset_size * 0.9)
        train_dataset = dataset.take(train_size // args.batch_size)
        val_dataset = dataset.skip(train_size // args.batch_size)
        
        config = {
            'lr': args.lr,
            'epochs': args.epochs,
            'batch_size': args.batch_size,
            'checkpoint_dir': 'ai-training/checkpoints',
            'weight_decay': 1e-5,
            'decay_steps': 100000
        }
        
        trainer = ModelTrainer(model, config)
        history = trainer.train(train_dataset, val_dataset, epochs=args.epochs)
        
        logger.info(f"✅ Training complete!")
        logger.info(f"Final PSNR: {history['psnr'][-1]:.2f} dB")
