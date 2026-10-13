import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

export async function runAtlasGestures(ctx) {
  const {page,mode,report,pass,mark,put,pose,at,waitTracking,output,imageAnchor,section}=ctx;
  const control=id=>page.locator('[data-xr-hand-control="'+id+'"]');
  const near=(a,b,t=.025)=>assert.ok(Math.abs(a-b)<=t,a+' != '+b);
  const wait=(fn,arg,timeout=8000)=>page.waitForFunction(fn,arg,{timeout,polling:100});
  const sampleCount=()=>page.evaluate(()=>window.gestureQa.received);
  const samples=async(n=5)=>{const from=await sampleCount();await wait(({from,n})=>window.gestureQa.received>=from+n,{from,n});};
  const release=async()=>{await mark('intentional-release');await put([]);await wait(()=>window.gestureQa.state==='lost');};
  const hand=(h,closed=false)=>mode==='real'?{...h,angle:h.u>.94?-Math.PI/2:h.u<.06?Math.PI/2:h.v>.77?Math.PI:0,ratio:closed?.2:.5,image:closed?'fist':'pointing',size:190,anchor:closed?{x:.60266,y:.3639}:imageAnchor}: {...h,ratio:closed?.2:.5};
  const aim=async(point)=>{await release();const h=hand(await at(point));await put([h]);await waitTracking();return h;};
  async function continuity(start,name){
    const data=await page.evaluate(start=>{const q=window.gestureQa;return {start,end:performance.now(),frames:q.frames.filter(f=>f.time>=start).length,losses:q.tracking.filter(f=>f.time>=start&&f.state!=='tracking').map(f=>({time:f.time,state:f.state,hands:f.hands}))};},start);
    (report.gestureSpans??=[]).push({name,...data});assert.equal(data.losses.length,0,name+' completes without unexpected tracking loss');
  }
  const glide=async(from,to,duration=1200)=>{
    const start=await mark('motion-start');
    await page.evaluate(({from,to,duration})=>{window.gestureQa.plan={start:performance.now(),duration,from,to};},{from,to,duration});
    await wait(()=>!window.gestureQa.plan);await samples();await continuity(start,'motion');
  };
  const shot=async(name)=>{await release();const file=output+'/'+name+'.png';await page.screenshot({path:file,timeout:15000});report.captures.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});};
  const selected=()=>page.locator('#xr-education-title').count();
  const reset=async()=>{await release();await page.keyboard.press('Escape');await control('reset-view').click();await page.waitForTimeout(600);};
  async function dwell(id) {
    const b=await control(id).boundingBox();assert.ok(b,id+' has a real rectangle');
    const count=await page.evaluate(id=>(window.gestureQa.fired??[]).filter(f=>f.target?.id===id).length,id);
    const h=await aim({x:b.x+b.width/2,y:b.y+b.height/2});const started=await mark('dwell-'+id);
    await wait(({id,count})=>(window.gestureQa.fired??[]).filter(f=>f.target?.id===id).length===count+1,{id,count});
    const f=await page.evaluate(()=>window.gestureQa.fired.at(-1));assert.equal(f.elapsedMs,1000);
    const start=await page.evaluate(f=>(window.gestureQa.dwellEvents??[]).filter(e=>e.target?.id===f.target.id&&e.state==='dwelling'&&e.elapsedMs===0&&e.sampleTime<=f.sampleTime).at(-1)?.sampleTime,f);
    assert.ok(Number.isFinite(start)&&f.sampleTime-start>=1000,'No dwell fire before 1000 ms of the original sample clock');
    await continuity(started,'dwell-'+id);return {h,b};
  }
  if(section!=='card'){
  // One-shot UI dwell, then leaving/re-entering the same real control rearms it.
  await dwell('layers-panel');await samples();
  const first=await page.evaluate(()=>window.gestureQa.fired.filter(f=>f.target?.id==='layers-panel').length);
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.gestureQa.fired.filter(f=>f.target?.id==='layers-panel').length),first);
  await release();await put([hand({id:'Left',u:.20,v:.5})]);await waitTracking();await page.waitForTimeout(550);
  await dwell('layers-panel');pass('XR dwell at 1000 ms, one shot, exit/re-entry rearm');await shot('01-dwell');

  // Manipulations run away from the UI; each direction has its own open/closed anchor.
  const mobile=page.viewportSize().width<600,viewportBox=await page.locator('.xr-scene canvas').boundingBox();
  const center=mobile?await at({x:viewportBox.x+viewportBox.width/2,y:viewportBox.y+viewportBox.height*.45}):{u:.35,v:.53};
  const surface=await page.evaluate(()=>window.gestureQa.surface),spanFactor=mobile?Math.min(1,viewportBox.width/surface.width*.9/.4):1;
  report.inputFraming={mobile,viewportBox,center,spanFactor};
  const pair=(v,span,closed)=>['Left','Right'].map((id,i)=>({...hand({id,u:center.u+(i?1:-1)*span*spanFactor/2,v:mobile?center.v+v-.53:v},closed),...(mobile&&mode==='real'?{size:135}:{})}));
  async function anchorPair(v=.53,span=.28) {
    await release();await put(pair(v,span,false));await waitTracking();await samples();
    const hs=pair(v,span,true);await put(hs);await wait(()=>window.gestureQa.tracking.at(-1)?.mode==='scale');await samples();return hs;
  }
  await reset();let hs=await anchorPair(),to=pair(.40,.28,true);await glide(hs,to);
  let p=await pose();assert.ok(p.y>.35,'body moves up');near(p.scale,1,.12);assert.equal(await selected(),0);pass('two-pinches pan up',{pose:p});await shot('04-pan-up');
  await reset();hs=await anchorPair();to=pair(.66,.28,true);await glide(hs,to);
  p=await pose();assert.ok(p.y<-.35,'body moves down');near(p.scale,1,.12);pass('two-pinches pan down',{pose:p});await shot('05-pan-down');
  await reset();await release();let one=hand({id:'Left',u:mobile?center.u-.03*spanFactor:.32,v:mobile?center.v-.03:.50});await put([one]);await waitTracking();await samples();
  one=hand(one,true);await put([one]);await samples();const beforeRotate=await pose();
  await glide([one],[{...one,u:one.u+.11*spanFactor}]);p=await pose();assert.ok(p.rotationY>beforeRotate.rotationY+.2);assert.equal(await selected(),0);
  pass('one-pinch rotation without selection',{pose:p});await shot('06-rotate');
  await reset();hs=await anchorPair();const scaleBase=await pose();to=pair(.53,.40,true);await glide(hs,to);p=await pose();assert.ok(p.scale>1.25);near(p.y,scaleBase.y,.06);
  const retained=p;await put([to[0]]);await samples();near((await pose()).scale,retained.scale);await put(to);await samples();near((await pose()).scale,retained.scale);
  hs=to;to=pair(.43,.46,true);await glide(hs,to);p=await pose();assert.ok(p.y>.25&&p.scale>retained.scale+.08);assert.ok(p.scale<=1.8&&p.scale>=.55);
  pass('scale, simultaneous pan/scale, secondary loss and reanchor, existing bounds',{pose:p});await shot('07-scale');
  hs=await anchorPair(.53,.28);await glide(hs,pair(.53,.44,true));near((await pose()).scale,1.8,.001);
  for(let i=0;i<4;i++){hs=await anchorPair(.53,.40);await glide(hs,pair(.53,.28,true));}
  near((await pose()).scale,.55,.001);pass('actual two-pinch input reaches both unchanged scale clamps 0.55 / 1.8');

  await reset();await release();one=hand(mobile?await at({x:viewportBox.x+15,y:viewportBox.y+viewportBox.height*.4}):{id:'Left',u:.30,v:.50});await put([one]);await waitTracking();await samples();
  const brief=await mark('intentional-150ms-empty-input');
  await page.evaluate(h=>{window.gestureQa.hands=[];setTimeout(()=>{window.gestureQa.hands=[h];},150);},one);
  await page.waitForTimeout(1200);await waitTracking();
  const states=await page.evaluate(t=>window.gestureQa.tracking.filter(f=>f.time>=t).map(f=>f.state),brief);
  assert.ok(states.includes('grace'));assert.ok(!states.includes('lost'));pass('150 ms input absence uses grace and nearby recovery');
  const long=await mark('intentional-650ms-empty-input');
  await page.evaluate(h=>{window.gestureQa.hands=[];setTimeout(()=>{window.gestureQa.hands=[h];},650);},one);
  await page.waitForTimeout(1800);await waitTracking();
  const states2=await page.evaluate(t=>window.gestureQa.tracking.filter(f=>f.time>=t).map(f=>f.state),long);
  assert.ok(states2.includes('lost')&&states2.includes('reacquiring'));pass('loss beyond grace, reacquisition and settling');await release();

  }
  const list=control('systems-scroll');
  if(await page.locator('.xr-atlas-layers').getAttribute('open')===null)await control('layers-panel').click();
  await list.scrollIntoViewIfNeeded();
  const scrollState=id=>control(id).evaluate(e=>({top:e.scrollTop,max:e.scrollHeight-e.clientHeight}));
  let cardGraceDone=false;
  async function captureScroll(id) {
    await release();
    // Probe only before the gesture; this is the unchanged registry and real DOM spacing.
    await put([hand({id:'Left',u:.35,v:.5})]);await waitTracking();await samples();await release();
    const point=await control(id).evaluate((el,id)=>{
      const r=el.getBoundingClientRect();for(let dy=20;dy<r.height-15;dy+=2)for(const fraction of [.5,.35,.65]){
        const p={x:r.left+r.width*fraction,y:Math.min(innerHeight-20,r.bottom-dy)};
        if(p.y<r.top+12)continue;const q=window.gestureQa;if(q.options.mode==='real'&&q.surface&&(p.y-q.surface.top)/q.surface.height>.77)continue;if(q.uiAt(p).target?.id===id)return p;
      }
      return null;
    },id);assert.ok(point,'reachable scroll target '+id);
    const h=await aim(point),started=await mark('capture-'+id);await wait(id=>window.gestureQa.readCapture?.()===id,id);await continuity(started,'capture-'+id);
    if(id==='education-scroll'&&!cardGraceDone){
      cardGraceDone=true;const held=(await scrollState(id)).top;await mark('intentional-card-scroll-grace');
      await page.evaluate(h=>{window.gestureQa.hands=[];setTimeout(()=>{window.gestureQa.hands=[h];},150);},h);
      await page.waitForTimeout(1000);await waitTracking();assert.equal(await page.evaluate(()=>window.gestureQa.readCapture?.()),id);near((await scrollState(id)).top,held,2);
      await release();assert.equal(await page.evaluate(()=>window.gestureQa.readCapture?.()),null);
      pass('card scroll grace preserves capture; definitive loss releases; stable departure rearms');return captureScroll(id);
    }
    return {h,point,b:await control(id).boundingBox()};
  }
  async function scrollToEnd(id) {
    for(let i=0;i<10;i++){
      const s=await scrollState(id);if(s.top>=s.max-2)return;
      const a=await captureScroll(id),before=await pose(),sel=await selected();
      const end=hand(await at({x:a.point.x,y:Math.max(a.b.y+12,a.point.y-190)}));
      await glide([a.h],[end]);assert.deepEqual(await pose(),before);assert.equal(await selected(),sel);
      await release();assert.ok((await scrollState(id)).top>s.top+10,'scroll advances');
    }
    assert.ok((await scrollState(id)).top>=(await scrollState(id)).max-2,'scroll reaches the end');
  }
  if(section!=='card'){
  await scrollToEnd('systems-scroll');pass('system scroll owns gesture, reaches lower systems without manipulating anatomy');await shot('02-system-scroll');
  await dwell('integumentary-toggle');await release();await wait(()=>document.querySelector('[data-xr-hand-control=integumentary-toggle]').checked);
  await wait(()=>window.__med3dXrAtlas().modules.length>=8,null,45000);
  await scrollToEnd('systems-scroll');
  const skin=await dwell('integumentary-opacity');const target=hand(await at({x:skin.b.x+skin.b.width/3,y:skin.b.y+skin.b.height/2}));
  const beforeSlider=await pose();await glide([skin.h],[target]);assert.deepEqual(await pose(),beforeSlider);
  near(Number(await control('integumentary-opacity').inputValue()),40,5);await release();pass('Tegumentario dwell and opacity slider after system scroll');
  // Manual setup of a real selectable surface, never an injected selection or educational card.
  await control('integumentary-toggle').uncheck();}
  await control('reset-view').click();await page.waitForTimeout(600);
  const canvas=page.locator('.xr-scene canvas'),box=await canvas.boundingBox();await page.mouse.click(box.x+10,box.y+95);
  const hit=await page.evaluate(()=>{
    const r=document.querySelector('.xr-scene canvas').getBoundingClientRect();
    for(const p of window.__med3dXrAtlas().parts.filter(p=>p.visible))for(const[x,y,z]of p.screenSamples){
      const point={x:r.left+(x+1)*r.width/2,y:r.top+(1-y)*r.height/2};if(Math.abs(z)>1||document.elementFromPoint(point.x,point.y)?.tagName!=='CANVAS')continue;
      if(window.gestureQa.probe(point)?.kind==='selected')return point;
    }
  });assert.ok(hit,'real anatomical surface');await page.mouse.click(hit.x,hit.y);await control('education-scroll').waitFor();
  assert.ok((await scrollState('education-scroll')).max>0,'real educational card is scrollable');
  await scrollToEnd('education-scroll');assert.ok(await page.locator('.xr-education-sources').isVisible());
  pass('educational card hand scroll reaches sources/license with exclusive ownership');await shot('03-card-scroll');
  const closeBox=await control('close-card').boundingBox();
  const priority=await page.evaluate(p=>window.gestureQa.uiAt(p).target?.id,{x:closeBox.x+closeBox.width/2,y:closeBox.y+closeBox.height/2});assert.equal(priority,'close-card');
  await dwell('close-card');await release();assert.equal(await selected(),0);pass('card close button retains priority and activates by dwell');
  await shot('08-final-state');
}

export async function runLoadMatrix({page,mode,report,pass,mark,put,snapshot,summary,output}) {
  const ids=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'];
  const control=id=>page.locator('[data-xr-hand-control="'+id+'"]');
  const stop=async()=>{await put([]);await page.waitForTimeout(700);};
  const layers=async desired=>{await stop();for(const id of ids){const c=control(id+'-toggle');if(await c.isChecked()!==desired.includes(id))await c.setChecked(desired.includes(id));}};
  const stages=report.loadStages=[];
  async function measure(name,screenshots=false){
    await stop();await page.locator('.xr-viewport').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);
    const atlas=await page.evaluate(()=>{const a=window.__med3dXrAtlas();return{modules:a.modules.length,meshes:a.meshes,visibleMeshes:a.visibleMeshes,triangles:a.triangles};});
    await put([{id:'Left',u:.3,v:.52,ratio:.5,image:'pointing',size:240}]);
    const warmup=await mark(name+'-stabilization-start');
    const stable=await page.waitForFunction(()=>{const q=window.gestureQa,now=performance.now(),rows=q.tracking.filter(f=>f.time>=now-5000);return rows.length>=20&&now-rows[0].time>=4700&&rows.every(f=>f.state==='tracking')&&now-rows.at(-1).time<250;},null,{timeout:30000,polling:200}).then(()=>true).catch(()=>false);
    const ready=await mark(name+'-stabilization-end');
    const start=await mark(name+'-start');
    if(screenshots){for(let i=0;i<3;i++){await page.waitForTimeout(4500);const file=output+'/'+name+'-'+i+'.png';await page.screenshot({path:file,timeout:15000});report.captures.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});}}else await page.waitForTimeout(15000);
    const end=await mark(name+'-end'),raw=await snapshot();
    const span={...raw,frames:raw.frames.filter(f=>f.time>=start&&f.time<=end),tracking:raw.tracking.filter(f=>f.time>=start&&f.time<=end),raf:raw.raf.filter(f=>f.time>=start&&f.time<=end),longTasks:raw.longTasks.filter(f=>f.time>=start&&f.time<=end),video:raw.video.filter(f=>(f.time??f.start)>=start&&(f.time??f.start)<=end),inference:raw.inference.filter(f=>f.sampleTime>=start&&f.sampleTime<=end)};
    const stats=summary(span),losses=span.tracking.filter(f=>f.state==='grace'||f.state==='lost').length;
    stages.push({name,stabilization:{start:warmup,end:ready,stable,durationMs:ready-warmup},role:screenshots?'diagnostic-readback-contrast':'acceptance-continuity',atlas,start,end,durationMs:end-start,status:losses===0&&stats.validHands>=100?'PASS':'NOT_PASSED',stats});
    console.log(name,stages.at(-1).status,stats.validHands,'samples',losses,'loss callbacks');
  }
  // A is the separately launched minimal page, without this scene or modules.
  await control('layers-panel').click();await measure('B-skeletal');await control('layers-panel').click();await measure('C-skeletal-panel');
  await layers(ids.slice(0,4));await page.waitForFunction(()=>window.__med3dXrAtlas().modules.length===39,null,{timeout:90000,polling:1000});await measure('D-several');
  await layers(ids);await page.waitForFunction(()=>window.__med3dXrAtlas().modules.length===52,null,{timeout:120000,polling:1000});await measure('E-historical-11');
  await stop();for(const c of await page.getByRole('checkbox',{name:/Ampliación anatómica/}).all())await c.check();
  await page.waitForFunction(()=>window.__med3dXrAtlas().modules.length===92,null,{timeout:120000,polling:1000});
  await control('integumentary-toggle').uncheck();await measure('F-92-modules');await control('integumentary-toggle').check();await measure('G-with-skin');await measure('H-no-screenshots');await measure('I-with-screenshots',true);
  report.loadStages=stages;assert.ok(stages.filter(s=>s.role==='acceptance-continuity').every(s=>s.status==='PASS'),'All acceptance load stages preserve stable tracking');pass('progressive load matrix, 11 systems/92 modules; screenshot contrast recorded separately');
}
