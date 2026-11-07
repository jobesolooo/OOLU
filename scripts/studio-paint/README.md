# Studio painting

`public/images/studio/studio.jpg` (the staff sign-in backdrop) is painted in code, not a photo.

```
pip install numpy scipy pillow
# fonts: Bebas Neue -> bebas.ttf, Roboto Mono -> mono.ttf (same folder)
node pages.js        # screenshots of the live site (dev server on :3000) -> cut/page-*.png
pip install rembg[cpu]; python3 cut_rembg.py   # product photos cut out -> cut/*.png
python3 paint.py     # room: rock, concrete, light grid, floor -> stage1.npy
python3 stage2.py    # racks, screens, clothes, bench, haze, grade -> studio.jpg, studio-sm.jpg, scene.json
P=. python3 gen_tsx.py   # run from the repo root with P=<this folder>: writes src/app/admin/login/StudioScene.tsx
```
