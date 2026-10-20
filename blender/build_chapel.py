# -*- coding: utf-8 -*-
"""
Arnya Seashore Chapel — parametric build script
------------------------------------------------
Runs inside Blender 4.5 (headless):
    blender -b -P blender/build_chapel.py

It builds the chapel described by Vector Architects' Seashore Chapel
(Aranya, Qinhuangdao): elevated white stucco hall on slender columns,
steep gable roof, bell niche, cross, wooden interior, sea-view terrace,
twin entrance stairs with a slim centre gap.

Outputs:
    blender/aranya-chapel.blend
    public/models/chapel.glb
    blender/textures/*.png  (packed into both)

All dimensions are real-world metres.  Blender axes: X width, Y length
(+Y = sea side), Z up.  glTF export converts to Y-up automatically.
"""

import bpy
import bmesh
import math
import os
import random
import numpy as np
from mathutils import Vector, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TEX_DIR = os.path.join(HERE, "textures")
os.makedirs(TEX_DIR, exist_ok=True)

# ---------------------------------------------------------------- dimensions
FLOOR = 2.55          # hall floor level
SLAB = 0.35           # platform slab thickness
EAVE = 6.05           # top of side walls
RIDGE = 12.20         # ridge height
HALF_X = 3.30         # inner half width
WALL_T = 0.36         # wall thickness
IN_Y0, IN_Y1 = -5.40, 5.40
GABLE_Y = 5.58        # outer face of gables
ROOF_T = 0.30
STAIR_RISE = 0.17
STAIR_RUN = 0.34
STAIR_N = 15
STAIR_HALF = 2.70     # half width of the twin stair
GAP_HALF = 0.30       # 600 mm centre gap

random.seed(7)
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- utilities
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = 24
    sc.cycles.use_denoising = True
    sc.render.film_transparent = False


def deselect():
    for ob in bpy.context.selected_objects:
        ob.select_set(False)


def activate(ob):
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)


def apply_all(ob):
    deselect()
    activate(ob)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.select_set(False)


def box(name, size, loc, rot=(0, 0, 0), mat=None, apply=True):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    ob.rotation_euler = Euler(rot)
    if apply:
        apply_all(ob)
    if mat:
        ob.data.materials.append(mat)
    return ob


def cyl(name, radius, depth, loc, rot=(0, 0, 0), verts=16, mat=None, caps=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth,
                                        location=loc, end_fill_type='NGON' if caps else 'NOTHING')
    ob = bpy.context.object
    ob.name = name
    ob.rotation_euler = Euler(rot)
    apply_all(ob)
    if mat:
        ob.data.materials.append(mat)
    return ob


def prism(name, poly_xz, y0, y1, mat=None):
    """Extrude a polygon drawn in the XZ plane along Y."""
    n = len(poly_xz)
    verts = [(x, y0, z) for x, z in poly_xz] + [(x, y1, z) for x, z in poly_xz]
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, j + n, i + n))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    if mat:
        ob.data.materials.append(mat)
    return ob


def cut(target, cutter, name=None):
    deselect()
    activate(target)
    m = target.modifiers.new("cut", 'BOOLEAN')
    m.operation = 'DIFFERENCE'
    m.solver = 'EXACT'
    m.object = cutter
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    if name:
        target.name = name
    target.select_set(False)
    return target


def join(objs, name):
    deselect()
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = name
    ob.select_set(False)
    return ob


def bevel(ob, width=0.018, segments=2):
    """Small chamfer so the edges catch light instead of looking CG-flat."""
    deselect()
    activate(ob)
    try:
        m = ob.modifiers.new("bev", 'BEVEL')
        m.width = width
        m.segments = segments
        m.limit_method = 'ANGLE'
        m.angle_limit = math.radians(38)
        m.use_clamp_overlap = True
        bpy.ops.object.modifier_apply(modifier=m.name)
    except Exception as exc:  # noqa: BLE001
        print("bevel skipped:", ob.name, exc)
    finally:
        ob.select_set(False)


# ---------------------------------------------------------------- textures
def fbm(shape, octaves=5, seed=0, persistence=0.55):
    h, w = shape
    out = np.zeros(shape, dtype=np.float32)
    amp = 1.0
    total = 0.0
    r = np.random.default_rng(seed)
    for o in range(octaves):
        gh = max(2, int(2 ** (o + 2)))
        gw = max(2, int(2 ** (o + 2)))
        grid = r.random((gh + 1, gw + 1)).astype(np.float32)
        ys = np.linspace(0, gh, h, endpoint=False)
        xs = np.linspace(0, gw, w, endpoint=False)
        y0 = ys.astype(int); x0 = xs.astype(int)
        fy = (ys - y0)[:, None]; fx = (xs - x0)[None, :]
        fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        a = grid[y0][:, x0]; b = grid[y0][:, x0 + 1]
        c = grid[y0 + 1][:, x0]; d = grid[y0 + 1][:, x0 + 1]
        layer = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
        out += layer * amp
        total += amp
        amp *= persistence
    out /= total
    return out


def to_image(name, rgb, path=None, non_color=False):
    h, w = rgb.shape[:2]
    img = bpy.data.images.new(name, width=w, height=h, alpha=False)
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    flat = np.ones((h, w, 4), dtype=np.float32)
    flat[:, :, :3] = np.clip(rgb, 0, 1)
    img.pixels.foreach_set(flat.reshape(-1))
    path = path or os.path.join(TEX_DIR, name + ".png")
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    img.pack()
    return img


def normal_from_height(hgt, strength=2.0):
    gy, gx = np.gradient(hgt)
    nx = -gx * strength
    ny = -gy * strength
    nz = np.ones_like(hgt)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.dstack([nx / ln, ny / ln, nz / ln]) * 0.5 + 0.5


def make_textures():
    S = 512
    y, x = np.mgrid[0:S, 0:S].astype(np.float32) / S

    # --- fine plaster grain: coarse trowel marks + fine sand grain
    coarse = fbm((S, S), 3, seed=11, persistence=0.6)
    fine = fbm((S, S), 6, seed=12, persistence=0.5)
    grain = 0.62 * coarse + 0.38 * fine
    stucco_h = grain + 0.06 * rng.normal(size=(S, S))
    alb = np.dstack([0.955, 0.945, 0.925]) * (0.965 + 0.07 * stucco_h)[:, :, None]
    alb += 0.012 * rng.normal(size=(S, S, 1))
    stucco_albedo = to_image("stucco_albedo", np.clip(alb, 0, 1))
    stucco_normal = to_image("stucco_normal", normal_from_height(stucco_h, 2.6), non_color=True)
    rough = (0.78 + 0.16 * (1 - stucco_h) + 0.04 * rng.normal(size=(S, S)))
    stucco_rough = to_image("stucco_rough", np.clip(rough, 0, 1)[:, :, None].repeat(3, 2), non_color=True)

    # --- warm oak planks (floor + ceiling)
    planks = 8
    row = (y * planks)
    pid = np.floor(row).astype(int) % planks
    off = (pid * 0.37) % 1.0
    u = (x + off) % 1.0
    seam = np.minimum(np.abs(row - np.round(row)) * planks, 1.0)
    seam = np.clip(seam / 0.06, 0, 1)
    grain_lines = 0.5 + 0.5 * np.sin((u * 46 + fbm((S, S), 4, 21) * 7 + pid * 3.1) * math.pi)
    tone = 0.55 + 0.16 * pid / planks + 0.10 * grain_lines + 0.08 * fbm((S, S), 4, 23)
    wood = np.dstack([0.42 * tone, 0.29 * tone, 0.19 * tone])
    wood = wood * seam[:, :, None] * 0.65 + wood * 0.35
    wood_albedo = to_image("wood_albedo", np.clip(wood, 0, 1))
    wood_h = 0.25 * grain_lines + 0.55 * fbm((S, S), 5, 24) + 0.2 * seam
    wood_normal = to_image("wood_normal", normal_from_height(wood_h, 0.9), non_color=True)
    wood_rough = to_image("wood_rough", np.clip(0.42 + 0.18 * (1 - grain_lines), 0, 1)[:, :, None].repeat(3, 2), non_color=True)

    # --- dark teak for benches / door (warmer, finer grain)
    tone2 = 0.42 + 0.10 * grain_lines + 0.06 * fbm((S, S), 4, 31)
    teak = np.dstack([0.30 * tone2, 0.20 * tone2, 0.125 * tone2])
    teak_albedo = to_image("teak_albedo", np.clip(teak, 0, 1))

    return {
        "stucco_albedo": stucco_albedo, "stucco_normal": stucco_normal, "stucco_rough": stucco_rough,
        "wood_albedo": wood_albedo, "wood_normal": wood_normal, "wood_rough": wood_rough,
        "teak_albedo": teak_albedo,
    }


def pbr(name, albedo=None, rough=0.6, metal=0.0, normal=None, rough_tex=None,
        color=(1, 1, 1), alpha=1.0, emission=None, emission_strength=0.0, uv_scale=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = 'BLEND'
        mat.show_transparent_back = True
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    texco = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (uv_scale, uv_scale, uv_scale)
    nt.links.new(texco.outputs["UV"], mapping.inputs["Vector"])
    if albedo is not None:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = albedo
        t.interpolation = 'Linear'
        nt.links.new(mapping.outputs["Vector"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    if normal is not None:
        tn = nt.nodes.new("ShaderNodeTexImage")
        tn.image = normal
        tn.interpolation = 'Linear'
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = 1.0
        nt.links.new(mapping.outputs["Vector"], tn.inputs["Vector"])
        nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    if rough_tex is not None:
        tr = nt.nodes.new("ShaderNodeTexImage")
        tr.image = rough_tex
        tr.interpolation = 'Linear'
        nt.links.new(mapping.outputs["Vector"], tr.inputs["Vector"])
        nt.links.new(tr.outputs["Color"], bsdf.inputs["Roughness"])
    return mat


# ---------------------------------------------------------------- build
def build():
    reset()
    T = make_textures()

    m_stucco = pbr("M_Stucco", T["stucco_albedo"], 0.86, normal=T["stucco_normal"],
                   rough_tex=T["stucco_rough"], uv_scale=1.0)
    m_plaster_in = pbr("M_StuccoInner", T["stucco_albedo"], 0.9, normal=T["stucco_normal"],
                       rough_tex=T["stucco_rough"], color=(0.98, 0.965, 0.94), uv_scale=1.0)
    m_concrete = pbr("M_Concrete", T["stucco_albedo"], 0.82, normal=T["stucco_normal"],
                     rough_tex=T["stucco_rough"], color=(0.86, 0.85, 0.83), uv_scale=1.4)
    m_wood = pbr("M_Oak", T["wood_albedo"], 0.5, normal=T["wood_normal"], rough_tex=T["wood_rough"], uv_scale=1.0)
    m_teak = pbr("M_Teak", T["teak_albedo"], 0.44, normal=T["wood_normal"], uv_scale=1.0)
    m_steel = pbr("M_Steel", None, 0.38, 0.85, color=(0.16, 0.17, 0.18))
    m_brass = pbr("M_Brass", None, 0.3, 0.9, color=(0.62, 0.47, 0.26))
    m_bronze = pbr("M_Bronze", None, 0.35, 0.8, color=(0.18, 0.15, 0.12))
    m_glass = pbr("M_Glass", None, 0.05, 0.0, color=(0.86, 0.92, 0.93), alpha=0.22)
    m_lamp = pbr("M_Lamp", None, 0.4, 0.0, color=(1.0, 0.93, 0.82),
                 emission=(1.0, 0.78, 0.52), emission_strength=6.0)
    m_white_emit = pbr("M_Glow", None, 0.5, 0.0, color=(1, 1, 1),
                       emission=(1.0, 0.95, 0.88), emission_strength=2.0)
    m_drift = pbr("M_Driftwood", None, 0.92, 0.0, color=(0.55, 0.50, 0.43))
    m_rock = pbr("M_Rock", None, 0.95, 0.0, color=(0.40, 0.39, 0.37))
    m_post = pbr("M_Post", None, 0.85, 0.0, color=(0.34, 0.29, 0.23))

    parts = []

    # ---------------- platform, undercroft, columns
    slab = box("Platform", (7.4, 12.6, SLAB), (0, 0.2, FLOOR - SLAB / 2), mat=m_concrete)
    parts.append(slab)

    # terrace slab towards the sea
    terrace = box("Terrace_Slab", (7.4, 3.4, 0.28), (0, GABLE_Y + 1.7, FLOOR - 0.24), mat=m_concrete)
    parts.append(terrace)

    for sx in (-2.9, 2.9):
        for sy in (-4.6, 4.4):
            parts.append(box("Column", (0.26, 0.26, FLOOR - SLAB), (sx, sy, (FLOOR - SLAB) / 2), mat=m_stucco))

    # undercroft bench
    parts.append(box("UndercroftBench", (3.2, 0.42, 0.12), (0, -4.4, 0.46), mat=m_teak))
    for bx in (-1.5, 1.5):
        parts.append(box("UndercroftBenchLeg", (0.12, 0.36, 0.46), (bx, -4.4, 0.23), mat=m_teak))

    # ---------------- hall walls (side walls + inner lining)
    wall_h = EAVE - FLOOR
    for sx in (-1, 1):
        x = sx * (HALF_X + WALL_T / 2)
        parts.append(box("SideWall", (WALL_T, IN_Y1 - IN_Y0 + 2 * WALL_T, wall_h),
                         (x, 0.0, FLOOR + wall_h / 2), mat=m_stucco))
        # inner plaster lining, slightly inset
        # (interior plaster is the wall material itself — no extra shell)

    # ---------------- gables
    xo = HALF_X + WALL_T
    # pentagon: vertical sides to the eave, then follow the roof pitch so the
    # wall closes the roof underside without a gap along the slopes
    tri = [(-xo, FLOOR), (xo, FLOOR), (xo, EAVE + 0.34), (0, RIDGE + 0.06), (-xo, EAVE + 0.34)]
    gable_land = prism("GableLand", tri, -GABLE_Y, -GABLE_Y + WALL_T, mat=m_stucco)
    gable_sea = prism("GableSea", tri, GABLE_Y - WALL_T, GABLE_Y, mat=m_stucco)

    # door opening in land gable
    cut(gable_land, box("cutdoor", (2.30, 2.0, 3.05), (0, -GABLE_Y + 0.1, FLOOR + 1.45)))
    # bell niche opening
    cut(gable_land, box("cutbell", (1.55, 2.0, 1.95), (0, -GABLE_Y + 0.1, FLOOR + 4.55)))
    # recess backing behind bell niche
    parts.append(box("BellBack", (1.55, 0.10, 1.95), (0, -GABLE_Y + 0.95, FLOOR + 4.55), mat=m_stucco))
    parts.append(box("BellNicheFloor", (1.55, 0.75, 0.12), (0, -GABLE_Y + 0.5, FLOOR + 3.62), mat=m_concrete))

    # sea gable: large glazed opening + cross window
    cut(gable_sea, box("cutglass", (5.30, 2.0, 3.55), (0, GABLE_Y - 0.1, FLOOR + 1.78)))
    cut(gable_sea, box("cutcrossv", (0.34, 2.0, 2.70), (0, GABLE_Y - 0.1, FLOOR + 6.35)))
    cut(gable_sea, box("cutcrossh", (1.90, 2.0, 0.34), (0, GABLE_Y - 0.1, FLOOR + 6.55)))
    parts += [gable_land, gable_sea]

    # glass wall in the sea opening + mullions.  The central 1.5 m panel is a
    # pocket slider: it stays closed as glass and slides behind the west pane
    # when the camera walks out to the terrace (animated in three.js).
    for gx in (-1.70, 1.70):
        parts.append(box("GlassSea", (1.90, 0.06, 3.55), (gx, GABLE_Y - 0.22, FLOOR + 1.78), mat=m_glass))
    for mx in (-1.70, -0.75, 0.75, 1.70):
        parts.append(box("Mullion", (0.05, 0.10, 3.55), (mx, GABLE_Y - 0.16, FLOOR + 1.78), mat=m_steel))
    parts.append(box("Transom", (5.30, 0.09, 0.06), (0, GABLE_Y - 0.16, FLOOR + 2.95), mat=m_steel))
    parts.append(box("TerraceThreshold", (1.56, 0.30, 0.06), (0, GABLE_Y - 0.22, FLOOR + 0.02), mat=m_concrete))
    parts.append(box("SillSea", (5.30, 0.24, 0.10), (0, GABLE_Y - 0.30, FLOOR + 0.05), mat=m_concrete))

    # the central sliding glass panel, origin at its centre so three.js can
    # translate it sideways into the pocket
    slider = []
    slider.append(box("SlidePane", (1.44, 0.055, 3.42), (0, GABLE_Y - 0.24, FLOOR + 1.79), mat=m_glass))
    slider.append(box("SlideTop", (1.50, 0.10, 0.055), (0, GABLE_Y - 0.24, FLOOR + 3.52), mat=m_steel))
    slider.append(box("SlideBottom", (1.50, 0.10, 0.09), (0, GABLE_Y - 0.24, FLOOR + 0.07), mat=m_steel))
    for sx in (-1, 1):
        slider.append(box("SlideStile", (0.055, 0.10, 3.50), (sx * 0.72, GABLE_Y - 0.24, FLOOR + 1.79), mat=m_steel))
    parts.append(join(slider, "GlassSlide"))
    # cross window glass
    parts.append(box("GlassCrossV", (0.34, 0.04, 2.70), (0, GABLE_Y - 0.26, FLOOR + 6.35), mat=m_glass))
    parts.append(box("GlassCrossH", (1.90, 0.04, 0.34), (0, GABLE_Y - 0.26, FLOOR + 6.55), mat=m_glass))

    # ---------------- wooden door (two leaves hinged at the jambs)
    leaf_w, leaf_h, leaf_t = 1.10, 2.98, 0.09
    for side, name in ((-1, "Door_L"), (1, "Door_R")):
        hinge = Vector((side * 1.15, -GABLE_Y + WALL_T + 0.06, FLOOR))
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
        leaf = bpy.context.object
        leaf.name = name
        leaf.scale = (leaf_w, leaf_t, leaf_h)
        apply_all(leaf)
        leaf.data.materials.append(m_teak)
        # move geometry so that the hinge is at the object origin
        for v in leaf.data.vertices:
            v.co.x -= side * (leaf_w / 2 - 0.02)
            v.co.z += leaf_h / 2
        leaf.location = hinge
        # vertical boards + handle
        parts.append(leaf)
    parts.append(box("DoorHandle", (0.03, 0.16, 0.03), (-0.16, -GABLE_Y + WALL_T + 0.14, FLOOR + 1.05), mat=m_bronze))
    # door frame
    parts.append(box("DoorFrameTop", (2.42, 0.16, 0.10), (0, -GABLE_Y + WALL_T - 0.02, FLOOR + 3.02), mat=m_teak))
    for sx in (-1, 1):
        parts.append(box("DoorFrameSide", (0.10, 0.16, 3.05), (sx * 1.20, -GABLE_Y + WALL_T - 0.02, FLOOR + 1.52), mat=m_teak))

    # screen wall after the door (影壁), so entering means turning
    parts.append(box("ScreenWall", (3.20, 0.10, 2.55), (0, -GABLE_Y + 1.65, FLOOR + 1.27), mat=m_plaster_in))

    # ---------------- roof (two planes, slim skylight slot at the ridge)
    eave_x, eave_z = HALF_X + WALL_T + 0.30, EAVE + 0.12
    ridge_gap = 0.24
    dx, dz = eave_x - ridge_gap, RIDGE - eave_z
    slope_len = math.hypot(dx, dz)
    angle = math.atan2(dz, dx)          # from horizontal
    for sx in (-1, 1):
        cx = sx * (ridge_gap + dx / 2)
        cz = eave_z + dz / 2
        parts.append(box("Roof", (slope_len, 11.9, ROOF_T), (cx, 0.15, cz),
                         rot=(0, sx * angle, 0), mat=m_stucco))
    # ridge beam + glass strip
    parts.append(box("RidgeBeam", (0.16, 6.4, 0.18), (0, 0, RIDGE + 0.02), mat=m_steel))
    parts.append(box("RidgeGlass", (0.50, 6.4, 0.05), (0, 0, RIDGE - 0.02), mat=m_glass))

    # wooden ceiling following the roof slopes
    for sx in (-1, 1):
        cx = sx * (0.35 + (eave_x - 0.35) / 2)
        cz = eave_z - 0.36 + (RIDGE - 0.36 - eave_z) / 2
        parts.append(box("Ceiling", (slope_len - 0.35, 11.0, 0.05), (cx, 0.0, cz),
                         rot=(0, sx * angle, 0), mat=m_wood))

    # ---------------- side window (west), with deep sill
    win = box("cutwin", (2.0, 1.60, 2.10), (-HALF_X, 1.4, FLOOR + 1.85))
    walls = [o for o in bpy.data.objects if o.name.startswith("SideWall")]
    for w in walls:
        if w.location.x < 0:
            cut(w, win)
    parts.append(box("WinGlass", (0.04, 1.60, 2.10), (-HALF_X - 0.02, 1.4, FLOOR + 1.85), mat=m_glass))
    parts.append(box("WinSill", (0.62, 1.90, 0.12), (-HALF_X + 0.25, 1.4, FLOOR + 0.78), mat=m_concrete))
    for sy in (-0.85, 0.85):
        parts.append(box("WinFrame", (0.06, 0.06, 2.10), (-HALF_X - 0.03, 1.4 + sy, FLOOR + 1.85), mat=m_teak))

    # ---------------- interior floor + benches + altar
    parts.append(box("FloorOak", (2 * HALF_X - 0.05, IN_Y1 - IN_Y0 - 0.05, 0.09),
                     (0, 0, FLOOR + 0.045), mat=m_wood))

    benches = []
    for row in range(5):
        y = -1.15 + row * 1.05
        for bx in (-1.66, 1.66):
            benches.append(box("BenchSeat", (2.24, 0.42, 0.07), (bx, y, FLOOR + 0.45), mat=m_teak))
            benches.append(box("BenchBack", (2.24, 0.07, 0.42), (bx, y + 0.235, FLOOR + 0.66), mat=m_teak))
            for lx in (-1.02, 1.02):
                benches.append(box("BenchLeg", (0.06, 0.36, 0.45), (bx + lx, y, FLOOR + 0.225), mat=m_teak))
    parts.append(join(benches, "Benches"))

    parts.append(box("Altar", (2.10, 0.62, 0.78), (0, 4.55, FLOOR + 0.39), mat=m_teak))
    parts.append(box("AltarTop", (2.16, 0.68, 0.06), (0, 4.55, FLOOR + 0.81), mat=m_teak))
    # small brass cross on the altar
    parts.append(box("AltarCrossV", (0.05, 0.05, 0.52), (0, 4.55, FLOOR + 1.10), mat=m_brass))
    parts.append(box("AltarCrossH", (0.30, 0.05, 0.05), (0, 4.55, FLOOR + 1.18), mat=m_brass))
    # candles
    for cx in (-0.7, 0.7):
        parts.append(cyl("Candle", 0.035, 0.26, (cx, 4.55, FLOOR + 0.97), mat=m_white_emit))

    # pendant lamps
    for ly in (-2.6, 0.4, 3.2):
        parts.append(cyl("LampStem", 0.008, 1.5, (0, ly, RIDGE - 2.0), verts=6, mat=m_steel))
        parts.append(cyl("LampShade", 0.11, 0.16, (0, ly, RIDGE - 2.75), verts=20, mat=m_brass))
        parts.append(cyl("LampBulb", 0.075, 0.10, (0, ly, RIDGE - 2.83), verts=16, mat=m_lamp))

    # ---------------- bell (origin at the hang point, swings in three.js)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.34, location=(0, 0, 0))
    bell = bpy.context.object
    bell.name = "Bell"
    bell.scale = (1.0, 1.0, 1.15)
    apply_all(bell)
    bell.data.materials.append(m_brass)
    for v in bell.data.vertices:
        v.co.z -= 0.40
    bell.location = (0, -GABLE_Y + 0.62, FLOOR + 5.15)
    parts.append(bell)

    # cross above the ridge
    parts.append(box("CrossV", (0.10, 0.10, 2.55), (0, GABLE_Y - 0.35, RIDGE + 1.08), mat=m_bronze))
    parts.append(box("CrossH", (0.95, 0.10, 0.09), (0, GABLE_Y - 0.35, RIDGE + 1.75), mat=m_bronze))

    # ---------------- twin stairs with 600 mm centre gap
    # the flights rise toward the door: bottom step at the beach, top step at
    # the platform edge, 15 risers of 170 mm, 340 mm going.
    stair_len = STAIR_N * STAIR_RUN
    stair_top_y = -6.10
    stair_bot_y = stair_top_y - stair_len
    steps = []
    nosings = []
    for sx in (-1, 1):
        x0 = sx * (GAP_HALF + STAIR_HALF / 2)
        for i in range(STAIR_N):
            h = (i + 1) * STAIR_RISE
            y = stair_bot_y + (i + 0.5) * STAIR_RUN
            steps.append(box("Step", (STAIR_HALF, STAIR_RUN, h), (x0, y, h / 2), mat=m_concrete))
            nosings.append(box("Nosing", (STAIR_HALF, 0.045, 0.028),
                               (x0, y - STAIR_RUN / 2 + 0.022, h - 0.014), mat=m_steel))
    parts.append(join(steps, "Stairs"))
    parts.append(join(nosings, "StairNosing"))

    # ---------------- railings (thin steel)
    rails = []
    rail_top = 1.02

    def post(x, y, z0, h=rail_top, r=0.016):
        rails.append(cyl("Post", r, h, (x, y, z0 + h / 2), verts=8, mat=m_steel))

    def rail_run(p0, p1, r=0.022):
        a, b = Vector(p0), Vector(p1)
        d = b - a
        mid = (a + b) / 2
        length = d.length
        rot = d.to_track_quat('Z', 'Y').to_euler()
        rails.append(cyl("Railing", r, length, tuple(mid), rot=tuple(rot), verts=8, mat=m_steel))

    # stair rails: posts sit on the treads, a continuous handrail follows the
    # pitch and a lower rail keeps the detail fine at eye level
    def tread_h(y):
        i = (y - stair_bot_y) / STAIR_RUN
        return min(FLOOR, max(0.0, (i + 0.5) * STAIR_RISE))

    for sx in (-1, 1):
        edge_in = sx * (GAP_HALF + 0.05)
        edge_out = sx * (GAP_HALF + STAIR_HALF - 0.05)
        for edge in (edge_in, edge_out):
            y = stair_bot_y + 0.2
            while y < stair_top_y - 0.1:
                post(edge, y, tread_h(y), h=0.95, r=0.015)
                y += 0.95
            post(edge, stair_top_y - 0.05, FLOOR, h=0.95, r=0.015)
            rail_run((edge, stair_bot_y + 0.1, tread_h(stair_bot_y + 0.1) + 0.95),
                     (edge, stair_top_y, FLOOR + 0.95))
            rail_run((edge, stair_bot_y + 0.1, tread_h(stair_bot_y + 0.1) + 0.48),
                     (edge, stair_top_y, FLOOR + 0.48), r=0.016)

    # terrace railing (three sides)
    ty = GABLE_Y + 3.30
    for sx in (-1, 1):
        x = sx * 3.62
        for i in range(5):
            post(x, GABLE_Y + 0.1 + i * 0.8, FLOOR - 0.1)
        rail_run((x, GABLE_Y, FLOOR - 0.1 + rail_top), (x, ty, FLOOR - 0.1 + rail_top))
    for i in range(9):
        post(-3.62 + i * 0.9, ty, FLOOR - 0.1)
    rail_run((-3.62, ty, FLOOR - 0.1 + rail_top), (3.62, ty, FLOOR - 0.1 + rail_top))

    # balcony edge rail on the west side of the platform
    for i in range(5):
        post(-3.58, -4.2 + i * 1.0, FLOOR)
    rail_run((-3.58, -4.2, FLOOR + rail_top), (-3.58, 0.8, FLOOR + rail_top))

    parts.append(join(rails, "Railings"))

    # ---------------- beach props: driftwood, rocks, mooring posts
    # modelled in Blender so the GLB carries a little of the shore too
    drift = []
    drift.append(cyl("Driftwood", 0.115, 2.7, (-7.6, -14.1, 0.22),
                     rot=(math.radians(90), 0, math.radians(74)), verts=10, mat=m_drift))
    drift.append(cyl("DriftwoodBranch", 0.055, 1.05, (-6.5, -13.7, 0.3),
                     rot=(math.radians(64), 0, math.radians(38)), verts=8, mat=m_drift))
    drift.append(cyl("DriftwoodBranch2", 0.04, 0.7, (-8.4, -14.6, 0.26),
                     rot=(math.radians(100), 0, math.radians(-22)), verts=8, mat=m_drift))
    parts.append(join(drift, "Driftwood"))

    rocks = []
    for (rx, ry, rr, rz) in [(-23.0, -14.0, 0.55, 0.28), (-11.8, -10.1, 0.32, 0.18),
                             (16.8, -9.4, 0.7, 0.34), (7.6, -18.4, 0.42, 0.22)]:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=rr, location=(rx, ry, rz * 0.55))
        rock = bpy.context.object
        rock.name = "Rock"
        rock.scale = (1.25, 1.0, 0.55)
        apply_all(rock)
        rock.data.materials.append(m_rock)
        rocks.append(rock)
    parts.append(join(rocks, "Rocks"))

    posts = []
    for (px, py) in [(-4.7, -8.4), (4.7, -8.4), (-4.9, -10.9), (4.9, -10.9),
                     (-5.1, -13.4), (5.1, -13.4)]:
        posts.append(box("MooringPost", (0.14, 0.14, 1.15), (px, py, 0.55),
                         rot=(math.radians(2.5), math.radians(1.5), 0), mat=m_post))
        posts.append(box("MooringCap", (0.18, 0.18, 0.05), (px, py, 1.14), mat=m_post))
    parts.append(join(posts, "MooringPosts"))

    # ---------------- warm exterior lights (emissive only, lights added in three.js)
    for by in (-9.5, -7.0, -4.6):
        for sx in (-1.9, 1.9):
            parts.append(box("Bollard", (0.09, 0.09, 0.52), (sx, by, 0.26), mat=m_bronze))
            parts.append(box("BollardGlow", (0.07, 0.07, 0.05), (sx, by, 0.53), mat=m_lamp))
    parts.append(box("PorchLight", (0.62, 0.10, 0.08), (0, -GABLE_Y + WALL_T + 0.05, FLOOR + 3.35), mat=m_lamp))

    # ---------------- soften the hard CG edges with a small bevel
    for ob in list(bpy.data.objects):
        if ob.type == 'MESH' and ob.name.startswith(('Platform', 'Terrace_Slab', 'SideWall', 'GableLand',
                                                    'GableSea', 'Roof', 'ScreenWall', 'Stairs', 'Benches',
                                                    'Altar', 'Column', 'RidgeBeam', 'Door_')):
            bevel(ob, 0.018, 2)

    # ---------------- UVs
    for ob in [o for o in bpy.data.objects if o.type == 'MESH']:
        deselect()
        activate(ob)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.cube_project(cube_size=2.0)
        bpy.ops.object.mode_set(mode='OBJECT')
        ob.select_set(False)

    # ---------------- hierarchy + scene extras
    root = bpy.data.objects.new("Chapel", None)
    bpy.context.collection.objects.link(root)
    for ob in bpy.data.objects:
        if ob.type == 'MESH' and ob.parent is None:
            ob.parent = root

    # sand pad so the model reads as grounded even without the web terrain
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -0.01))
    sand = bpy.context.object
    sand.name = "SandPad"
    mat_sand = pbr("M_Sand", T["stucco_albedo"], 0.95, color=(0.78, 0.71, 0.58), uv_scale=8.0)
    sand.data.materials.append(mat_sand)
    sand.parent = root

    # lighting for the .blend preview
    bpy.ops.object.light_add(type='SUN', location=(12, -18, 16))
    sun = bpy.context.object
    sun.name = "Sun"
    sun.data.energy = 4.0
    sun.data.angle = math.radians(2.0)
    sun.rotation_euler = (math.radians(52), 0, math.radians(38))

    bpy.ops.object.camera_add(location=(16, -20, 7.5))
    cam = bpy.context.object
    cam.name = "Camera_Preview"
    cam.rotation_euler = (math.radians(80), 0, math.radians(52))
    bpy.context.scene.camera = cam
    cam.data.lens = 70

    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.62, 0.75, 0.88, 1.0)
    bg.inputs[1].default_value = 0.7

    return root


def export(root):
    blend_path = os.path.join(HERE, "aranya-chapel.blend")
    glb_path = os.path.join(ROOT, "public", "models", "chapel.glb")
    os.makedirs(os.path.dirname(glb_path), exist_ok=True)

    bpy.ops.object.select_all(action='DESELECT')
    root.select_set(True)
    for ch in root.children_recursive:
        if ch.name != "SandPad":
            ch.select_set(True)
    bpy.context.view_layer.objects.active = root

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_texcoords=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print("WROTE", glb_path, os.path.getsize(glb_path))
    print("WROTE", blend_path)


if __name__ == "__main__":
    root = build()
    export(root)
