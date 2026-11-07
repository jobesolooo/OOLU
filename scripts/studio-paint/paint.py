"""Paints the OOLU underground studio as one image (2x render, then downscaled).
Also writes scene.json: light-panel polygons, screen boxes and LED spots in the
1440x900 viewBox, so the page can animate light on top of the painting."""
import json, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as nd
from tex import fbm, noise, shade, concrete as concrete_tex, floor as floor_tex

S=2; W,H=1440*S,900*S
BX0,BX1,BY0,BY1=330,1110,215,565
def P(*ps): return [(x*S,y*S) for x,y in ps]
def lerp(a,b,t): return (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
def depth(z): return z/(z+1.25)

img=np.zeros((H,W,3),np.float32)
def mask(poly,blur=0):
    m=Image.new("L",(W,H),0); ImageDraw.Draw(m).polygon(poly,fill=255)
    if blur: m=m.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(m,np.float32)/255
def paint(m,color):
    c=np.asarray(color,np.float32)
    if c.ndim==1: c=c[None,None,:]
    elif c.ndim==2: c=c[:,:,None]
    img[:]=img*(1-m[:,:,None])+c*m[:,:,None]
def add(m,color,k=1.0):
    img[:]+=m[:,:,None]*np.asarray(color,np.float32)[None,None,:]*k
def tint(gray,rgb): return gray[:,:,None]*np.asarray(rgb,np.float32)[None,None,:]

# ── materials (full-frame so they line up)
def rock_full(seed):
    w,h=W//2,H//2
    pts=np.random.default_rng(seed).random((60,2))*[w,h]
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
    best=np.full((h,w),1e9,np.float32); second=best.copy(); idx=np.zeros((h,w),np.int32)
    for i,(px,py) in enumerate(pts):
        d=((xx-px)*0.55)**2+((yy-py)*1.6)**2
        m=d<best; second=np.where(m,best,np.minimum(second,d)); idx=np.where(m,i,idx); best=np.where(m,d,best)
    sl=np.random.default_rng(seed+1).normal(0,1,(len(pts),2)).astype(np.float32)
    facet=(sl[idx,0]*xx+sl[idx,1]*yy)/w*2.2
    edge=np.clip((np.sqrt(second)-np.sqrt(best))/10,0,1)
    detail=fbm(w,h,40,6,seed+5)
    height=facet*0.7+detail*1.6+edge*0.25
    lit=shade(height,light=(0.35,-0.85,0.45),strength=70)
    v=0.03+0.7*lit**1.6
    v*=0.45+0.55*edge
    v*=0.75+0.5*fbm(w,h,260,3,seed+9)
    return nd.zoom(np.clip(v,0,1),2,order=1)[:H,:W]
ROCK=rock_full(4)
CONC=nd.zoom(concrete_tex(W//2,H//2,8),2,order=1)[:H,:W]
FLOOR=nd.zoom(floor_tex(W//2,H//2,9),2,order=1)[:H,:W]

# ── light map from the ceiling (filled in after panels are known)
rows=[0.6,1.3,2.2,3.4,5.0,7.5]; cols=8
panels=[]
for r in range(len(rows)-1):
    t0,t1=depth(rows[r]),depth(rows[r+1])
    L0,L1=lerp((0,0),(BX0,BY0),t0),lerp((0,0),(BX0,BY0),t1); R0,R1=lerp((1440,0),(BX1,BY0),t0),lerp((1440,0),(BX1,BY0),t1)
    for c in range(cols):
        a,b=c/cols,(c+1)/cols
        q=[lerp(L0,R0,a),lerp(L0,R0,b),lerp(L1,R1,b),lerp(L1,R1,a)]
        cx=sum(p[0] for p in q)/4; cy=sum(p[1] for p in q)/4
        q=[(cx+(x-cx)*0.9, cy+(y-cy)*0.8) for x,y in q]
        panels.append({"r":r,"c":c,"q":[[round(x,1),round(y,1)] for x,y in q]})
pmask=np.zeros((H,W),np.float32)
for p in panels: pmask=np.maximum(pmask,mask(P(*p["q"])))
light=nd.gaussian_filter(pmask[::8,::8],60/8*S*1.0)
light=nd.zoom(light/light.max(),8,order=1)[:H,:W]
yy=np.mgrid[0:H,0:W][0].astype(np.float32)/H
LIGHT=np.clip(0.38+1.7*light+0.2*(1-yy),0,1.9)

# ── back wall: rock + poured concrete section on the right
back=P((BX0,BY0),(BX1,BY0),(BX1,BY1),(BX0,BY1))
m=mask(back); paint(m, tint(ROCK*LIGHT*0.95,(0.78,0.8,0.86)))
for i,x in enumerate(range(800,1110,102)):
    q=P((x,BY0+40),(x+98,BY0+40),(x+98,BY1),(x,BY1))
    mm=mask(q); paint(mm, tint(CONC*LIGHT*0.9,(0.82,0.83,0.86)))
    add(mask(P((x+96,BY0+40),(x+98,BY0+40),(x+98,BY1),(x+96,BY1))),(0,0,0),-0.3)
    for dx in (18,80):
        for dy in (60,190,300):
            hole=mask(P((x+dx-2.4,BY0+dy-2.4),(x+dx+2.4,BY0+dy-2.4),(x+dx+2.4,BY0+dy+2.4),(x+dx-2.4,BY0+dy+2.4)),1)
            paint(hole,(0.05,0.05,0.06))
            rr=np.random.default_rng(i*31+dx+dy)
            if rr.random()<0.55:
                L=30+rr.random()*110; wd=1.2+rr.random()*2.5
                streak=mask(P((x+dx-wd,BY0+dy),(x+dx+wd,BY0+dy),(x+dx+wd*0.4,BY0+dy+L),(x+dx-wd*0.4,BY0+dy+L)),3)
                paint(streak*(0.25+rr.random()*0.35),(0.4,0.25,0.15))

# ── left wall: rock, darker
left=P((0,0),(BX0,BY0),(BX0,BY1),(0,900))
paint(mask(left), tint(ROCK*LIGHT*0.7,(0.74,0.76,0.84)))

# ── right wall: concrete panels in perspective with seams, holes, rust
for i,(z0,z1) in enumerate([(0,0.5),(0.5,1.1),(1.1,1.9),(1.9,3.0),(3.0,4.6),(4.6,7.5)]):
    t0,t1=depth(z0),depth(z1)
    q=[lerp((1440,0),(BX1,BY0),t0),lerp((1440,0),(BX1,BY0),t1),lerp((1440,900),(BX1,BY1),t1),lerp((1440,900),(BX1,BY1),t0)]
    mm=mask(P(*q)); paint(mm, tint(CONC*LIGHT*(0.85-0.05*i),(0.8,0.81,0.85)))
    seam=mask(P(q[1],(q[1][0]+3,q[1][1]),(q[2][0]+3,q[2][1]),q[2])); paint(seam,(0.04,0.04,0.05))
    for f in (0.3,0.7):
        top=lerp(q[0],q[1],f); bot=lerp(q[3],q[2],f)
        for v in (0.18,0.5,0.8):
            pt=lerp(top,bot,v); r=4.2-0.5*i
            paint(mask(P((pt[0]-r,pt[1]-r),(pt[0]+r,pt[1]-r),(pt[0]+r,pt[1]+r),(pt[0]-r,pt[1]+r)),1),(0.05,0.05,0.06))
            rr=np.random.default_rng(i*97+int(f*10)+int(v*10))
            if rr.random()<0.5:
                end=lerp(top,bot,v+0.05+rr.random()*0.18); wd=1+rr.random()*2.5
                paint(mask(P((pt[0]-wd,pt[1]),(pt[0]+wd,pt[1]),(end[0]+wd*0.3,end[1]),(end[0]-wd*0.3,end[1])),3)*(0.2+rr.random()*0.35),(0.42,0.26,0.15))

# ── ceiling slab + glowing panels + bloom
paint(mask(P((0,0),(1440,0),(BX1,BY0),(BX0,BY0))), (0.05,0.05,0.07))
grad=np.clip(1.15-yy*0.6,0,1)[:,:,None]*np.array([0.96,0.95,1.0],np.float32)
paint(pmask, grad)
bloom=nd.gaussian_filter(pmask[::4,::4],6); bloom=nd.zoom(bloom,4,order=1)[:H,:W]
add(bloom,(0.78,0.78,0.9),0.55)

# ── floor: polished concrete reflecting the ceiling
fl=P((0,900),(BX0,BY1),(BX1,BY1),(1440,900))
fm=mask(fl)
paint(fm, tint(FLOOR*(0.55+0.55*LIGHT),(0.78,0.8,0.86)))
ys=np.arange(H,dtype=np.float32)
src_y=np.clip(BY1*S-(ys-BY1*S)*0.62,0,H-1).astype(int)
refl=pmask[src_y,:]*(ys[:,None]>BY1*S)
refl=nd.gaussian_filter1d(refl,18,axis=0); refl=nd.gaussian_filter1d(refl,3,axis=1)
add(refl*fm*(0.5+0.5*FLOOR),(0.8,0.82,0.95),0.42)
# grime + tyre-free scuffs (just mottling)
grime=np.clip(fbm(W//4,H//4,90,4,21)-0.55,0,1); grime=nd.zoom(grime,4,order=1)[:H,:W]
img*=1-(grime*fm*0.6)[:,:,None]
# floor seams
d=ImageDraw.Draw(seams:=Image.new("L",(W,H),0))
for i in range(-9,10):
    x=720+i*170; t=(BY1-900)/(390-900); d.line([(x*S,900*S),((x+(720-x)*t)*S,BY1*S)],fill=40,width=2)
for z in [0.4,1.0,1.8,3.0,5.0]:
    t=depth(z); l=lerp((0,900),(BX0,BY1),t); r=lerp((1440,900),(BX1,BY1),t); d.line([(l[0]*S,l[1]*S),(r[0]*S,r[1]*S)],fill=40,width=2)
img*=1-(np.asarray(seams,np.float32)/255*fm*0.9)[:,:,None]

json.dump({"panels":panels},open("scene_partial.json","w"))
np.save("stage1.npy",img)
Image.fromarray(np.clip(img*255,0,255).astype(np.uint8)).resize((1440,900),Image.LANCZOS).save("stage1.jpg",quality=85)
print("stage1 done", img.mean())
