// Browser-only, bounded observers. Product sources are intercepted in QA, never edited.
export function installPerformanceObservers() {
  const p=window.xrPerf={events:[],render:[],commits:[],heap:[],dropped:0};
  p.keep=(rows,row)=>{if(rows.length<60000)rows.push(row);else p.dropped++;};
  p.event=(kind,start=performance.now(),end=start,data={})=>p.keep(p.events,{kind,start,end,...data});
  p.measure=(kind,fn,data={})=>{const start=performance.now();try{return fn();}finally{p.event(kind,start,performance.now(),data);}};
  p.rendered=(start,end,details)=>p.keep(p.render,{start,end,...details});
  // React DevTools public integration observes commit notifications, not internal state.
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,renderers:new Map(),
    inject(renderer){const id=this.renderers.size+1;this.renderers.set(id,renderer);return id;},
    onCommitFiberRoot(id,root){p.keep(p.commits,{time:performance.now(),renderer:id});},
    onCommitFiberUnmount(){},onPostCommitFiberRoot(){}};
  for(const proto of [window.WebGLRenderingContext?.prototype,window.WebGL2RenderingContext?.prototype]){
    if(!proto)continue;
    for(const key of ['compileShader','linkProgram','getProgramParameter','getShaderParameter','getUniformLocation','getAttribLocation']){
      const original=proto[key];if(!original)continue;
      proto[key]=function(...args){return p.measure('shader-api',()=>original.apply(this,args),{method:key});};
    }
    const upload=proto.bufferData;
    proto.bufferData=function(...args){return p.measure('buffer-upload',()=>upload.apply(this,args),{bytes:args[1]?.byteLength??args[1]});};
    const use=proto.useProgram;
    proto.useProgram=function(...args){p.programSwitches=(p.programSwitches??0)+1;return use.apply(this,args);};
  }
  setInterval(()=>{if(performance.memory)p.keep(p.heap,{time:performance.now(),used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize});},1000);
}

function replaceOnce(body,needle,replacement){
  if(!body.includes(needle))throw Error('QA instrumentation anchor missing: '+needle.slice(0,100));
  return body.replace(needle,replacement);
}

export async function instrumentPerformance(page,{delegate='CPU'}={}){
  await page.route('**/hand-tracking.worker.ts?*',async route=>{
    const response=await route.fetch();let body=await response.text();
    const needle='const result = detector.detectForVideo(message.bitmap, message.timestamp);';
    body=replaceOnce(body,needle,`const __qaStart=performance.now(); ${needle}
      send({type:'qa-inference',sampleTime:message.timestamp,received:__qaReceived,start:__qaStart,end:performance.now(),timeOrigin:performance.timeOrigin,hands:result.landmarks.length,delegate:'${delegate}',workerRenderer:typeof __qaCanvas==='undefined'?null:(__qaRenderer??=(()=>{const g=__qaCanvas.getContext('webgl2'),ext=g?.getExtension('WEBGL_debug_renderer_info');return g?.getParameter(ext?.UNMASKED_RENDERER_WEBGL??g.RENDERER)??'unavailable';})())});`);
    body=replaceOnce(body,'const message = event.data;','const __qaReceived=performance.now(); const message = event.data;');
    if(delegate==='GPU')body='let __qaCanvas, __qaRenderer;\n'+replaceOnce(body,'baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },',
      'canvas: (__qaCanvas=new OffscreenCanvas(1,1)), baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" },');
    await route.fulfill({response,body});
  });
  await page.route('**/anatomy/atlas/asset-manager.ts*',async route=>{
    const response=await route.fetch();let body=await response.text();
    body=replaceOnce(body,'const response = await fetch(url, { signal });',"const __qaDownload=performance.now(); const response = await fetch(url, { signal });");
    body=replaceOnce(body,'const gltf = await new GLTFLoader()',"window.xrPerf.event('download',__qaDownload,performance.now(),{asset:asset.id,bytes:buffer.byteLength}); const __qaParse=performance.now(); const gltf = await new GLTFLoader()");
    body=replaceOnce(body,'const source = collectResources(gltf.scene)',"window.xrPerf.event('glb-parse',__qaParse,performance.now(),{asset:asset.id}); const __qaPrepare=performance.now(); const source = collectResources(gltf.scene)");
    body=replaceOnce(body,'let disposed = false;',"window.xrPerf.assetGroups.set(group,asset.id); window.xrPerf.event('geometry-prepare',__qaPrepare,performance.now(),{asset:asset.id,meshes:parts.length,geometryBytes}); let disposed = false;");
    body+=`\nif(!MeshoptDecoder.__qaObserved){MeshoptDecoder.__qaObserved=true;const decode=MeshoptDecoder.decodeGltfBufferAsync;
      MeshoptDecoder.decodeGltfBufferAsync=function(...args){const start=performance.now();return decode.apply(this,args).finally(()=>window.xrPerf.event('meshopt',start,performance.now(),{count:args[0],size:args[1]}));};}\n`;
    body+=`\nwindow.xrPerf.assetGroups??=new WeakMap();
      if(!window.xrPerf.addObserved){window.xrPerf.addObserved=true;const add=THREE.Object3D.prototype.add;
        THREE.Object3D.prototype.add=function(...objects){const ids=objects.map(o=>window.xrPerf.assetGroups.get(o)).filter(Boolean);
          return ids.length?window.xrPerf.measure('scene-add',()=>add.apply(this,objects),{assets:ids}):add.apply(this,objects);};}\n`;
    await route.fulfill({response,body});
  });
  await page.route('**/xr/atlas/presentation.ts*',async route=>{
    const response=await route.fetch();let body=await response.text();
    body+=`\nfor(const method of ['add','apply','pick']){const original=XrAtlasPresentation.prototype[method];
      XrAtlasPresentation.prototype[method]=function(...args){return window.xrPerf.measure('presentation-'+method,()=>original.apply(this,args),{parts:this.parts.length});};}\n`;
    await route.fulfill({response,body});
  });
  await page.route('**/xr/atlas/XrAtlasScene.tsx*',async route=>{
    const response=await route.fetch();let body=await response.text();
    body=replaceOnce(body,'renderTimes.push(now - started);',`renderTimes.push(now - started);
      window.xrPerf.rendered(started,now,{drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,programSwitches:window.xrPerf.programSwitches??0,meshes:presentation.parts.length,visible:presentation.visibleMeshes.length});window.xrPerf.programSwitches=0;`);
    body=replaceOnce(body,'window.__med3dXrAtlas = inspect;',`window.__med3dXrAtlas = inspect;
      const __qaRender=gl.render; gl.render=function(...args){if(window.xrPerf.suspendRender)return;const start=performance.now();try{return __qaRender.apply(this,args);}finally{window.xrPerf.event('renderer-total',start,performance.now());}};
      window.xrPerf.scene=()=>({modules:latest.current.assets.resources.map(r=>r.asset.id),meshes:presentation.parts.length,visibleMeshes:presentation.visibleMeshes.length,materials:presentation.materialCount,systems:latest.current.assets.systems,timings:timings.current,state:latest.current.state,geometryBytes:latest.current.assets.resources.reduce((s,r)=>s+r.geometryBytes,0),bytes:latest.current.assets.resources.reduce((s,r)=>s+r.asset.bytes,0),...metrics.current});`);
    body=replaceOnce(body,'if (window.__med3dXrAtlas === inspect)', 'gl.render=__qaRender; if (window.__med3dXrAtlas === inspect)');
    await route.fulfill({response,body});
  });
}

export function statistics(values){
  const a=values.filter(Number.isFinite).sort((a,b)=>a-b),pct=q=>a[Math.min(a.length-1,Math.floor(a.length*q))]??null;
  return {n:a.length,p50:pct(.5),p95:pct(.95),p99:pct(.99),max:a.at(-1)??null};
}

export function summarizeWindow(timeline,start,end){
  const {q,p}=timeline,inside=t=>t>=start&&t<=end;
  const frames=q.frames.filter(f=>inside(f.time)),valid=frames.filter(f=>f.hands>0);
  const intervals=valid.slice(1).map((f,i)=>({start:valid[i].time,end:f.time,gap:f.time-valid[i].time,sampleTime:f.sampleTime}));
  // Include edge silence, even if no valid result arrived. Avoid hiding tail gaps.
  if(valid.length){intervals.unshift({start,end:valid[0].time,gap:valid[0].time-start,edge:true});intervals.push({start:valid.at(-1).time,end,gap:end-valid.at(-1).time,edge:true});}
  else intervals.push({start,end,gap:end-start,edge:true});
  const inference=q.inference.map(f=>({...f,start:f.start+f.timeOrigin-q.timeOrigin,end:f.end+f.timeOrigin-q.timeOrigin,received:f.received+f.timeOrigin-q.timeOrigin})).filter(f=>inside(f.end));
  const events=p.events.filter(e=>e.end>=start&&e.start<=end),render=p.render.filter(e=>inside(e.end));
  const interrupted=intervals.filter(g=>g.gap>250).map(g=>{
    const overlap=(a,b)=>Math.max(0,Math.min(g.end,b)-Math.max(g.start,a));
    const inf=inference.filter(f=>overlap(f.start,f.end)>0);
    const long=q.longTasks.filter(f=>overlap(f.time,f.time+f.duration)>0);
    const nearby=events.filter(e=>overlap(e.start,e.end)>0&&e.end-e.start>10);
    const mainMs=long.reduce((s,f)=>s+overlap(f.time,f.time+f.duration),0);
    const inferMs=inf.reduce((s,f)=>s+overlap(f.start,f.end),0);
    let category='UNKNOWN';
    // Wall-time attribution is not exclusive CPU attribution. Keep overlapping evidence.
    const competing=inferMs>g.gap*.65&&mainMs>g.gap*.5;
    if(competing)category='UNKNOWN';
    else if(inferMs>g.gap*.65)category='MEDIAPIPE_INFERENCE';
    else if(mainMs>g.gap*.5){category='MAIN_THREAD_BLOCK';
      if(nearby.some(e=>e.kind==='renderer-total'&&overlap(e.start,e.end)>g.gap*.5))category='RENDER_PRESSURE';
      for(const [kind,label]of [['glb-parse','GLB_DECODE'],['geometry-prepare','SCENE_PUBLICATION'],['presentation-add','SCENE_PUBLICATION'],['shader-api','SHADER_COMPILE']])
        if(nearby.some(e=>e.kind===kind&&overlap(e.start,e.end)>g.gap*.5))category=label;
    }
    const matching=inf.find(f=>f.sampleTime===g.sampleTime),sent=q.video.find(f=>f.kind==='send'&&f.sampleTime===g.sampleTime);
    if(category==='UNKNOWN'&&!competing&&matching&&sent&&matching.received-sent.time>g.gap*.5)category='WORKER_SCHEDULING';
    return {...g,category,ambiguousConcurrentBlocks:competing,inferenceOverlapMs:inferMs,mainLongTaskOverlapMs:mainMs,inferences:inf.map(f=>({sampleTime:f.sampleTime,start:f.start,end:f.end,duration:f.end-f.start})),events:nearby.map(e=>({kind:e.kind,start:e.start,end:e.end,asset:e.asset}))};
  });
  const sends=new Map(q.video.filter(f=>f.kind==='send').map(f=>[f.sampleTime,f.time]));
  const received=new Map(q.frames.map(f=>[f.sampleTime,f.time]));
  const tracking=q.tracking.filter(f=>inside(f.time));
  const transitions=tracking.filter((f,i)=>!i||f.state!==tracking[i-1].state).map(({time,state,mode,capture})=>({time,state,mode,capture}));
  return {start,end,durationMs:end-start,validSamples:valid.length,received:frames.length,maxInFlight:q.maxInFlight,
    sampleGapMs:statistics(intervals.map(f=>f.gap)),sampleClockGapMs:statistics(valid.slice(1).map((f,i)=>f.sampleTime-valid[i].sampleTime)),sampleAgeMs:statistics(frames.map(f=>f.time-f.sampleTime)),inferenceMs:statistics(inference.map(f=>f.end-f.start)),
    workerQueueMs:statistics(inference.map(f=>f.received-sends.get(f.sampleTime))),resultDeliveryMs:statistics(inference.map(f=>received.get(f.sampleTime)-f.end)),
    bitmapMs:statistics(q.video.filter(f=>f.kind==='bitmap'&&inside(f.end)).map(f=>f.end-f.start)),
    rafMs:statistics(q.raf.filter(f=>inside(f.time)).map(f=>f.dt)),renderCpuMs:statistics(render.map(f=>f.end-f.start)),drawCalls:statistics(render.map(f=>f.drawCalls)),programSwitches:statistics(render.map(f=>f.programSwitches)),
    longTasks:statistics(q.longTasks.filter(f=>inside(f.time)).map(f=>f.duration)),reactCommits:p.commits.filter(f=>inside(f.time)).length,
    sourceFrameGapMs:statistics(q.video.filter(f=>f.kind==='produced'&&inside(f.time)).map((f,i,a)=>i?f.time-a[i-1].time:NaN)),
    sampleMonotonic:frames.every((f,i)=>!i||f.sampleTime>frames[i-1].sampleTime),videoMonotonic:frames.every((f,i)=>!i||f.currentTime>=frames[i-1].currentTime),
    droppedVideoFrames:frames.length?frames.at(-1).dropped-frames[0].dropped:null,pausedVideoSamples:frames.filter(f=>f.paused).length,visibility:[...new Set(frames.map(f=>f.visibility))],focus:[...new Set(frames.map(f=>f.focused).filter(v=>typeof v==='boolean'))],
    eventsByKind:Object.fromEntries([...new Set(events.map(e=>e.kind))].map(k=>[k,statistics(events.filter(e=>e.kind===k).map(e=>e.end-e.start))])),
    transitions,trackingLosses:transitions.filter(f=>f.state==='lost').length,graceEntries:transitions.filter(f=>f.state==='grace').length,interruptions:interrupted,
    pass:valid.length>=100&&interrupted.length===0&&tracking.length>0&&tracking.every(f=>f.state==='tracking')&&q.maxInFlight<=1};
}
