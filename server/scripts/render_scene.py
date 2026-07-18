import sys
import os
import json
import math

try:
    import bpy
except ImportError:
    print("Error: This script must be run inside Blender's python environment.")
    sys.exit(1)

def parse_args():
    args = sys.argv
    if "--" in args:
        idx = args.index("--")
        return args[idx+1:]
    return []

def delete_all_objects():
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')
    # Select all
    bpy.ops.object.select_all(action='SELECT')
    # Delete
    bpy.ops.object.delete(use_global=False)
    
    # Delete unused materials and meshes to keep memory clean
    for material in bpy.data.materials:
        bpy.data.materials.remove(material)
    for mesh in bpy.data.meshes:
        bpy.data.meshes.remove(mesh)

def create_pbr_material(name, base_color, metallic=0.0, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = base_color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
    return mat

def create_box(name, width, height, depth, x, y, z, rot_z=0.0, material=None):
    # Blender cube size is 2.0 by default, so we scale by half dimensions
    bpy.ops.mesh.primitive_cube_add(
        size=1.0, 
        calc_uvs=True, 
        location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = name
    
    # Set scale
    obj.scale = (width, depth, height)
    
    # Rotate
    obj.rotation_euler[2] = rot_z
    
    # Position (Blender origin is center, so z-offset centers box)
    obj.location = (x, y, z)
    
    if material:
        obj.data.materials.append(material)
        
    return obj

def scene_model(scene_data):
    """Read scene.v1 first, with legacy room_shell compatibility."""
    level = (scene_data.get('levels') or [{}])[0]
    shell = scene_data.get('room_shell', {})
    walls = level.get('walls') or scene_data.get('walls') or shell.get('walls', [])
    modules = level.get('modules') or scene_data.get('placed_modules', [])
    height_mm = shell.get('heightMm', 2800)
    if walls:
        xs = [point for wall in walls for point in (wall.get('x1', wall.get('startMm', {}).get('x', 0)), wall.get('x2', wall.get('endMm', {}).get('x', 0)))]
        ys = [point for wall in walls for point in (wall.get('y1', wall.get('startMm', {}).get('y', 0)), wall.get('y2', wall.get('endMm', {}).get('y', 0)))]
        width_mm = max(max(xs) - min(xs), 1000)
        depth_mm = max(max(ys) - min(ys), 1000)
        height_mm = max([height_mm] + [wall.get('heightMm', height_mm) for wall in walls])
    else:
        width_mm = shell.get('widthMm', 4000)
        depth_mm = shell.get('depthMm', 3000)
    return walls, modules, width_mm / 1000.0, depth_mm / 1000.0, height_mm / 1000.0

def build_room(scene_data):
    # Standard materials
    wall_mat = create_pbr_material("WallMaterial", (0.95, 0.93, 0.88, 1.0), 0.0, 0.8) # Cream
    floor_mat = create_pbr_material("FloorMaterial", (0.9, 0.88, 0.83, 1.0), 0.0, 0.3) # Beige marble feel
    ceiling_mat = create_pbr_material("CeilingMaterial", (0.98, 0.98, 0.98, 1.0), 0.0, 0.9) # Warm white

    walls, _, room_w, room_d, room_h = scene_model(scene_data)
    
    # Build Floor
    create_box("Floor", room_w, 0.02, room_d, 0, 0, -0.01, material=floor_mat)
    # Build Ceiling
    create_box("Ceiling", room_w, 0.02, room_d, 0, 0, room_h + 0.01, material=ceiling_mat)

    # Build walls
    # If explicit walls list is empty, build default perimeter walls
    if not walls:
        t = 0.15 # 150mm wall thickness
        # North wall
        create_box("Wall_North", room_w + 2*t, room_h, t, 0, room_d/2 + t/2, room_h/2, material=wall_mat)
        # South wall
        create_box("Wall_South", room_w + 2*t, room_h, t, 0, -room_d/2 - t/2, room_h/2, material=wall_mat)
        # East wall
        create_box("Wall_East", t, room_h, room_d, room_w/2 + t/2, 0, room_h/2, material=wall_mat)
        # West wall
        create_box("Wall_West", t, room_h, room_d, -room_w/2 - t/2, 0, room_h/2, material=wall_mat)
    else:
        for i, w in enumerate(walls):
            # Parse wall start/end coordinates (in mm)
            x1, y1 = w.get("x1", 0) / 1000.0, w.get("y1", 0) / 1000.0
            x2, y2 = w.get("x2", 0) / 1000.0, w.get("y2", 0) / 1000.0
            h = w.get("heightMm", room_h * 1000) / 1000.0
            t = w.get("thicknessMm", 150) / 1000.0
            
            # Midpoint
            mx, my = (x1 + x2) / 2.0, (y1 + y2) / 2.0
            # Length
            length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            # Angle
            angle = math.atan2(y2 - y1, x2 - x1)
            
            # Create wall box
            create_box(f"Wall_{i}", length, h, t, mx, my, h/2, rot_z=angle, material=wall_mat)

def build_modules(scene_data):
    # Material library from scene colors
    materials = {
        'carcass': create_pbr_material("CarcassMat", (0.9, 0.88, 0.85, 1.0), 0.0, 0.6), # Beige laminate
        'shutter_wood': create_pbr_material("ShutterWoodMat", (0.45, 0.28, 0.16, 1.0), 0.0, 0.4), # Walnut veneer
        'shutter_charcoal': create_pbr_material("ShutterDarkMat", (0.1, 0.1, 0.11, 1.0), 0.1, 0.7), # Charcoal matte
        'shutter_cream': create_pbr_material("ShutterCreamMat", (0.95, 0.93, 0.88, 1.0), 0.0, 0.5), # Matte cream
        'countertop': create_pbr_material("CountertopMat", (0.92, 0.91, 0.89, 1.0), 0.0, 0.2), # Marble/quartz
        'handle': create_pbr_material("HandleMat", (0.05, 0.05, 0.05, 1.0), 0.9, 0.3) # Black metal
    }

    _, modules, _, _, _ = scene_model(scene_data)
    for idx, m in enumerate(modules):
        w = m.get("widthMm", 600) / 1000.0
        h = m.get("heightMm", 720) / 1000.0
        d = m.get("depthMm", 560) / 1000.0
        
        # Coordinates relative to room center
        x = m.get("xOffsetMm", 0) / 1000.0
        y = m.get("yOffsetMm", 0) / 1000.0
        z = m.get("zOffsetMm", 0) / 1000.0
        rot_z = m.get("rotationDeg", 0.0) * math.pi / 180.0
        
        m_type = m.get("type", "base")
        
        # Color mapping based on rules or tags
        shutter_color = m.get("shutterMaterial", "shutter_cream")
        shutter_mat = materials.get(shutter_color, materials['shutter_cream'])
        
        if m_type == 'kitchen_counter':
            # Create slab
            create_box(f"Countertop_{idx}", w, h, d, x, y, z + h/2, rot_z=rot_z, material=materials['countertop'])
        else:
            # Create carcass
            carcass_name = f"Module_{m_type}_{idx}"
            create_box(carcass_name, w, h, d, x, y, z + h/2, rot_z=rot_z, material=materials['carcass'])
            
            # Simple detail representing front shutter door (offset by 1cm forward)
            # Find front direction based on rotation
            # For 0 rotation, front is in -Y (pointing out towards room center)
            # Let's add a thin plate on front
            shutter_thickness = 0.018 # 18mm
            sy_offset = -(d/2 + shutter_thickness/2)
            
            # Rotate offset
            cos_r, sin_r = math.cos(rot_z), math.sin(rot_z)
            sx = x + (0 * cos_r - sy_offset * sin_r)
            sy = y + (0 * sin_r + sy_offset * cos_r)
            
            shutter_name = f"Shutter_{m_type}_{idx}"
            create_box(shutter_name, w - 0.004, h - 0.004, shutter_thickness, sx, sy, z + h/2, rot_z=rot_z, material=shutter_mat)
            
            # Add simple handle
            # Placed near top for base units, near bottom for wall units
            hy = sy_offset - 0.01
            hx = x + (0 * cos_r - hy * sin_r)
            hy_world = y + (0 * sin_r + hy * cos_r)
            hz = z + h - 0.1 if m_type == 'base' else z + 0.1
            
            handle_w = 0.12 # 120mm bar handle
            handle_h = 0.012
            handle_d = 0.02
            create_box(f"Handle_{idx}", handle_w, handle_h, handle_d, hx, hy_world, hz, rot_z=rot_z, material=materials['handle'])

def setup_lighting(scene_data):
    # Add ambient world light
    world = bpy.context.scene.world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value = (0.9, 0.92, 0.95, 1.0) # Soft blue sky ambient
        bg.inputs['Strength'].default_value = 0.3
        
    # Main ceiling area light for ambient interior illumination
    room_shell = scene_data.get("room_shell", {})
    room_w = room_shell.get("widthMm", 4000) / 1000.0
    room_d = room_shell.get("depthMm", 3000) / 1000.0
    room_h = room_shell.get("heightMm", 2800) / 1000.0

    bpy.ops.object.light_add(type='AREA', radius=1.5, location=(0, 0, room_h - 0.1))
    light_obj = bpy.context.active_object
    light_obj.name = "Ceiling_Ambient_Light"
    light_obj.data.energy = 250.0 # Watts
    light_obj.data.color = (1.0, 0.98, 0.95) # Warm 3500K CCT feel
    
    # Custom light objects from scene graph
    lights = scene_data.get("lighting", [])
    for idx, l in enumerate(lights):
        lx = l.get("xOffsetMm", 0) / 1000.0
        ly = l.get("yOffsetMm", 0) / 1000.0
        lz = l.get("zOffsetMm", room_h - 0.2) / 1000.0
        l_type = l.get("type", "spot").upper()
        energy = l.get("intensityWatts", 35.0)
        
        # Parse Kelvin to RGB rough mapping
        cct = l.get("temperatureKelvin", 3000)
        color = (1.0, 0.9, 0.8) # default warm
        if cct <= 2700: color = (1.0, 0.85, 0.7)
        elif cct >= 4000: color = (0.95, 0.95, 1.0)
        
        bpy.ops.object.light_add(type=l_type, location=(lx, ly, lz))
        custom_light = bpy.context.active_object
        custom_light.name = f"Light_{idx}"
        custom_light.data.energy = energy
        custom_light.data.color = color

def setup_camera(camera_preset, scene_data):
    _, _, room_w, room_d, room_h = scene_model(scene_data)

    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "RenderCamera"
    bpy.context.scene.camera = cam

    if camera_preset == 'perspective_main':
        # Position camera in a back corner pointing towards the center of room/modules
        cam.location = (-room_w/2 + 0.5, -room_d/2 + 0.5, 1.5)
        # Point camera down and right
        cam.rotation_euler = (math.radians(75), 0, math.radians(-45))
        cam.data.lens = 24 # Wide angle focal length
        
    elif camera_preset.startswith('elevation_'):
        # Orthographic projection for AutoCAD 2D drawings elevation matching
        cam.data.type = 'ORTHO'
        cam.data.ortho_scale = max(room_w, room_h) * 1.1
        
        # Positioning perpendicular to different walls
        if 'wall_a' in camera_preset: # Frontal view facing South wall (from North looking South)
            cam.location = (0, room_d/2 + 1.0, room_h/2)
            cam.rotation_euler = (math.radians(90), 0, math.radians(180))
        elif 'wall_b' in camera_preset: # Side view facing West wall (from East looking West)
            cam.location = (room_w/2 + 1.0, 0, room_h/2)
            cam.rotation_euler = (math.radians(90), 0, math.radians(90))
        else: # Default frontal
            cam.location = (0, -room_d/2 - 1.0, room_h/2)
            cam.rotation_euler = (math.radians(90), 0, 0)
    else:
        # Default perspective
        cam.location = (0, -room_d - 0.5, 1.6)
        cam.rotation_euler = (math.radians(85), 0, 0)
        cam.data.lens = 28

def apply_id_mask_materials(scene_data):
    # Disable all world lighting to prevent background light bleeding
    world = bpy.context.scene.world
    if world and world.use_nodes:
        bg = world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs['Strength'].default_value = 0.0
            bg.inputs['Color'].default_value = (0.0, 0.0, 0.0, 1.0)
            
    # Delete all light sources so only self-emissive objects render
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT':
            obj.select_set(True)
    bpy.ops.object.delete()

    # Create solid black material for walls/ceiling/floor/background
    black_mat = bpy.data.materials.new(name="Mask_Black")
    black_mat.use_nodes = True
    black_mat.node_tree.nodes.clear()
    nodes = black_mat.node_tree.nodes
    links = black_mat.node_tree.links
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.0, 0.0, 0.0, 1.0)
    emission.inputs['Strength'].default_value = 1.0
    links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    # Paint walls/ceiling/floor black
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            obj.data.materials.clear()
            obj.data.materials.append(black_mat)

    # Predefined high-contrast flat colors for cabinet module indices
    colors = [
        (1.0, 0.0, 0.0, 1.0),    # 0: Red
        (0.0, 1.0, 0.0, 1.0),    # 1: Green
        (0.0, 0.0, 1.0, 1.0),    # 2: Blue
        (1.0, 1.0, 0.0, 1.0),    # 3: Yellow
        (0.0, 1.0, 1.0, 1.0),    # 4: Cyan
        (1.0, 0.0, 1.0, 1.0),    # 5: Magenta
        (1.0, 0.5, 0.0, 1.0),    # 6: Orange
        (0.5, 0.0, 0.5, 1.0),    # 7: Purple
        (0.0, 0.5, 0.5, 1.0),    # 8: Teal
        (0.5, 0.5, 0.5, 1.0)     # 9: Gray
    ]

    modules = scene_data.get("placed_modules", [])
    for idx, m in enumerate(modules):
        color = colors[idx % len(colors)]
        
        mat_name = f"Mask_Module_{idx}"
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        mat.node_tree.nodes.clear()
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        
        output = nodes.new(type='ShaderNodeOutputMaterial')
        emission = nodes.new(type='ShaderNodeEmission')
        emission.inputs['Color'].default_value = color
        emission.inputs['Strength'].default_value = 1.0
        links.new(emission.outputs['Emission'], output.inputs['Surface'])
        
        # Match carcass, shutters, countertop, handles by name suffix "_idx"
        suffix = f"_{idx}"
        for obj in bpy.data.objects:
            if obj.type == 'MESH' and (obj.name.endswith(suffix) or f"_{idx}_" in obj.name or obj.name == f"Handle_{idx}"):
                obj.data.materials.clear()
                obj.data.materials.append(mat)

def render_scene(output_path, quality='draft', mode='render', seed=0):
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = output_path
    
    # Render dimensions
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    
    # Configure Render Engine
    if mode == 'mask':
        scene.render.engine = 'BLENDER_EEVEE' if hasattr(bpy.types, 'BLENDER_EEVEE') else 'BLENDER_EEVEE_NEXT'
        if hasattr(scene, 'eevee'):
            scene.eevee.taa_render_samples = 1
            scene.eevee.use_gtao = False
            scene.eevee.use_ssr = False
    elif quality == 'final':
        scene.render.engine = 'CYCLES'
        # GPU is an optimization, never a requirement for reproducible output.
        scene.cycles.device = 'CPU'
        try:
            cycles_pref = bpy.context.preferences.addons['cycles'].preferences
            cycles_pref.compute_device_type = 'CUDA'
            for device in cycles_pref.get_devices_for_type('CUDA'):
                device.use = True
            scene.cycles.device = 'GPU'
        except Exception as err:
            print(f"Cycles GPU unavailable; using CPU: {err}")
        scene.cycles.seed = seed
        scene.cycles.samples = 256
        scene.cycles.use_denoising = True
    else: # draft
        scene.render.engine = 'BLENDER_EEVEE' if hasattr(bpy.types, 'BLENDER_EEVEE') else 'BLENDER_EEVEE_NEXT'
        if hasattr(scene, 'eevee'):
            scene.eevee.taa_render_samples = 16
            scene.eevee.use_gtao = True
            scene.eevee.use_ssr = True
            
    print(f"Starting render using {scene.render.engine} (mode={mode})...")
    bpy.ops.render.render(write_still=True)
    print("Render finished.")

def main():
    args = parse_args()
    
    scene_path = ""
    output_path = "storage/render/output.png"
    camera_preset = "perspective_main"
    quality = "draft"
    mode = "render"
    seed = 0
    
    if "--scene" in args:
        scene_path = args[args.index("--scene") + 1]
    if "--output" in args:
        output_path = args[args.index("--output") + 1]
    if "--camera" in args:
        camera_preset = args[args.index("--camera") + 1]
    if "--quality" in args:
        quality = args[args.index("--quality") + 1]
    if "--mode" in args:
        mode = args[args.index("--mode") + 1]
    if "--seed" in args:
        seed = int(args[args.index("--seed") + 1])
        
    if not scene_path or not os.path.exists(scene_path):
        print(f"Error: scene file not found or invalid at '{scene_path}'")
        sys.exit(1)
        
    print(f"Loading scene: {scene_path}")
    with open(scene_path, 'r', encoding='utf-8') as f:
        scene_data = json.load(f)
        
    # Build scene in Blender
    delete_all_objects()
    build_room(scene_data)
    build_modules(scene_data)
    
    if mode == "mask":
        apply_id_mask_materials(scene_data)
        setup_camera(camera_preset, scene_data)
    else:
        setup_lighting(scene_data)
        setup_camera(camera_preset, scene_data)
    
    # Render
    render_scene(output_path, quality, mode, seed)

if __name__ == "__main__":
    main()
