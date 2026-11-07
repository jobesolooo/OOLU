"""Stage 2: tech, clothes, props, atmosphere and grade on top of stage1.npy.
Coordinates are in the 1440x900 viewBox (S=2 render)."""
import json, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage as nd
from tex import fbm

S=2; W,H=1440*S,900*S
BX0,BX1,BY0,BY1=330,1110,215,565
img=np.load("stage1.npy")
scene=json.load(open("scene_partial.json"))
def P(*ps): return [(x*S,y*S) for x,y in ps]
def lerp(a,b,t): return (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
def depth(z): return z/(z+1.25)
YY,XX=np.mgrid[0:H,0:W].astype(np.float32)/S
def layer(): im=Image.new("L",(W,H),0); return im,ImageDraw.Draw(im)
def arr(im,blur=0):
    if blur: im=im.filter(ImageFilter.GaussianBlur(blur*S))
    return np.asarray(im,np.float32)/255
def mask(poly,blur=0):
    im,d=layer(); d.polygon(P(*poly),fill=255); return arr(im,blur)
def ell(cx,cy,rx,ry,blur=0):
    im,d=layer(); d.ellipse([(cx-rx)*S,(cy-ry)*S,(cx+rx)*S,(cy+ry)*S],fill=255); return arr(im,blur)
def paint(m,c):
    c=np.asarray(c,np.float32)
    if c.ndim==1: c=c[None,None,:]
    elif c.ndim==2: c=c[:,:,None]
    img[:]=img*(1-m[:,:,None])+c*m[:,:,None]
def add(m,c,k=1.0): img[:]+=m[:,:,None]*np.asarray(c,np.float32)[None,None,:]*k
def mul(m,k): img[:]*=(1-m*(1-k))[:,:,None]
def col(gray,rgb): return gray[:,:,None]*np.asarray(rgb,np.float32)[None,None,:]
GRAIN=np.clip(fbm(W//2,H//2,6,3,77),0,1); GRAIN=nd.zoom(GRAIN,2,order=1)[:H,:W]
LAV=(0.66,0.58,1.0); ICE=(0.55,0.78,1.0); BONE=(0.92,0.9,0.85)
mono=lambda s: ImageFont.truetype("mono.ttf",int(s*S))
bebas=lambda s: ImageFont.truetype("bebas.ttf",int(s*S))

def edge(m,side=-1,width=3):
    """Rim light: the part of mask m near its edge on one side (-1 left, +1 right)."""
    sh=nd.shift(m,(0,side*width*S),order=0,mode="nearest")
    return np.clip(m-sh,0,1)

def fabric(poly,base,seed,light=-1,rim=LAV,rimk=0.5,folds=6,fold_len=(0.25,0.7),gloss=0.06):
    """Dark garment with soft form shading, folds and a coloured rim light."""
    m=mask(poly,0.6); ys=[p[1] for p in poly]; xs=[p[0] for p in poly]
    x0,x1,y0,y1=min(xs),max(xs),min(ys),max(ys)
    u=np.clip((XX-x0)/(x1-x0),0,1); v=np.clip((YY-y0)/(y1-y0),0,1)
    form=0.55+0.55*(1-u if light<0 else u)**0.8-0.25*v      # light from one side, fades down
    n=nd.zoom(fbm(W//4,H//4,30,3,seed),4,order=1)[:H,:W]
    shadeimg=col(np.clip(form*(0.8+0.4*n),0.15,1.4),base)
    paint(m,shadeimg)
    r=np.random.default_rng(seed)
    dk,dd=layer(); lk,ld=layer()
    for _ in range(folds):
        fx=x0+(x1-x0)*r.uniform(0.15,0.85); fy=y0+(y1-y0)*r.uniform(0.15,0.45)
        L=(y1-y0)*r.uniform(*fold_len); bend=r.uniform(-14,14)
        pts=[(fx+bend*np.sin(t*2.6)*t,fy+L*t) for t in np.linspace(0,1,12)]
        dd.line(P(*pts),fill=255,width=int(r.uniform(3,7)*S),joint="curve")
        ld.line(P(*[(x+(-3 if light<0 else 3)*1.1,y) for x,y in pts]),fill=255,width=int(2*S),joint="curve")
    mul(arr(dk,3)*m,0.45); add(arr(lk,2.5)*m,(1,1,1),gloss)
    add(nd.gaussian_filter(edge(m,light*-1,3),1.5*S)*m,rim,rimk)
    return m

fl0=mask([(0,900),(BX0,BY1),(BX1,BY1),(1440,900)])
mul(fl0,0.55)
# ════════ contact shadows first (under everything)
mul(ell(300,722,150,26,10),0.35)
mul(ell(1255,768,190,22,12),0.4)

# ════════ LEFT: server racks along the rock wall
leds=[]
for k,(x0,x1,yt,yb,dep) in enumerate([(-10,96,250,800,26),(104,186,300,742,20)]):
    face=[(x0,yt),(x1,yt),(x1,yb),(x0,yb)]
    side=[(x1,yt),(x1+dep,yt+dep*0.55),(x1+dep,yb-dep*0.2),(x1,yb)]
    topf=[(x0,yt),(x1,yt),(x1+dep,yt+dep*0.55),(x0+dep,yt+dep*0.55)]
    m=mask(face); u=np.clip((XX-x0)/(x1-x0),0,1)
    paint(m,col(0.06+0.05*u+0.03*GRAIN,(0.8,0.84,0.95)))
    paint(mask(side),col(0.11+0.04*GRAIN,(0.8,0.84,0.95)))
    add(nd.gaussian_filter(edge(m,1,1.5),0.8*S),(0.6,0.7,1.0),0.6)
    im,d=layer(); gl,gd=layer(); r=np.random.default_rng(k+3)
    n=int((yb-yt)/22)
    for j in range(n):
        y=yt+8+j*22
        d.rectangle([(x0+8)*S,y*S,(x1-8)*S,(y+17)*S],outline=255,width=int(1*S))
        for g in range(int((x1-x0-24)/7)):
            if r.random()<0.6: continue
            x=x0+14+g*7
            gd.ellipse([(x-1.3)*S,(y+5-1.3)*S,(x+1.3)*S,(y+5+1.3)*S],fill=255)
            leds.append([round(x,1),y+5,"b" if r.random()<0.85 else "a"])
        d.line(P((x0+12,y+12),(x1-12,y+12)),fill=120,width=int(1*S))
    add(arr(im)*m,(0.35,0.38,0.5),0.35)
    L=arr(gl); add(L,ICE,1.3); add(nd.gaussian_filter(L,4*S),ICE,1.6); add(nd.gaussian_filter(L,18*S),(0.3,0.5,1.0),1.8)
# server glow on the floor
add(ell(110,830,170,40,30),(0.25,0.4,0.9),0.2)

# ════════ BACK: monitor wall + console
screens=[]
def screen(x0,y0,x1,y1,kind,skew=0.0):
    w,h=int((x1-x0)*S),int((y1-y0)*S)
    s=Image.new("RGB",(w,h),(4,5,12)); d=ImageDraw.Draw(s)
    for gx in range(0,w,int(14*S)): d.line([(gx,0),(gx,h)],fill=(10,12,26))
    for gy in range(0,h,int(14*S)): d.line([(0,gy),(w,gy)],fill=(10,12,26))
    hdr=(186,170,255)
    if kind=="os":
        d.text((10*S,8*S),"OOLU",font=bebas(30),fill=(244,239,227))
        d.text((10*S,40*S),"STUDIO OS  v4.2  ·  SUBLEVEL −2",font=mono(7),fill=hdr)
        # hoodie wireframe
        cx,cy=w*0.58,h*0.58; k=S*0.95
        sil=[(-46,-40),(-20,-52),(-10,-62),(10,-62),(20,-52),(46,-40),(70,30),(52,36),(38,-6),(36,62),(-36,62),(-38,-6),(-52,36),(-70,30)]
        pts=[(cx+x*k,cy+y*k) for x,y in sil]
        for off in (0,):
            d.line(pts+[pts[0]],fill=(150,136,255),width=max(1,int(1.2*S)))
        for t in np.linspace(-0.8,0.8,7):
            d.line([(cx+t*36*k,cy-50*k),(cx+t*36*k,cy+62*k)],fill=(60,56,120),width=1)
        for t in np.linspace(-0.8,0.9,8):
            d.line([(cx-38*k,cy+t*60*k),(cx+38*k,cy+t*60*k)],fill=(60,56,120),width=1)
        d.line([(cx-22*k,cy+18*k),(cx+22*k,cy+18*k)],fill=(150,136,255),width=1)
        for i,(lab,val) in enumerate([("FABRIC","480 GSM"),("FIT","BOXY"),("PANEL","07/12"),("STATUS","CUTTING")]):
            d.text((10*S,(70+i*16)*S),lab,font=mono(6),fill=(110,110,150)); d.text((52*S,(70+i*16)*S),val,font=mono(6),fill=(220,220,240))
    elif kind=="drop":
        d.text((8*S,8*S),"DROP 04",font=bebas(22),fill=(244,239,227))
        d.text((8*S,32*S),"COUNTDOWN",font=mono(6),fill=hdr)
        d.text((8*S,40*S),"03:14:52",font=bebas(20),fill=(186,170,255))
        for i in range(10):
            bh=(np.sin(i*1.7)*0.5+0.6)*h*0.16; x=8*S+i*(w-16*S)/10
            d.rectangle([x,h-8*S-bh,x+(w-16*S)/10*0.6,h-8*S],fill=(120,104,240) if i%3 else (230,226,255))
    elif kind=="stock":
        d.text((8*S,8*S),"STOCK",font=bebas(20),fill=(244,239,227))
        for i,(n,q) in enumerate([("TRACK SET BLK",42),("TRACK SET GRY",17),("COLOUR TEE PNK",64),("COLOUR TEE CRL",8),("HOODIE BONE",31),("CAP",55)]):
            y=(32+i*13)*S; d.text((8*S,y),n,font=mono(5.5),fill=(200,200,225))
            d.rectangle([w*0.62,y+2*S,w*0.62+(w*0.3)*q/64,y+7*S],fill=(255,138,122) if q<10 else (150,136,255))
    elif kind=="cam":
        g=Image.new("L",(w,h)); gd=ImageDraw.Draw(g)
        gd.polygon([(w*0.1,h),(w*0.35,h*0.4),(w*0.65,h*0.4),(w*0.9,h)],fill=40)
        gd.rectangle([w*0.42,h*0.3,w*0.58,h*0.75],fill=70)
        s.paste((60,70,90),mask=g)
        d.text((6*S,6*S),"CAM 02 · DOOR",font=mono(6),fill=(220,220,240)); d.ellipse([w-14*S,7*S,w-8*S,13*S],fill=(255,80,80))
    elif kind=="pattern":
        d.text((8*S,8*S),"PATTERN 07",font=bebas(20),fill=(244,239,227))
        pts=[(w*0.22,h*0.42),(w*0.55,h*0.38),(w*0.8,h*0.46),(w*0.75,h*0.8),(w*0.25,h*0.8)]
        d.polygon(pts,outline=(150,136,255));
        for a,b in zip(pts,pts[1:]+pts[:1]):
            for t in np.linspace(0,1,9): p=lerp(a,b,t); d.ellipse([p[0]-1.5*S,p[1]-1.5*S,p[0]+1.5*S,p[1]+1.5*S],fill=(230,226,255))
        d.text((w*0.5,8*S),"SEAM 1.0",font=mono(5.5),fill=hdr)
    a=np.asarray(s,np.float32)/255
    # scanlines
    a*= (0.9+0.1*(np.arange(h)%int(3*S)<S))[:,None,None]
    m=np.zeros((H,W),np.float32); y0p,x0p=int(y0*S),int(x0*S)
    img[y0p:y0p+h,x0p:x0p+w]=a*1.05
    m[y0p:y0p+h,x0p:x0p+w]=1
    # bezel + glow
    paint(np.clip(mask([(x0-4,y0-4),(x1+4,y0-4),(x1+4,y1+4),(x0-4,y1+4)])-m,0,1),(0.03,0.03,0.04))
    add(nd.gaussian_filter(m,22*S),(0.45,0.42,0.95),0.28)
    screens.append({"x":x0,"y":y0,"w":x1-x0,"h":y1-y0,"kind":kind})
# mounting frame behind screens
paint(mask([(470,262),(970,262),(970,452),(470,452)],1),(0.035,0.035,0.045))
screen(585,272,855,442,"os")
screen(480,272,577,355,"drop"); screen(480,362,577,442,"cam")
screen(863,272,960,355,"stock"); screen(863,362,960,442,"pattern")
# console desk
desk_top=[(455,470),(985,470),(1010,500),(430,500)]
paint(mask([(470,452),(970,452),(985,470),(455,470)]),(0.05,0.05,0.06))
m=mask(desk_top); paint(m,col(0.16+0.08*(1-np.abs(XX-720)/300).clip(0,1),(0.8,0.82,0.9)))
paint(mask([(430,500),(1010,500),(990,560),(450,560)]),col(0.06+0.02*GRAIN,(0.8,0.82,0.92)))
add(nd.gaussian_filter(mask([(430,499),(1010,499),(1010,501),(430,501)]),1*S),(0.8,0.8,1),0.35)
im,d=layer()
for i in range(40):
    x=470+i*12.5; d.ellipse([(x-1.3)*S,(484-1.0)*S,(x+1.3)*S,(484+1.0)*S],fill=255)
L=arr(im); add(L,(0.75,0.65,1),1.4); add(nd.gaussian_filter(L,4*S),LAV,1.6)
add(nd.gaussian_filter(mask([(560,470),(880,470),(900,498),(540,498)]),10*S),(0.5,0.48,1.0),0.22)  # screen spill on desk

# ════════ CENTRE-LEFT: hoodie on a form, on a turntable, under a spotlight
cx,base=300,712
# spotlight cone
cone=mask([(cx-18,0),(cx+18,0),(cx+150,base+10),(cx-150,base+10)],18)
cone*=np.clip((YY/900)**0.7,0,1)
add(cone,(0.85,0.85,1.0),0.13)
# turntable
paint(ell(cx,base+8,128,22,1),(0.03,0.03,0.035))
paint(ell(cx,base,128,22,1),col(0.13+0.05*GRAIN,(0.85,0.85,0.92)))
add(np.clip(ell(cx,base,128,22,0.6)-ell(cx,base,124,19,0.6),0,1),LAV,0.9)       # lit ring
add(nd.gaussian_filter(np.clip(ell(cx,base,128,22)-ell(cx,base,124,19),0,1),8*S),LAV,0.7)
paint(mask([(cx-3,575),(cx+3,575),(cx+3,base-2),(cx-3,base-2)]),(0.25,0.25,0.3))
paint(mask([(cx-14,574),(cx+14,574),(cx+10,590),(cx-10,590)],0.5),(0.12,0.12,0.14))
# hoodie
hood=[(cx-30,398),(cx-16,384),(cx,380),(cx+16,384),(cx+30,398),
      (cx+62,414),(cx+80,440),(cx+92,520),(cx+88,560),(cx+72,562),(cx+66,512),(cx+62,470),
      (cx+60,578),(cx-60,578),(cx-62,470),(cx-66,512),(cx-72,562),(cx-88,560),(cx-92,520),(cx-80,440),(cx-62,414)]
m=fabric(hood,(0.2,0.2,0.24),seed=9,folds=9,fold_len=(0.2,0.55),rimk=0.7,gloss=0.08)
# hood opening, cuffs, hem, pocket, drawcords, chest print
paint(ell(cx,392,18,11,1),(0.025,0.025,0.03))
for x0 in (cx-88,cx+72):
    mul(mask([(x0,548),(x0+16,548),(x0+16,560),(x0,560)],0.6),0.6)
mul(mask([(cx-60,564),(cx+60,564),(cx+60,578),(cx-60,578)],0.8),0.65)
mul(mask([(cx-34,520),(cx+34,520),(cx+40,556),(cx-40,556)],1.2),0.7)
add(nd.gaussian_filter(mask([(cx-34,519),(cx+34,519),(cx+34,521),(cx-34,521)]),0.6*S),(1,1,1),0.08)
for dx in (-7,7):
    paint(mask([(cx+dx-1,400),(cx+dx+1,400),(cx+dx+1.5,446),(cx+dx-0.5,446)],0.4),(0.75,0.74,0.72))
im,d=layer(); d.text(((cx-22)*S,456*S),"OOLU",font=bebas(22),fill=255)
t=arr(im,0.15); paint(t*0.9*m,(0.86,0.84,0.8))
# spotlight hit on shoulders
add(ell(cx-20,420,60,30,22)*m,(0.9,0.9,1),0.12)

# ════════ RIGHT: garment rack in front of the concrete
rx0,rx1,ry=1120,1395,392
for x in (rx0,rx1):
    paint(mask([(x-3,ry),(x+3,ry),(x+3,770),(x-3,770)],0.5),col(0.22+0.15*GRAIN,(0.85,0.86,0.9)))
    paint(mask([(x-26,766),(x+26,766),(x+26,772),(x-26,772)],0.5),(0.12,0.12,0.14))
paint(mask([(rx0-6,ry-3),(rx1+6,ry-3),(rx1+6,ry+3),(rx0-6,ry+3)],0.5),(0.42,0.43,0.48))
add(nd.gaussian_filter(mask([(rx0,ry-3),(rx1,ry-3),(rx1,ry-2),(rx0,ry-2)]),0.5*S),(1,1,1),0.4)
items=[("jacket",1150,(0.13,0.13,0.15)),("hoodie",1196,(0.42,0.38,0.52)),("jacket",1240,(0.09,0.09,0.1)),
       ("tee",1282,(0.82,0.8,0.75)),("trousers",1318,(0.16,0.16,0.18)),("hoodie",1360,(0.55,0.54,0.56))]
for i,(kind,x,c) in enumerate(items):
    # hanger
    hk,hd=layer(); hd.arc([(x-6)*S,(ry-8)*S,(x+6)*S,(ry+4)*S],180,360,fill=200,width=int(1.5*S))
    hd.line(P((x,ry+1),(x-28,ry+16),(x+28,ry+16),(x,ry+1)),fill=200,width=int(1.5*S))
    paint(arr(hk),(0.55,0.56,0.6))
    if kind=="trousers":
        poly=[(x-24,ry+14),(x+24,ry+14),(x+28,ry+250),(x+6,ry+250),(x,ry+70),(x-6,ry+250),(x-28,ry+250)]
    elif kind=="tee":
        poly=[(x-30,ry+16),(x-10,ry+12),(x+10,ry+12),(x+30,ry+16),(x+44,ry+50),(x+30,ry+56),(x+30,ry+150),(x-30,ry+150),(x-30,ry+56),(x-44,ry+50)]
    else:
        L=230 if kind=="jacket" else 200
        poly=[(x-32,ry+16),(x-12,ry+10),(x+12,ry+10),(x+32,ry+16),(x+40,ry+40),(x+44,ry+L-10),(x+30,ry+L),(x-30,ry+L),(x-44,ry+L-10),(x-40,ry+40)]
    m=fabric(poly,c,seed=20+i,light=1,rim=(0.75,0.7,1.0),rimk=0.35,folds=6 if kind!="tee" else 4,fold_len=(0.35,0.85))
    if kind=="jacket":
        paint(mask([(x-0.8,ry+14),(x+0.8,ry+14),(x+0.8,ry+222),(x-0.8,ry+222)]),(0.38,0.38,0.42))  # zip
        add(mask([(x-0.6,ry+14),(x+0.6,ry+14),(x+0.6,ry+222),(x-0.6,ry+222)]),(1,1,1),0.2)
    if kind=="hoodie":
        mul(mask([(x-24,ry+150),(x+24,ry+150),(x+28,ry+182),(x-28,ry+182)],1),0.72)
    mul(np.clip(nd.shift(m,(0,-8*S),order=0)-m,0,1)*0.0+edge(m,-1,10)*0.0,1)
# shadow of the rack on the wall/floor
mul(ell(1260,780,180,16,14),0.5)

# ════════ FOREGROUND: steel cutting bench with fabric rolls and pattern paper
top=[(560,812),(1010,812),(1090,900),(480,900)]
paint(mask(top),col(0.22+0.1*np.clip(1-np.abs(XX-800)/400,0,1)+0.05*GRAIN,(0.82,0.84,0.9)))
add(nd.gaussian_filter(mask([(560,811),(1010,811),(1010,813),(560,813)]),0.6*S),(1,1,1),0.5)
# pattern paper with notches and dashed seam lines
pp=[(640,826),(830,822),(860,880),(612,886)]
paint(mask(pp,0.4),col(0.62+0.08*GRAIN,BONE))
im,d=layer()
for a,b in zip(pp,pp[1:]+pp[:1]):
    for t in np.arange(0.05,0.95,0.07): p,q=lerp(a,b,t),lerp(a,b,t+0.035); d.line(P(lerp(p,q,0),q),fill=255,width=int(1.2*S))
paint(arr(im)*0.8,(0.25,0.22,0.4))
im,d=layer(); d.text((660*S,846*S),"BACK PANEL  ·  CUT 2",font=mono(7),fill=255); paint(arr(im)*0.85,(0.2,0.2,0.24))
# fabric rolls lying on the bench
for i,(x0,x1,y,rad,c) in enumerate([(880,1050,838,14,(0.12,0.12,0.14)),(900,1070,866,16,(0.45,0.4,0.58)),(500,620,858,13,(0.78,0.76,0.7))]):
    m=mask([(x0,y-rad),(x1,y-rad),(x1,y+rad),(x0,y+rad)],0.5)
    v=np.clip((YY-(y-rad))/(2*rad),0,1)
    sh=0.35+0.9*np.sin(np.pi*np.clip(v*0.95+0.02,0,1))**0.6*(1-0.5*v)
    paint(m,col(sh,c))
    add(m*np.exp(-((YY-(y-rad*0.45))/(rad*0.18))**2),(1,1,1),0.1)
    paint(ell(x1,y,rad*0.32,rad,0.4),col(0.6*np.ones_like(XX),c))
    paint(ell(x1,y,rad*0.1,rad*0.3,0.3),(0.05,0.05,0.06))
    mul(mask([(x0,y+rad),(x1,y+rad),(x1+6,y+rad+5),(x0+6,y+rad+5)],3),0.55)
# shears
im,d=layer(); d.line(P((720,872),(790,858)),fill=255,width=int(2.5*S)); d.line(P((722,862),(790,860)),fill=255,width=int(2.5*S))
d.ellipse([706*S,866*S,720*S,880*S],outline=255,width=int(2.5*S)); d.ellipse([704*S,852*S,718*S,866*S],outline=255,width=int(2.5*S))
L=arr(im,0.3); paint(L,(0.55,0.56,0.62)); add(L,(1,1,1),0.1)

# ════════ atmosphere
# volumetric haze under the light grid + a little everywhere
haze=nd.zoom(fbm(W//8,H//8,40,4,55),8,order=1)[:H,:W]
ceil=np.clip(1-(YY-180)/500,0,1)*np.clip((YY-60)/150,0,1)
add(ceil*(0.5+0.5*haze),(0.5,0.5,0.62),0.07)
add(np.clip(1-np.abs(YY-560)/120,0,1)*(0.5+0.5*haze),(0.4,0.4,0.55),0.05)   # floor-level mist
# bloom
lum=img.mean(2); bright=np.clip(lum-0.75,0,None)
b=nd.zoom(nd.gaussian_filter(bright[::4,::4],8),4,order=1)[:H,:W]; add(b,(0.85,0.85,1),0.45)
b2=nd.zoom(nd.gaussian_filter(bright[::8,::8],18),8,order=1)[:H,:W]; add(b2,(0.6,0.6,1),0.35)
# screen reflections on the polished floor
fl=mask([(0,900),(BX0,BY1),(BX1,BY1),(1440,900)])
sm=np.zeros((H,W),np.float32)
for s in screens:
    x0,y0,w,h=s["x"],s["y"],s["w"],s["h"]; ref_y0=BY1+ (BY1-(y0+h))*0.9
    sm+=mask([(x0,ref_y0),(x0+w,ref_y0),(x0+w,ref_y0+h*0.9),(x0,ref_y0+h*0.9)],6)
add(nd.gaussian_filter(sm,(14*S,3*S))*fl,(0.4,0.38,0.9),0.3)
add(nd.gaussian_filter(ell(300,760,120,30),20*S)*fl,LAV,0.15)
# grade: crush blacks a little, cool shadows, lavender mids, warm highlights stay neutral
img[:]=np.clip(img,0,None)
img[:]=img/(1+img*0.35)*1.25                  # soft shoulder
lum=img.mean(2,keepdims=True)
img[:]=img*np.array([0.96,0.97,1.04])+ (1-lum)*np.array([0.004,0.004,0.016])
img[:]=np.clip(img,0,1)**1.08
# vignette + grain
vig=np.clip(1-(((XX-720)/900)**2+((YY-450)/620)**2),0,1)**0.9
img*=(0.35+0.65*vig)[:,:,None]
g=np.random.default_rng(3).normal(0,1,(H,W)).astype(np.float32)
img+= (g*0.018)[:,:,None]
img[:]=np.clip(img,0,1)

out=Image.fromarray((img*255).astype(np.uint8))
out.resize((1920,1200),Image.LANCZOS).save("studio.jpg",quality=84,optimize=True,progressive=True)
out.resize((1440,900),Image.LANCZOS).save("preview.jpg",quality=85)
out.resize((960,600),Image.LANCZOS).save("studio-sm.jpg",quality=80,optimize=True,progressive=True)
scene["screens"]=screens; scene["leds"]=leds
json.dump(scene,open("scene.json","w"))
print("done",img.mean())
