"""Cut product photos out of their backgrounds (rembg) -> cut/<name>.png"""
import numpy as np, os
from rembg import remove, new_session
from PIL import Image
from scipy import ndimage as nd
SRC=os.environ.get("SRC","/home/claude/oolu/public/images/products/")
items={"zip-grey":("oolu-zip-hoodie-grey-1.jpg",None),"hoodie-black":("oolu-hoodie-tracksuit-set-black-1.jpg",0.37),
 "hoodie-grey":("oolu-hoodie-tracksuit-set-grey-1.jpg",0.36),"tee-white":("oolu-version-2-t-shirt-1.jpg",None),
 "tee-purple":("oolu-washed-t-shirt-purple-green-gray-1.jpg",None),"tee-pink":("oolu-t-shirt-hot-pink-1.jpg",None),
 "tank-black":("oolu-sleeveless-tee-1.jpg",None),"tee-black":("oolu-gambia-edition-t-shirt-1.jpg",None),
 "tee-coral":("oolu-t-shirt-coral-red-1.jpg",None),"tee-sky":("oolu-cropped-t-shirt-sky-blue-1.jpg",None)}
os.makedirs("cut",exist_ok=True); s=new_session('isnet-general-use')
for k,(f,crop) in items.items():
    im=Image.open(SRC+f).convert("RGB").resize((700,875),Image.LANCZOS)
    o=np.asarray(remove(im,session=s)).copy(); a=o[:,:,3].astype(np.float32)
    if crop: a[int(875*crop):]=0
    m=a>128; lab,n=nd.label(m); sizes=nd.sum(m,lab,range(1,n+1)); keep=lab==(np.argmax(sizes)+1)
    a*=nd.binary_dilation(keep,iterations=3); a=np.minimum(a,nd.grey_erosion(a,size=3))
    o[:,:,3]=a.astype(np.uint8); ys,xs=np.where(a>10)
    Image.fromarray(o[ys.min():ys.max()+1,xs.min():xs.max()+1],"RGBA").save(f"cut/{k}.png")
print("cut ok")
