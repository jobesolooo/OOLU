import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
rng=np.random.default_rng(11)

def noise(w,h,scale,seed=None):
    r=np.random.default_rng(seed) if seed is not None else rng
    gw,gh=max(2,int(w/scale)+2),max(2,int(h/scale)+2)
    g=r.random((gh,gw)).astype(np.float32)
    return nd.zoom(g,(h/gh,w/gw),order=3)[:h,:w]

def fbm(w,h,base=256,oct=6,seed=0,gain=0.55):
    out=np.zeros((h,w),np.float32); a=1; t=0
    for o in range(oct):
        out+=a*noise(w,h,max(2,base/2**o),seed+o); t+=a; a*=gain
    return out/t

def shade(height,light=(-0.6,-0.7,0.45),strength=40):
    gy,gx=np.gradient(height)
    n=np.dstack([-gx*strength,-gy*strength,np.ones_like(height)])
    n/=np.linalg.norm(n,axis=2,keepdims=True)
    L=np.array(light,np.float32); L/=np.linalg.norm(L)
    return np.clip((n*L).sum(2),0,1)

def rock(w,h,seed=1):
    # fractured planes: voronoi-ish facets + fbm detail
    pts=np.random.default_rng(seed).random((90,2))*[w,h]
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
    best=np.full((h,w),1e9,np.float32); second=np.full((h,w),1e9,np.float32); idx=np.zeros((h,w),np.int32)
    for i,(px,py) in enumerate(pts):
        d=((xx-px)*0.8)**2+((yy-py)*1.3)**2
        m=d<best; second=np.where(m,best,np.minimum(second,d)); idx=np.where(m,i,idx); best=np.where(m,d,best)
    slopes=np.random.default_rng(seed+1).normal(0,1,(len(pts),2)).astype(np.float32)
    facet=(slopes[idx,0]*xx+slopes[idx,1]*yy)/w*1.6
    edge=np.sqrt(second)-np.sqrt(best)
    crack=np.clip(edge/6,0,1)
    detail=fbm(w,h,64,5,seed+5)
    height=facet*0.6+detail*1.2+crack*0.5
    lit=shade(height,strength=55)
    base=0.05+0.62*lit**1.3
    base*=0.55+0.45*crack
    base*=0.8+0.4*fbm(w,h,300,3,seed+9)
    return np.clip(base,0,1)

def concrete(w,h,seed=3):
    b=fbm(w,h,180,6,seed)
    pores=(noise(w,h,1.6,seed+20)>0.985).astype(np.float32)
    pores=nd.gaussian_filter(pores,0.6)
    stains=fbm(w,h,400,3,seed+30)
    v=0.42+0.22*(b-0.5)-0.18*np.clip(stains-0.55,0,1)*3-pores*0.6
    # vertical water streaks
    streak=nd.gaussian_filter1d(noise(w,h,(1,),seed+40) if False else np.random.default_rng(seed+40).random((1,w)).repeat(h,0),3,axis=1)
    v-=0.08*np.clip(streak-0.6,0,1)*3*np.linspace(1,0.2,h)[:,None]
    return np.clip(v,0,1)

def floor(w,h,seed=5):
    b=fbm(w,h,260,6,seed)
    grime=np.clip(fbm(w,h,500,4,seed+7)-0.5,0,1)*2
    return np.clip(0.30+0.16*(b-0.5)-0.16*grime,0,1)

if __name__=="__main__":
    for name,fn in [("rock",lambda: rock(900,560)),("concrete",lambda: concrete(600,600)),("floor",lambda: floor(800,500))]:
        a=fn(); Image.fromarray((a*255).astype(np.uint8)).save(f"t_{name}.png"); print(name,a.mean())
