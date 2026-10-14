// Render the real shared wordmark with the existing Geist font. No product dependencies.
// Usage: node scripts/branding/generate-assets.mjs <playwright-module> <chromium-path>
// Start Vite first; BRAND_ORIGIN can override http://127.0.0.1:5173/med3d/.
import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath=process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
try {
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 await page.goto(process.env.BRAND_ORIGIN || 'http://127.0.0.1:5173/med3d/');
 const markup=await page.locator('.site-wordmark .brand-wordmark').evaluate(e=>e.outerHTML);
 const css=await readFile('src/components/brand-wordmark.css','utf8');
 const font=(await readFile('node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')).toString('base64');
 // All exports reuse the component markup, its stylesheet and the bundled font.
 async function render(width,height,size,{monogram=false,caption=false}={}) {
  await page.setViewportSize({width,height});
  await page.setContent('<style>@font-face{font-family:"Geist Variable";font-style:normal;font-weight:100 900;src:url(data:font/woff2;base64,'+font+')}'+css+'html,body{margin:0;background:#050607}body{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:28px}.brand-wordmark{font-size:'+size+'px}p{margin:0;color:#969696;font:400 '+Math.round(size*.17)+'px "Geist Variable";letter-spacing:-.02em}</style>'+markup+(caption?'<p>Explora el cuerpo.</p>':''));
  if(monogram)await page.locator('.brand-wordmark').evaluate(e=>{e.querySelector('.brand-wordmark-primary').textContent='M';e.querySelector('.brand-wordmark-dimension').remove();});
  await page.evaluate(()=>document.fonts.ready);
  const png=await page.screenshot();
  return {png,webp:async()=>Buffer.from(await page.evaluate(async data=>{const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;canvas.getContext('2d').drawImage(img,0,0);return canvas.toDataURL('image/webp',.96).split(',')[1];},png.toString('base64')),'base64')};
 }
 for(const [name,size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable.png',512],['apple-touch-icon.png',180]]) {
  const image=await render(size,size,size*.19);await writeFile('public/'+name,image.png);
 }
 const icons=[];
 for(const size of [16,32,64]){const image=await render(size,size,size*.8,{monogram:true});icons.push({size,png:image.png});if(size<=32)await writeFile('public/favicon-'+size+'.png',image.png);}
 // SVG embeds the same rendered glyph, avoiding fallback fonts in browser chrome.
 await writeFile('public/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>MED3D</title><image width="64" height="64" href="data:image/png;base64,'+icons[2].png.toString('base64')+'"/></svg>\n');
 const header=Buffer.alloc(6+icons.length*16);header.writeUInt16LE(1,2);header.writeUInt16LE(icons.length,4);let offset=header.length;
 icons.forEach(({size,png},i)=>{const p=6+i*16;header[p]=size;header[p+1]=size;header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(png.length,p+8);header.writeUInt32LE(offset,p+12);offset+=png.length;});
 await writeFile('public/favicon.ico',Buffer.concat([header,...icons.map(x=>x.png)]));
 for(const [name,width,height] of [['og-wide.webp',1600,838],['og.webp',1600,1063],['cover.webp',1600,1063]]) {const image=await render(width,height,240,{caption:true});await writeFile('public/assets/'+name,await image.webp());}
 console.log('Updated 11 brand exports from BrandWordmark.');
} finally {await browser.close();}
