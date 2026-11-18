"""Create an editable concept .blend, GLB and renders in the website workspace."""

import sys
from math import cos, pi, sin
from pathlib import Path

import bpy
from mathutils import Vector


root = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
if root == Path(bpy.data.filepath).resolve().parent:
    raise ValueError("Use a derivative workspace separate from the source file")
scene = bpy.context.scene
parts = [
    obj for obj in scene.objects
    if obj.name.startswith("THERMOBREATH_") and not obj.hide_get() and not obj.hide_render
    and obj.name not in {"THERMOBREATH_Housing", "THERMOBREATH_TopCarryLoop"}
]
assert len(parts) >= 15, "Expected the original THERMOBREATH concept scene"
for obj in list(scene.objects):
    if obj not in parts:
        bpy.data.objects.remove(obj, do_unlink=True)

# Adapt the mouthpiece in the web derivative to the infographic's elliptical cup.
mouthpiece = bpy.data.objects.get("THERMOBREATH_Mouthpiece.001")
clear = mouthpiece.active_material
bpy.data.objects.remove(mouthpiece, do_unlink=True)
profile = [(-.041, .009, .009), (-.051, .010, .010), (-.060, .014, .016),
           (-.066, .023, .028), (-.069, .029, .036), (-.073, .0305, .039),
           (-.075, .029, .038), (-.074, .0274, .0359), (-.070, .0269, .034),
           (-.067, .021, .0265), (-.061, .0125, .015), (-.049, .0083, .0083),
           (-.041, .0078, .0078)]
sides = 64
vertices = []
for index, (x, width, height) in enumerate(profile):
    for side in range(sides):
        angle = 2 * pi * side / sides
        lip = (width / .0305) ** 2
        vertices.append((x + lip * (.0065 * cos(2 * angle) - .0022 * sin(angle)),
                         -.002 + width * cos(angle), .038 + height * sin(angle) - .008 * lip))
faces = []
for ring in range(len(profile)):
    for side in range(sides):
        a, b = ring * sides + side, ring * sides + (side + 1) % sides
        c = (ring + 1) % len(profile) * sides
        faces.append((c + side, c + (side + 1) % sides, b, a))
mesh = bpy.data.meshes.new("Elliptical sampling cup")
mesh.from_pydata(vertices, [], faces)
mesh.update()
cup = bpy.data.objects.new("THERMOBREATH_Mouthpiece_Web", mesh)
scene.collection.objects.link(cup)
glass = clear.copy()
glass.name = "Clear sampling-cup concept"
glass_shader = next(node for node in glass.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
glass_shader.inputs["Base Color"].default_value = (.89, .95, 1, 1)
glass_shader.inputs["Alpha"].default_value = 1
glass_shader.inputs["Transmission Weight"].default_value = 1
glass_shader.inputs["Roughness"].default_value = .075
glass_shader.inputs["IOR"].default_value = 1.45
mesh.materials.append(glass)
for face in mesh.polygons:
    face.use_smooth = True

accent = bpy.data.materials["TB_Accent_Blue"]
accent_shader = next(node for node in accent.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
accent_shader.inputs["Base Color"].default_value = (.014, .155, .43, 1)


def rounded_block(name, center, dimensions, radius, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new("Soft industrial edges", "BEVEL")
    bevel.width, bevel.segments = radius, 5
    obj.data.materials.append(material)
    return obj


rounded_block("THERMOBREATH_TopLatch", (0, .002, .0698), (.032, .014, .008), .003, accent)
rounded_block("THERMOBREATH_BlueRearPanel", (0, .018, 0), (.064, .017, .130), .008, accent)
navy = bpy.data.materials["TB_Metal_Navy"]
for name in ("THERMOBREATH_BrandLung", "THERMOBREATH_BrandLungStem", "THERMOBREATH_Wordmark"):
    mark = bpy.data.objects[name]
    transform = mark.matrix_world.copy()
    transform.translation.y -= .0014
    mark.matrix_world = transform
bpy.data.objects["THERMOBREATH_Wordmark"].data.materials[0] = navy
for vent in (obj for obj in scene.objects if "_VentDark_" in obj.name):
    transform = vent.matrix_world.copy()
    transform.translation.x -= .0018
    vent.matrix_world = transform

# LCD artwork stays editable in the .blend and is embedded in its GLB export.
lcd = bpy.data.materials.new("LCD | Simulasi nonklinis")
lcd.use_nodes = True
nodes = lcd.node_tree.nodes
shader = next(node for node in nodes if node.type == "BSDF_PRINCIPLED")
shader.inputs["Roughness"].default_value = .48
shader.inputs["Specular IOR Level"].default_value = .06
shader.inputs["Emission Strength"].default_value = .52
art = nodes.new("ShaderNodeTexImage")
art.image = bpy.data.images.load(str(root / "docs/qa/lcd-texture.png"))
art.image.pack()
for input_name in ("Base Color", "Emission Color"):
    lcd.node_tree.links.new(art.outputs["Color"], shader.inputs[input_name])

width, height, radius, center_z = .0468, .0698, .0059, .019
coordinates = []
for corner, (x, z) in enumerate([(1, 1), (-1, 1), (-1, -1), (1, -1)]):
    for step in range(9):
        angle = (corner + step / 8) * pi / 2
        coordinates.append((x * (width / 2 - radius) + radius * cos(angle),
                            z * (height / 2 - radius) + radius * sin(angle)))
surface = bpy.data.meshes.new("UV mapped LCD glass")
surface.from_pydata([(x, -.02406, center_z + z) for x, z in coordinates], [], [tuple(range(len(coordinates)))])
surface.update()
uv = surface.uv_layers.new()
for loop in surface.loops:
    x, z = coordinates[loop.vertex_index]
    uv.data[loop.index].uv = (x / width + .5, z / height + .5)
display = bpy.data.objects.new("THERMOBREATH_LCD_Artwork", surface)
scene.collection.objects.link(display)
surface.materials.append(lcd)

def export_glb(name):
    bpy.ops.object.select_all(action="SELECT")
    bpy.context.view_layer.objects.active = bpy.data.objects["THERMOBREATH_Housing.001"]
    bpy.ops.export_scene.gltf(
        filepath=str(root / f"public/models/{name}.glb"),
        export_format="GLB", use_selection=True, export_yup=True,
        export_animations=False, export_cameras=False, export_lights=False, export_apply=True,
    )


# Standard alpha blending stays legible against the CSS stage in a transparent
# WebGL canvas. The editable asset and Cycles posters retain real transmission.
glass_shader.inputs["Base Color"].default_value = (.3, .48, .69, 1)
glass_shader.inputs["Alpha"].default_value = .26
glass_shader.inputs["Transmission Weight"].default_value = 0
glass.surface_render_method = "BLENDED"
export_glb("thermobreath-concept")
if "--glb-only" in sys.argv[sys.argv.index("--") + 2:]:
    sys.exit(0)
glass.surface_render_method = "DITHERED"
glass_shader.inputs["Alpha"].default_value = 1
glass_shader.inputs["Base Color"].default_value = (.89, .95, 1, 1)
glass_shader.inputs["Transmission Weight"].default_value = 1
bpy.ops.object.select_all(action="DESELECT")
studio = bpy.data.collections.new("Studio | kamera dan pencahayaan")
scene.collection.children.link(studio)

scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.cycles.film_transparent_glass = True
scene.cycles.film_transparent_roughness = .12
scene.render.image_settings.color_mode = "RGBA"
scene.world.use_nodes = True
background = next(node for node in scene.world.node_tree.nodes if node.type == "BACKGROUND")
background.inputs["Color"].default_value = (.55, .68, .9, 1)
background.inputs["Strength"].default_value = .32


def aim(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


for label, position, power, size, color in [
    ("Key", (-.19, -.22, .24), 4.5, .27, (.93, .97, 1)),
    ("Fill", (.13, -.16, .05), 2, .20, (.78, .89, 1)),
    ("Rim", (.10, .14, .17), 4.5, .17, (.75, .88, 1)),
]:
    light = bpy.data.lights.new(label, "AREA")
    light.energy, light.size, light.color = power, size, color
    obj = bpy.data.objects.new(label, light)
    studio.objects.link(obj)
    obj.location = position
    aim(obj, (0, 0, 0))

camera = bpy.data.cameras.new("Concept camera")
camera.type = "ORTHO"
camera.ortho_scale = .187
view = bpy.data.objects.new("Concept camera", camera)
studio.objects.link(view)
scene.camera = view

def render(name, position, target, roll=0):
    view.location = position
    aim(view, target)
    view.rotation_euler.rotate_axis("Z", roll)
    scene.render.filepath = str(root / f"docs/qa/render-{name}.png")
    bpy.ops.render.render(write_still=True)


def save_concept(name):
    bpy.ops.object.select_all(action="DESELECT")
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_perspective = "CAMERA"
                area.spaces.active.shading.type = "MATERIAL"
    bpy.context.preferences.filepaths.save_version = 0
    scene["status"] = "KONSEP R&D — SIMULASI — BUKAN HASIL DIAGNOSIS MEDIS."
    bpy.ops.wm.save_as_mainfile(filepath=str(root / f"docs/3d/{name}.blend"), copy=True)


view.location = (-.177, -.35, .066)
aim(view, (-.016, -.001, .003))
view.rotation_euler.rotate_axis("Z", -.15)
save_concept("THERMOBREATH_Konsep_Infografis")
render("front", (-.177, -.35, .066), (-.016, -.001, .003), -.15)
render("side", (-.34, -.08, .048), (-.012, 0, .001))
render("rear", (.13, .35, .083), (-.012, 0, .001))
