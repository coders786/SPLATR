"""Pixel verification of actual rendered enemy movement; requires Pillow.
Run after node scripts/camera-image-qa.mjs. No browser/server is needed.
"""
from PIL import Image, ImageDraw
import json
from pathlib import Path

folder = Path('.arena/camera-qa')
frames = json.loads((folder / 'metadata.json').read_text())
assert frames[0]['world'] == frames[1]['world'], 'camera moved world actor'
centroids = []
images = []
for frame in frames:
    image = Image.open(folder / f"{frame['name']}.png").convert('RGB')
    x, y = frame['screen']['x'], frame['screen']['y']
    pixels = []
    for py in range(max(0, int(y)-35), min(image.height, int(y)+36)):
        for px in range(max(0, int(x)-35), min(image.width, int(x)+36)):
            r, g, b = image.getpixel((px, py))
            if r > 160 and r > g * 1.4 and r > b * 1.15:
                pixels.append((px, py))
    assert len(pixels) > 30, f"enemy disappeared in {frame['name']}: {len(pixels)} pixels"
    centroid = (sum(p[0] for p in pixels)/len(pixels), sum(p[1] for p in pixels)/len(pixels))
    centroids.append(centroid)
    draw = ImageDraw.Draw(image)
    draw.rectangle((x-35,y-35,x+35,y+35), outline='lime', width=2)
    draw.text((18,18), f"{frame['name'].upper()}: world {frame['world']} | enemy pixels {len(pixels)}", fill='white')
    images.append(image)
expected_dx = frames[1]['screen']['x'] - frames[0]['screen']['x']
actual_dx = centroids[1][0] - centroids[0][0]
assert abs(expected_dx - actual_dx) < 2, f'camera projection/pixel drift: {expected_dx} vs {actual_dx}'
assert abs(centroids[1][1] - centroids[0][1]) < 2, 'unexpected vertical dragging'
report = {'world_position_unchanged': True, 'enemy_visible_in_both_images': True,
          'expected_screen_dx': expected_dx, 'measured_pixel_dx': actual_dx,
          'projection_error_px': abs(expected_dx-actual_dx)}
(folder / 'python-verification.json').write_text(json.dumps(report, indent=2))
comparison = Image.new('RGB', (images[0].width*2, images[0].height+35), '#100c19')
for i, image in enumerate(images): comparison.paste(image, (i*image.width,35))
ImageDraw.Draw(comparison).text((18,10), 'PASS: camera changes screen projection, NOT world position; both enemies remain visible', fill='lime')
comparison.save(folder / 'verified-comparison.png')
print(json.dumps(report, indent=2))
