# Generates src/app/admin/login/StudioScene.tsx — an original OOLU underground studio in perspective.
W,H=1440,900
BX0,BX1,BY0,BY1=330,1110,215,565          # back wall
def lerp(a,b,t): return (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
def pts(*ps): return " ".join(f"{x:.1f},{y:.1f}" for x,y in ps)
def depth(z): return z/(z+1.25)            # 0 = at the screen, ->1 = back wall

out=[]
A=out.append

# ── ceiling light panels (rows far->near for the switch-on order)
TL,TR,BTL,BTR=(0,0),(W,0),(BX0,BY0),(BX1,BY0)
rows=[0.6,1.3,2.2,3.4,5.0,7.5]
cols=8
panels=[]
for r in range(len(rows)-1):
    t0,t1=depth(rows[r]),depth(rows[r+1])
    L0,L1=lerp(TL,BTL,t0),lerp(TL,BTL,t1); R0,R1=lerp(TR,BTR,t0),lerp(TR,BTR,t1)
    for c in range(cols):
        a,b=c/cols,(c+1)/cols
        q=[lerp(L0,R0,a),lerp(L0,R0,b),lerp(L1,R1,b),lerp(L1,R1,a)]
        cx=sum(p[0] for p in q)/4; cy=sum(p[1] for p in q)/4
        q=[(cx+(x-cx)*0.9, cy+(y-cy)*0.82) for x,y in q]
        panels.append((r,c,q))
order=sorted(panels,key=lambda p:(-p[0], abs(p[1]-3.5)))
panel_svg=[]
for i,(r,c,q) in enumerate(order):
    delay=0.55+i*0.022
    flick=' lab-flicker' if (r,c)==(0,6) else ''
    panel_svg.append(f'<polygon className="lab-lp{flick}" style={{{{ animationDelay: "{delay:.2f}s" }}}} points="{pts(*q)}" fill="url(#lp)" />')

# ── floor seams converging to the vanishing point
VP=(720,390)
floor_lines=[]
for i in range(-9,10):
    x=720+i*170
    a=(x,H); t=(BY1-H)/(VP[1]-H); b=(x+(VP[0]-x)*t, BY1)
    floor_lines.append(f'<line x1="{a[0]:.0f}" y1="{a[1]}" x2="{b[0]:.1f}" y2="{b[1]}" />')
for z in [0.4,1.0,1.8,3.0,5.0]:
    t=depth(z); l=lerp((0,H),(BX0,BY1),t); r=lerp((W,H),(BX1,BY1),t)
    floor_lines.append(f'<line x1="{l[0]:.1f}" y1="{l[1]:.1f}" x2="{r[0]:.1f}" y2="{r[1]:.1f}" />')

# ── right wall concrete panels
rw=[]
for i,(z0,z1) in enumerate([(0,0.5),(0.5,1.1),(1.1,1.9),(1.9,3.0),(3.0,4.6),(4.6,7.5)]):
    t0,t1=depth(z0),depth(z1)
    q=[lerp((W,0),(BX1,BY0),t0),lerp((W,0),(BX1,BY0),t1),lerp((W,H),(BX1,BY1),t1),lerp((W,H),(BX1,BY1),t0)]
    rw.append(f'<polygon points="{pts(*q)}" fill="url(#concrete)" stroke="#05040a" strokeWidth="3" />')
    # rust streak under the tie holes
    mid=lerp(q[0],q[1],0.5); bot=lerp(q[3],q[2],0.5)
    rw.append(f'<line x1="{mid[0]:.1f}" y1="{mid[1]+30:.1f}" x2="{mid[0]+(bot[0]-mid[0])*0.35:.1f}" y2="{mid[1]+(bot[1]-mid[1])*0.35:.1f}" stroke="url(#rust)" strokeWidth="{6-i*0.7:.1f}" opacity="0.55" />')

scene=f'''
      <defs>
        <linearGradient id="lp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f0ff" stopOpacity="0.82" />
          <stop offset="1" stopColor="#c9bfff" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1822" />
          <stop offset="0.5" stopColor="#24222d" />
          <stop offset="1" stopColor="#0d0c12" />
        </linearGradient>
        <linearGradient id="concrete" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4852" />
          <stop offset="0.55" stopColor="#3a3842" />
          <stop offset="1" stopColor="#24222b" />
        </linearGradient>
        <linearGradient id="rust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a3c" />
          <stop offset="1" stopColor="#8a5a3c" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b1640" />
          <stop offset="1" stopColor="#0b0920" />
        </linearGradient>
        <radialGradient id="ceilGlow" cx="0.5" cy="0" r="0.8">
          <stop offset="0" stopColor="#ece8ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ece8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="floorGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e6e0ff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#e6e0ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8d0ff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#d8d0ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a5662" />
          <stop offset="1" stopColor="#36333d" />
        </linearGradient>
        <clipPath id="backWall"><rect x="{BX0}" y="{BY0}" width="{BX1-BX0}" height="{BY1-BY0}" /></clipPath>
        <clipPath id="leftWall"><polygon points="{pts((0,0),(BX0,BY0),(BX0,BY1),(0,H))}" /></clipPath>
      </defs>

      {{/* back wall: raw rock with a poured-concrete section on the right */}}
      <g clipPath="url(#backWall)">
        <image href="/images/studio/rock.jpg" x="{BX0-80}" y="{BY0-60}" width="960" height="600" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
        <rect x="{BX0}" y="{BY0}" width="{BX1-BX0}" height="{BY1-BY0}" fill="#0a0910" opacity="0.35" />
        <g>
          {"".join(f'<rect x="{x}" y="{BY0+70}" width="96" height="{BY1-BY0-70}" fill="url(#concrete)" stroke="#07060b" strokeWidth="3" />' for x in range(820,1110,98))}
          {"".join(f'<line x1="{x+48}" y1="{BY0+150}" x2="{x+48}" y2="{BY0+230}" stroke="url(#rust)" strokeWidth="4" opacity="0.5" />' for x in range(820,1110,98))}
          {"".join(f'<circle cx="{x+20+dx}" cy="{BY0+100+dy}" r="2.2" fill="#15131b" />' for x in range(820,1110,98) for dx in (0,56) for dy in (0,140))}
        </g>
      </g>

      {{/* neon sign on the rock */}}
      <g className="lab-neon" style={{{{ animationDelay: "1.35s" }}}}>
        <text x="372" y="292" fontFamily="var(--font-wordmark, sans-serif)" fontSize="58" letterSpacing="4" fill="none" stroke="#a592ff" strokeWidth="7" opacity="0.35">OOLU</text>
        <text x="372" y="292" fontFamily="var(--font-wordmark, sans-serif)" fontSize="58" letterSpacing="4" fill="none" stroke="#efeaff" strokeWidth="1.8">OOLU</text>
        <text x="374" y="314" fontFamily="ui-monospace, monospace" fontSize="9" letterSpacing="3" fill="#cfc6ff" opacity="0.7">LIVE IN THE PRESENT</text>
      </g>

      {{/* left wall: rock */}}
      <g clipPath="url(#leftWall)">
        <image href="/images/studio/rock.jpg" x="-200" y="-40" width="620" height="980" preserveAspectRatio="xMidYMid slice" />
        <polygon points="{pts((0,0),(BX0,BY0),(BX0,BY1),(0,H))}" fill="#06050a" opacity="0.45" />
      </g>

      {{/* right wall: concrete panels */}}
      <g>{"".join(rw)}</g>

      {{/* floor */}}
      <polygon points="{pts((0,H),(BX0,BY1),(BX1,BY1),(W,H))}" fill="url(#floor)" />
      <g stroke="#ffffff" strokeOpacity="0.045" strokeWidth="1.2">{"".join(floor_lines)}</g>
      <ellipse className="lab-glowin" cx="720" cy="640" rx="560" ry="120" fill="url(#floorGlow)" />

      {{/* ceiling: dark slab + light panels that switch on back to front */}}
      <polygon points="{pts((0,0),(W,0),(BX1,BY0),(BX0,BY0))}" fill="#0b0a10" />
      <g>{"".join(panel_svg)}</g>
      <polygon className="lab-glowin" points="{pts((0,0),(W,0),(BX1,BY0+120),(BX0,BY0+120))}" fill="url(#ceilGlow)" />

      {{/* monitor wall (left) */}}
      <g className="lab-screens">
        {{SCREENS}}
      </g>
      {{/* console desk under the monitors */}}
      <polygon points="{pts((40,610),(250,560),(300,575),(110,640))}" fill="url(#wood)" />
      <polygon points="{pts((110,640),(300,575),(300,588),(110,656))}" fill="#1c1a22" />
      <line x1="150" y1="656" x2="150" y2="760" stroke="#2c2a33" strokeWidth="10" />
      <line x1="280" y1="588" x2="280" y2="672" stroke="#2c2a33" strokeWidth="8" />
      <g className="lab-blink">
        <circle cx="120" cy="612" r="3" fill="#a592ff" />
        <circle cx="140" cy="606" r="3" fill="#7ce0b0" />
        <circle cx="160" cy="600" r="3" fill="#a592ff" />
      </g>

      {{/* spotlight + display turntable with a hoodie on a form */}}
      <polygon className="lab-glowin" points="{pts((1010,120),(1060,120),(1140,640),(930,640))}" fill="url(#spot)" />
      <ellipse cx="1035" cy="648" rx="120" ry="26" fill="#0f0e15" stroke="#3b3550" strokeWidth="2" />
      <ellipse className="lab-ring" cx="1035" cy="648" rx="132" ry="30" fill="none" stroke="#a592ff" strokeWidth="2" strokeDasharray="14 10" opacity="0.8" />
      <g>
        <line x1="1035" y1="648" x2="1035" y2="600" stroke="#2a2833" strokeWidth="6" />
        {{/* hoodie silhouette */}}
        <path d="M1000 470 C1008 452 1062 452 1070 470 L1094 488 L1106 560 L1088 563 L1080 520 L1080 600 L990 600 L990 520 L982 563 L964 560 L976 488 Z" fill="#2c2840" stroke="#4d4670" strokeWidth="1.5" />
        <path d="M1012 470 C1018 440 1052 440 1058 470 C1050 478 1020 478 1012 470 Z" fill="#221f33" />
        <path d="M1035 478 L1035 520" stroke="#a592ff" strokeWidth="1.2" opacity="0.6" />
        <text x="1035" y="545" textAnchor="middle" fontFamily="var(--font-wordmark, sans-serif)" fontSize="20" fill="#cfc6ff" opacity="0.85">OOLU</text>
      </g>

      {{/* clothing rack near the concrete wall */}}
      <g>
        <line x1="1165" y1="470" x2="1340" y2="452" stroke="#6a6676" strokeWidth="4" />
        <line x1="1168" y1="470" x2="1168" y2="640" stroke="#4a4754" strokeWidth="4" />
        <line x1="1337" y1="452" x2="1337" y2="660" stroke="#4a4754" strokeWidth="4" />
        <line x1="1150" y1="642" x2="1188" y2="640" stroke="#4a4754" strokeWidth="4" />
        <line x1="1318" y1="662" x2="1358" y2="658" stroke="#4a4754" strokeWidth="4" />
        {{GARMENTS}}
      </g>

      {{/* cutting table in the foreground: fabric rolls + pattern paper */}}
      <g>
        <polygon points="{pts((930,770),(1440,735),(1440,800),(890,850))}" fill="url(#wood)" />
        <polygon points="{pts((890,850),(1440,800),(1440,818),(890,870))}" fill="#16141b" />
        <line x1="930" y1="868" x2="930" y2="900" stroke="#2c2a33" strokeWidth="14" />
        <polygon points="{pts((990,780),(1170,768),(1150,812),(965,826))}" fill="#e8e3f6" opacity="0.85" />
        <path d="M1010 795 L1060 790 L1075 808 L1020 813 Z" fill="none" stroke="#6b54e0" strokeWidth="1.4" strokeDasharray="4 3" />
        <path d="M1085 786 L1140 782 L1132 802 L1080 805 Z" fill="none" stroke="#6b54e0" strokeWidth="1.4" strokeDasharray="4 3" />
        <rect x="1200" y="748" width="150" height="30" rx="15" fill="#2a2638" transform="rotate(-4 1275 763)" />
        <rect x="1215" y="776" width="160" height="30" rx="15" fill="#a592ff" opacity="0.9" transform="rotate(-4 1295 791)" />
        <rect x="1190" y="801" width="150" height="28" rx="14" fill="#cfcbd6" transform="rotate(-4 1265 815)" />
      </g>
'''

# monitors: affine boxes on the left wall plane
screens=[]
def screen(x,y,w,h,skew,inner,delay,cls=""):
    return f'''<g transform="matrix(1,{skew},0,1,{x},{y})"><g className="lab-screen{cls}" style={{{{ animationDelay: "{delay}s" }}}}>
          <rect x="-6" y="-6" width="{w+12}" height="{h+12}" fill="#121118" />
          <rect width="{w}" height="{h}" fill="url(#screen)" />
          {inner}
          <rect className="lab-scan" width="{w}" height="14" fill="#a592ff" opacity="0.08" />
        </g></g>'''
txt=lambda x,y,s,size=9,op=1,col="#cfc6ff": f'<text x="{x}" y="{y}" fontFamily="ui-monospace, monospace" fontSize="{size}" letterSpacing="1.5" fill="{col}" opacity="{op}">{s}</text>'
s1="".join([txt(10,16,"OOLU / STUDIO OS",9), txt(10,30,"SYSTEM · ONLINE",8,0.6,"#7ce0b0"),
  "".join(f'<rect x="10" y="{42+i*12}" width="{[96,70,120,54,88][i]}" height="5" fill="#a592ff" opacity="{0.35+i*0.1:.2f}" />' for i in range(5)),
  txt(10,118,"ATELIER · SUBLEVEL −2",7,0.5)])
s2="".join([txt(10,16,"DROP 04",9), txt(10,30,"STATUS · ARMED",8,0.6),
  '<polyline points="10,92 30,80 48,86 66,62 84,70 102,46 120,54 140,30" fill="none" stroke="#a592ff" strokeWidth="2" />',
  '<line x1="10" y1="100" x2="140" y2="100" stroke="#cfc6ff" strokeOpacity="0.2" />', txt(10,118,"LIVE IN THE PRESENT",7,0.5)])
s3="".join([txt(10,16,"PATTERN 07 · TRACKSUIT",8),
  "".join(f'<line x1="{10+i*14}" y1="26" x2="{10+i*14}" y2="110" stroke="#cfc6ff" strokeOpacity="0.08" />' for i in range(11)),
  '<path d="M48 34 L70 28 L92 34 L104 58 L94 62 L88 48 L88 106 L52 106 L52 48 L46 62 L36 58 Z" fill="none" stroke="#a592ff" strokeWidth="1.6" />',
  '<path d="M70 28 L70 106" stroke="#a592ff" strokeOpacity="0.5" strokeDasharray="3 3" />', txt(112,100,"S M L",7,0.6)])
screens.append(screen(70,300,150,124,0.32,s1,1.15))
screens.append(screen(70,450,150,92,0.32,s2,1.3))
screens.append(screen(238,352,82,140,0.62,"".join([txt(8,16,"CAM",8), '<circle cx="41" cy="70" r="22" fill="none" stroke="#a592ff" strokeOpacity="0.6" /><circle cx="41" cy="70" r="3" fill="#ff6b6b" className="lab-blink" />', txt(8,128,"REC",7,0.6,"#ff8a7a")]),1.45))
screens.insert(1,screen(-78,236,96,150,0.55,s3,1.05))

garments=[]
cols=["#1c1a24","#3a3646","#a592ff","#1c1a24","#5c586a","#cfcbd6","#2a2638"]
for i,cx in enumerate(range(1185,1330,22)):
    y=470-(cx-1165)*0.103
    col=cols[i%len(cols)]
    garments.append(f'<path d="M{cx} {y:.0f} l0 6" stroke="#8a8696" strokeWidth="1.5" />')
    garments.append(f'<path d="M{cx-11} {y+8:.0f} L{cx+11} {y+8:.0f} L{cx+14} {y+70+(i%3)*14:.0f} L{cx-14} {y+70+(i%3)*14:.0f} Z" fill="{col}" stroke="#0b0a10" strokeWidth="1" />')

scene=scene.replace("{SCREENS}","".join(screens)).replace("{GARMENTS}","".join(garments))

tsx=f'''/* Generated by scripts/studio-scene.py: an original OOLU underground studio drawn in
   one-point perspective. Light-only animation (opacity/transform) so it stays smooth. */

export function StudioScene() {{
  return (
    <svg aria-hidden viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
{scene}
    </svg>
  );
}}
'''
open(__import__("pathlib").Path(__file__).resolve().parents[1]/"src/app/admin/login/StudioScene.tsx","w").write(tsx)
print("panels",len(panels),"bytes",len(tsx))
