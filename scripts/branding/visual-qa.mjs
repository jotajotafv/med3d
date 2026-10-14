// Production branding/first-paint regression. No app code or anatomy is injected.
// BRAND_ORIGIN ends with /med3d/; BRAND_OUTPUT is an ignored evidence directory.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.XR_PLAYWRIGHT_MODULE||process.argv[2]||'playwright');
const executablePath=process.env.XR_BROWSER_EXECUTABLE||process.argv[3];
const origin=process.env.BRAND_ORIGIN||'http://127.0.0.1:5184/med3d/';
const output=process.env.BRAND_OUTPUT||'.cache/brand-release/local';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,ignoreDefaultArgs:['--hide-scrollbars'],...(executablePath?{executablePath}:{})});
const results=[],errors=[],httpErrors=[];
const routes=[['home',''],['anatomy','anatomia/'],['about','acerca/'],['xr','experiencia-xr/'],['heart','anatomia/?organ=heart'],['lungs','anatomia/?organ=lungs'],['brain','anatomia/?organ=brain']];
async function prepare(width,height,delay=0){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
 if(delay)await context.route('**/assets/*',async route=>{if(/\.(css|js)(\?|$)/.test(route.request().url()))await new Promise(r=>setTimeout(r,delay));await route.continue().catch(()=>{});});
 await context.addInitScript(()=>{window.brandFrames={count:0,bad:[]};const sample=()=>{const mark=document.querySelector('.site-wordmark .brand-wordmark');if(mark){const parts=[...mark.children].map(e=>({color:getComputedStyle(e).color,weight:getComputedStyle(e).fontWeight}));window.brandFrames.count++;if(parts[0]?.color!=='rgb(245, 245, 245)'||parts[1]?.color!=='rgb(150, 150, 150)'||parts[0]?.weight!=='620'||parts[1]?.weight!=='420')window.brandFrames.bad.push(parts);}requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 const page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)httpErrors.push({status:r.status(),url:r.url()});});return{context,page};
}
try{
 for(const width of [1366,1050,900,768,390]){
  const height=width===390?844:900;const{context,page}=await prepare(width,height);
  for(const[name,path]of routes){
   await page.goto(origin+path);await page.locator('.site-wordmark .brand-wordmark').waitFor();await page.evaluate(()=>document.fonts.ready);
   await page.locator(name==='home'?'.home-page':name==='about'?'.about-page':name==='xr'?'.xr-atlas-page':name==='anatomy'?'.atlas-phase2':'.organ-explorer').waitFor();
   if(name!=='about')await page.locator('canvas').first().waitFor();await page.waitForTimeout(300);
   const state=await page.evaluate(()=>{const mark=document.querySelector('.site-wordmark .brand-wordmark'),header=document.querySelector('.site-header'),r=mark.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,mark:{width:r.width,height:r.height,x:r.x,y:r.y,text:mark.textContent,size:getComputedStyle(mark).fontSize,font:getComputedStyle(mark).fontFamily,spacing:getComputedStyle(mark).letterSpacing,parts:[...mark.children].map(e=>({color:getComputedStyle(e).color,weight:getComputedStyle(e).fontWeight}))},aligned:Math.abs(r.y+r.height/2-(header.getBoundingClientRect().y+header.getBoundingClientRect().height/2))<1,footer:!!document.querySelector('.site-footer'),frames:window.brandFrames};});
   assert.equal(state.overflow,false,name+' '+width+' overflow');assert.equal(state.mark.text,'MED3D');assert.equal(state.mark.size,width<=760?'24px':'27px');assert.match(state.mark.font,/Geist/);assert.equal(state.aligned,true);assert.equal(state.frames.bad.length,0);assert.equal(state.footer,true);
   const allMarks=await page.locator('.brand-wordmark').evaluateAll(marks=>marks.map(mark=>({text:mark.textContent,parts:[...mark.children].map(e=>({color:getComputedStyle(e).color,weight:getComputedStyle(e).fontWeight}))})));
   assert.equal(allMarks.length,name==='about'||name==='xr'?2:1);
   for(const mark of allMarks){assert.equal(mark.text,'MED3D');assert.deepEqual(mark.parts,[{color:'rgb(245, 245, 245)',weight:'620'},{color:'rgb(150, 150, 150)',weight:'420'}]);}
   for(const other of results.filter(r=>r.width===width&&r.kind==='route'))assert.ok(Math.abs(other.mark.width-state.mark.width)<.01,'same logo width across routes');
   if(name==='xr'){const b=await page.getByRole('button',{name:'Activar control con manos',exact:true}).boundingBox();assert.ok(b.y+b.height<height);const brand=await page.locator('.xr-brand-label .brand-wordmark').evaluate(e=>[...e.children].map(x=>getComputedStyle(x).color));assert.deepEqual(brand,['rgb(245, 245, 245)','rgb(150, 150, 150)']);}
   await page.screenshot({path:output+'/'+name+'-'+width+'.png'});results.push({kind:'route',name,width,...state});console.log(name+' '+width+' OK');
   if(width===390){await page.getByRole('button',{name:'Abrir menú',exact:true}).click();assert.equal(await page.locator('.main-nav.is-open').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.keyboard.press('Escape');}
  }
  await context.close();
 }
 for(const width of [1366,390]){
  const{context,page}=await prepare(width,900,600);
  for(const name of ['home','anatomy','about','xr']){
   const path=routes.find(r=>r[0]===name)[1];await page.goto(origin+path);await page.locator('.site-wordmark .brand-wordmark').waitFor();await page.waitForTimeout(400);
   const frames=await page.evaluate(()=>window.brandFrames);assert.ok(frames.count>0);assert.deepEqual(frames.bad,[]);results.push({kind:'delayed-first-paint',name,width,...frames});
  }await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
}finally{await writeFile(output+'/results.json',JSON.stringify({origin,results,errors,httpErrors},null,2));await browser.close();}
