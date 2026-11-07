import json,random,os
P=os.environ["P"]
sc=json.load(open(os.path.join(P,"scene.json")))
random.seed(4)
pl=[]
for p in sorted(sc["panels"],key=lambda p:-p["r"]):
    d=round(0.45+(4-p["r"])*0.11+random.random()*0.12,2)
    pl.append(f'  ["{" ".join(f"{x},{y}" for x,y in p["q"])}", {d}],')
ll=[f"  [{x}, {y}, {round(random.random()*3,2)}, {round(1.2+random.random()*2.4,2)}]," for x,y,_ in random.sample(sc["leds"],40)]
scr=[f'  [{s["x"]}, {s["y"]}, {s["w"]}, {s["h"]}],' for s in sc["screens"]]
T=open(os.path.join(os.path.dirname(__file__),"scene_tpl.txt")).read()
T=T.replace("@PANELS@","\n".join(pl)).replace("@SCREENS@","\n".join(scr)).replace("@LEDS@","\n".join(ll))
open("src/app/admin/login/StudioScene.tsx","w").write(T)
