# -*- coding: utf-8 -*-
"""Render quick previews of the chapel .blend for visual checks.
   blender -b blender/aranya-chapel.blend -P blender/render_preview.py
"""
import bpy
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "preview")
os.makedirs(OUT, exist_ok=True)

sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = 24
sc.cycles.use_denoising = True
sc.render.resolution_x = 960
sc.render.resolution_y = 640
sc.render.film_transparent = False
sc.render.image_settings.file_format = 'PNG'
sc.view_settings.view_transform = 'Filmic'
sc.view_settings.look = 'Medium Contrast'

cam = bpy.data.objects.get("Camera_Preview")
if cam is None:
    bpy.ops.object.camera_add()
    cam = bpy.context.object
sc.camera = cam
cam.data.lens = 55

world = sc.world
if world and world.use_nodes:
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.68, 0.82, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.1

shots = [
    ("01_approach", (-17.0, -28.0, 10.5), (0.0, 0.0, 5.2), 42),
    ("02_east_sea", (6.0, 20.0, 9.0), (0.0, 2.0, 5.8), 45),
    ("03_interior", (0.0, -3.0, 4.25), (0.0, 5.4, 5.2), 20),
    ("04_undercroft", (7.0, -12.0, 2.2), (0.0, -1.0, 3.6), 45),
]

for name, loc, target, lens in shots:
    cam.location = loc
    cam.data.lens = lens
    direction = [target[i] - loc[i] for i in range(3)]
    from mathutils import Vector
    q = Vector(direction).to_track_quat('-Z', 'Y')
    cam.rotation_euler = q.to_euler()
    sc.render.filepath = os.path.join(OUT, name + ".png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", sc.render.filepath)
