"""Export a labeled, editable showcase derivative from the approved exterior concept."""

import json
import struct
import sys
from math import pi
from pathlib import Path

import bpy
from mathutils import Vector


root = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
source = Path(bpy.data.filepath).resolve()
working_copy = root / "docs/3d/THERMOBREATH_Conceptual_Exploded.blend"
if source != root / "docs/3d/THERMOBREATH_Konsep_Infografis.blend":
    raise ValueError("Open the website's existing concept .blend as the source")
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.render.fps = 100
scene.render.fps_base = 1
scene.frame_start, scene.frame_end = 0, 100
scene["status"] = "CONCEPTUAL_DEMO | Visualisasi internal ilustratif | Hardware dalam pengembangan"

assembly = bpy.data.collections.new("THERMOBREATH | conceptual assembly for web")
scene.collection.children.link(assembly)


def parent(obj, group):
    matrix = obj.matrix_world.copy()
    obj.parent = group
    obj.matrix_world = matrix
    if obj.name not in assembly.objects:
        assembly.objects.link(obj)
    for collection in list(obj.users_collection):
        if collection != assembly:
            collection.objects.unlink(obj)


def empty(name, point=(0, 0, 0)):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_size = .006
    assembly.objects.link(obj)
    obj.location = point
    bpy.context.view_layer.update()
    return obj


root_node = empty("THERMOBREATH_ROOT")
groups = {}


def group(name, pivot, offset, window, anchor=None, normal=(0, 1, 0)):
    obj = empty(name, pivot)
    obj.parent = root_node
    groups[name] = (obj, Vector(pivot), Vector(offset), window, anchor, normal)
    return obj


front = group("casing_front", (0, 0, 0), (.080, -.065, 0), (0, .62))
rear = group("casing_back", (0, .018, 0), (-.110, .052, 0), (0, .52))
carrier = group("core_carrier", (0, -.008, 0), (.004, .008, 0), (.28, .78))
cup = group("mouthpiece", (-.043, -.002, .038), (-.030, -.023, .079), (.16, .92),
            (-.063, -.019, .038), (-.78, -.62, 0))
lcd = group("lcd_assembly", (0, -.023, .019), (.137, -.040, .012), (.09, .76),
            (0, -.0242, .026), (0, -1, 0))
mos = group("mos_sensor", (-.011, .004, .035), (-.020, .054, .026), (.30, 1),
            (-.011, .013, .037))
environment = group("temperature_humidity", (.012, .003, .042), (.029, .039, .040), (.39, .98),
                    (.012, .0075, .042))
flow = group("flow_sensor", (-.012, .004, .010), (-.049, .043, -.006), (.36, .97),
             (-.012, .014, .010))
controller = group("microcontroller", (.001, .001, -.014), (.030, .043, .007), (.42, 1),
                   (.001, .009, -.013))
power = group("power_assembly", (0, .006, -.044), (-.026, .049, -.030), (.44, .99),
              (0, .016, -.045))
duct = group("sample_path", (-.019, .002, .029), (-.008, .025, -.002), (.41, .93))

for obj in list(scene.objects):
    name = obj.name
    if not name.startswith("THERMOBREATH_"):
        continue
    if "Mouth" in name:
        target = cup
    elif any(part in name for part in ("LCD", "Bezel")):
        target = lcd
    elif any(part in name for part in ("BlueRearPanel", "RearSeam", "Grip")):
        target = rear
    else:
        target = front
    parent(obj, target)


def activate(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def block(name, point, size, bevel, material=None, group=None, segments=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=point)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("Soft edges", "BEVEL")
        modifier.width, modifier.segments = bevel, segments
    if material:
        obj.data.materials.append(material)
    if group is not None:
        parent(obj, group)
    return obj


def material(name, rgb, metal=0, roughness=.42, alpha=1):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, alpha)
    shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Metallic"].default_value = metal
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Alpha"].default_value = alpha
    if alpha < 1:
        mat.surface_render_method = "BLENDED"
    return mat


def cylinder(name, point, radius, depth, mat, group):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth,
                                       location=point, rotation=(pi / 2, 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("Edge break", "BEVEL")
    bevel.width, bevel.segments = min(depth * .18, .0006), 2
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    parent(obj, group)
    return obj


# Hollow the web copy from the rear. The blue cap still closes the opening.
housing = bpy.data.objects["THERMOBREATH_Housing.001"]
shell_cutter = block("Rear cavity tool", (0, .010, 0), (.055, .054, .122), .0035)
activate(shell_cutter)
bpy.ops.object.modifier_apply(modifier=shell_cutter.modifiers[0].name)
activate(housing)
carve = housing.modifiers.new("Concept rear cavity", "BOOLEAN")
carve.operation, carve.solver, carve.object = "DIFFERENCE", "EXACT", shell_cutter
bpy.ops.object.modifier_apply(modifier=carve.name)
bpy.data.objects.remove(shell_cutter, do_unlink=True)
assert len(housing.data.polygons) > 300

steel = material("Brushed grey", (.32, .43, .55), .53)
silver = material("Satin aluminium", (.59, .69, .79), .48)
blue = material("Board blue", (.029, .117, .256), .12)
deep = material("Laminated navy", (.018, .035, .066), .04)
polymer = material("Frost polymer", (.54, .68, .82))
teal = material("Flow guide", (.045, .36, .55), .03, .20, .52)
brass = material("Contact alloy", (.52, .31, .104), .62)

block("Internal carrier cradle", (0, -.008, 0), (.048, .005, .111), .0023, polymer, carrier)
for x in (-.021, .021):
    block("Carrier support rib", (x, -.0053, 0), (.0026, .004, .097), .001, blue, carrier)
    for z in (-.043, .044):
        cylinder("Carrier stud", (x, -.004, z), .0024, .004, steel, carrier)

block("MOS conceptual seat", (-.011, .0035, .037), (.020, .005, .022), .0015, blue, mos)
cylinder("MOS illustration", (-.011, .008, .037), .0074, .007, steel, mos)
cylinder("MOS perforated surface", (-.011, .012, .037), .0062, .0015, deep, mos)
for x, z in [(-.011, .037), (-.0145, .037), (-.0075, .037), (-.011, .0335), (-.011, .0405)]:
    cylinder("MOS perforation detail", (x, .0129, z), .00063, .0005, brass, mos)

block("Environment sensor substrate", (.012, .003, .042), (.0148, .004, .016), .001, blue, environment)
block("Environment sensor casing", (.012, .006, .042), (.011, .004, .011), .0011, silver, environment)
for z in (.0398, .042, .0442):
    block("Environment apertures", (.012, .0081, z), (.0065, .0006, .0008), .00015, deep, environment)

block("Flow sensing body", (-.012, .005, .010), (.026, .009, .018), .0022, polymer, flow)
block("Flow sampling channel", (-.012, .011, .010), (.0269, .007, .009), .0022, teal, flow)
for x in (-.021, -.003):
    block("Flow fixture", (x, .012, .010), (.0027, .006, .011), .0007, blue, flow)

block("Control board illustration", (.001, .001, -.014), (.033, .005, .028), .001, blue, controller)
block("Control module illustration", (.001, .006, -.013), (.015, .005, .014), .0011, deep, controller)
for x in (-.008, .010):
    for z in (-.0185, -.0158, -.013, -.0102, -.0075):
        block("Control contacts", (x, .005, z), (.0039, .0014, .0010), .00022, brass, controller)
for x in (-.012, .014):
    cylinder("Control board mount", (x, .004, -.024), .0014, .002, silver, controller)

block("Power module concept", (0, .006, -.044), (.037, .016, .023), .0035, silver, power)
block("Power module wrap", (0, .014, -.044), (.032, .0024, .018), .0010, deep, power)
for x in (-.009, -.004, .001):
    block("Power illustration marks", (x, .0155, -.042), (.0025, .0006, .008), .00025, teal, power)
block("Power connector concept", (.018, .008, -.044), (.005, .006, .006), .001, brass, power)

curve = bpy.data.curves.new("Concept sample routing", "CURVE")
curve.dimensions = "3D"
curve.resolution_u = 6
curve.bevel_resolution = 3
curve.bevel_depth = .0017
spline = curve.splines.new("BEZIER")
sample_points = [(-.032, -.002, .037), (-.024, .004, .037), (-.018, .011, .032),
                 (-.021, .013, .019), (-.024, .012, .010)]
spline.bezier_points.add(len(sample_points) - 1)
for point, coordinate in zip(spline.bezier_points, sample_points):
    point.co = coordinate
    point.handle_left_type = point.handle_right_type = "AUTO"
guide = bpy.data.objects.new("Conceptual breath route", curve)
assembly.objects.link(guide)
curve.materials.append(teal)
parent(guide, duct)


def web_vector(xyz):
    x, y, z = xyz
    return [round(x, 5), round(z, 5), round(-y, 5)]


def mesh_bounds():
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    points = []
    for obj in assembly.objects:
        if obj.type in {"MESH", "CURVE"}:
            obj_eval = obj.evaluated_get(graph)
            if obj.type == "CURVE":
                mesh = obj_eval.to_mesh()
                points.extend(obj.matrix_world @ vertex.co for vertex in mesh.vertices)
                obj_eval.to_mesh_clear()
            else:
                points.extend(obj.matrix_world @ Vector(corner) for corner in obj_eval.bound_box)
    converted = [web_vector(point) for point in points]
    lower = [min(point[axis] for point in converted) for axis in range(3)]
    upper = [max(point[axis] for point in converted) for axis in range(3)]
    return {"center": [round((low + high) / 2, 5) for low, high in zip(lower, upper)],
            "size": [round(high - low, 5) for low, high in zip(lower, upper)]}


for name, (obj, pivot, offset, window, _, _) in groups.items():
    for time, position in [(0, pivot), (window[0], pivot), (window[1], pivot + offset), (1, pivot + offset)]:
        obj.location = position
        obj.keyframe_insert(data_path="location", frame=round(time * 100), group=name)
    action = obj.animation_data.action
    action.name = "Assembly | " + name
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for channel in bag.fcurves:
                    for point in channel.keyframe_points:
                        point.interpolation = "LINEAR"
    obj["concept"] = "CONCEPTUAL_DEMO"

scene.frame_set(0)
assembled = mesh_bounds()
scene.frame_set(100)
exploded = mesh_bounds()
scene.frame_set(0)

# Per-group material IDs support public model-viewer material picking and highlighting.
for name, (group_obj, *_rest) in groups.items():
    clones = {}
    for obj in group_obj.children:
        for index, original in enumerate(obj.data.materials):
            if original is None:
                continue
            if original.name not in clones:
                variant = original.copy()
                variant.name = name + "__" + original.name
                clones[original.name] = variant
            obj.data.materials[index] = clones[original.name]

bpy.ops.object.select_all(action="DESELECT")
bpy.context.view_layer.objects.active = root_node
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(working_copy), copy=True)

glass = next(mat for mat in bpy.data.materials if mat.name.startswith("mouthpiece__Clear sampling"))
tint = next(node for node in glass.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
tint.inputs["Base Color"].default_value = (.3, .48, .69, 1)
tint.inputs["Alpha"].default_value = .26
tint.inputs["Transmission Weight"].default_value = 0
glass.surface_render_method = "BLENDED"

for obj in assembly.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root_node
glb_path = root / "public/models/thermobreath-exploded.glb"
bpy.ops.export_scene.gltf(
    filepath=str(glb_path), export_format="GLB", use_selection=True, export_yup=True,
    export_animations=True, export_animation_mode="SCENE", export_frame_range=True,
    export_cameras=False, export_lights=False, export_apply=True,
)

raw = glb_path.read_bytes()
chunk_len = struct.unpack_from("<I", raw, 12)[0]
gltf = json.loads(raw[20:20 + chunk_len])
# The exporter emits a track per animated root child. Join the tracks into a
# single clip by remapping sampler indices, without touching the binary data.
animation = {"name": "Assembly", "channels": [], "samplers": []}
for track in gltf["animations"]:
    offset = len(animation["samplers"])
    animation["samplers"].extend(track["samplers"])
    animation["channels"].extend(
        {**channel, "sampler": channel["sampler"] + offset} for channel in track["channels"]
    )
gltf["animations"] = [animation]
encoded = json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
encoded += b" " * (-len(encoded) % 4)
binary = raw[20 + chunk_len:]
raw = struct.pack("<4sIIII", b"glTF", 2, 20 + len(encoded) + len(binary), len(encoded), 0x4e4f534a) + encoded + binary
glb_path.write_bytes(raw)
nodes = gltf["nodes"]
animated_nodes = {nodes[channel["target"]["node"]]["name"] for channel in animation["channels"]}
assert set(groups).issubset(animated_nodes), "A group is missing an animation channel"
for sampler in animation["samplers"]:
    ticks = gltf["accessors"][sampler["input"]]
    assert ticks["min"] == [0.0] and ticks["max"] == [1.0], "Expected a normalized one-second clip"
triangles = sum(gltf["accessors"][p["indices"]]["count"] // 3 for m in gltf["meshes"] for p in m["primitives"])
metadata = {
    "animation": animation["name"],
    "bounds": {"assembled": assembled, "exploded": exploded},
    "groups": {
        name: {"anchor": web_vector(anchor), "normal": web_vector(normal),
               "offset": web_vector(offset), "window": window}
        for name, (_obj, _base, offset, window, anchor, normal) in groups.items() if anchor
    },
}
(root / "src/assembly.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
print("EXPORT", len(raw), "bytes,", triangles, "triangles,", len(gltf["meshes"]), "meshes,", len(animated_nodes), "animated groups")
print("BOUNDS", json.dumps(metadata["bounds"]))
