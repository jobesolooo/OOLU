const { chromium } = require('playwright');
const out=__dirname+'/cut/';
(async () => {
  const b = await chromium.launch({args:['--no-proxy-server']});
  const shots=[["home","/",1440,907],["shop","/shop",640,550],["product","/products/oolu-hoodie-tracksuit-set-black",640,525],["journal","/journal",640,550],["gift","/gift-cards",640,525]];
  for (const [n,u,w,h] of shots){
    const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
    const p=await c.newPage();
    await p.goto('http://localhost:3000'+u,{waitUntil:'networkidle'}); await p.addStyleTag({content:"nextjs-portal{display:none!important}"}); await p.waitForTimeout(2500);
    await p.screenshot({path:out+'page-'+n+'.png'}); await c.close();
  }
  await b.close();
})();
