// QA input boundaries only. real mode never substitutes Worker output or timestamps.
export function installAcceptanceFixture(options) {
  const q = window.gestureQa = { options, timeOrigin:performance.timeOrigin, hands: [], frames: [], video: [], raf: [], longTasks: [], marks: [], tracking: [], inference: [],
    sent: 0, received: 0, inFlight: 0, maxInFlight: 0, produced: 0, lastFrame: null, pausedInput: false, plan: null, photo: null };
  const keep = (array, row) => { array.push(row); if (array.length > 20000) array.shift(); };
  q.mark = name => { const row={name,time:performance.now()}; q.marks.push(row); return row.time; };
  let priorRaf = 0;
  const raf = time => { if(priorRaf)keep(q.raf,{time,dt:time-priorRaf});priorRaf=time;requestAnimationFrame(raf); };requestAnimationFrame(raf);
  try { new PerformanceObserver(list=>{for(const e of list.getEntries())keep(q.longTasks,{time:e.startTime,duration:e.duration});}).observe({type:'longtask',buffered:true}); } catch {}
  const bitmap = window.createImageBitmap.bind(window);
  window.createImageBitmap = async (...args) => { const start=performance.now(),videoTime=args[0]?.currentTime,readyState=args[0]?.readyState; const result=await bitmap(...args); keep(q.video,{videoTime,readyState,kind:'bitmap',start,end:performance.now()});return result; };
  const NativeWorker = window.Worker;
  const result = message => {
    if(message.type==='qa-inference'){keep(q.inference,message);return;}
    if(message.type!=='result')return;
    q.received++;q.inFlight--;q.lastFrame=message.frame;
    const v=document.querySelector('video'),quality=v?.getVideoPlaybackQuality?.();
    keep(q.frames,{time:performance.now(),sampleTime:message.timestamp,hands:message.frame.landmarks.length,
      visibility:document.visibilityState,readyState:v?.readyState,currentTime:v?.currentTime,paused:v?.paused,
      presented:quality?.totalVideoFrames,dropped:quality?.droppedVideoFrames});
  };
  const send = message => { if(message.type==='frame'){q.sent++;q.inFlight++;q.maxInFlight=Math.max(q.maxInFlight,q.inFlight);keep(q.video,{kind:'send',time:performance.now(),sampleTime:message.timestamp});} };
  if(options.mode==='real')window.Worker=class extends NativeWorker{
    constructor(...args){super(...args);this.addEventListener('message',e=>{result(e.data);if(e.data.type==='qa-inference')e.stopImmediatePropagation();});}
    postMessage(message,...args){send(message);return super.postMessage(message,...args);}
  };
  else window.Worker=class{
    onmessage=null;onerror=null;
    postMessage(message){
      send(message);
      if(message.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));
      else if(message.type==='close')queueMicrotask(()=>this.onmessage?.({data:{type:'closed'}}));
      else{
        message.bitmap.close();
        const hs=q.hands;
        const landmarks=hs.map(h=>{const x=1-h.u,y=h.v,p=Array.from({length:21},()=>({x,y,z:0}));p[0]={x,y:y+.12,z:0};p[9]={x,y:y-.12,z:0};p[4]={x:x+(h.ratio??.5)*.24/(4/3),y,z:0};return p;});
        const data={type:'result',timestamp:message.timestamp,frame:{landmarks,handedness:hs.map(h=>[{categoryName:h.id,score:.99}])}};
        queueMicrotask(()=>{result(data);this.onmessage?.({data});});
      }
    }
    terminate(){}
  };
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{
    const c=document.createElement('canvas');c.width=640;c.height=480;
    const ctx=c.getContext('2d',{alpha:false,willReadFrequently:true});
    const images={};
    if(options.mode==='real')for(const [name,url]of Object.entries(options.images)){const img=new Image();img.src=url;await img.decode();images[name]=img;}
    const stream=c.captureStream(0),track=stream.getVideoTracks()[0];
    const draw=()=>{
      if(q.pausedInput)return;
      const now=performance.now();
      if(q.plan){const {start,duration,from,to}=q.plan,t=Math.min(1,Math.max(0,(now-start)/duration));q.hands=to.map((h,i)=>({...h,u:from[i].u+(h.u-from[i].u)*t,v:from[i].v+(h.v-from[i].v)*t}));if(t===1)q.plan=null;}
      ctx.fillStyle='#e4e3e0';ctx.fillRect(0,0,640,480);
      if(options.mode==='real'){
        const hs=q.photo?[q.photo]:q.hands;
        for(const h of hs){const key=h.image??(h.ratio<.34?'fist':'pointing'),img=images[key];if(!img)continue;
          const size=h.size??240,anchor=h.anchor??{x:.5,y:.5};
          ctx.save();ctx.translate((1-h.u)*640,h.v*480);if(h.angle)ctx.rotate(h.angle);if(h.mirror)ctx.scale(-1,1);
          ctx.drawImage(img,-anchor.x*size,-anchor.y*size,size,size*img.height/img.width);ctx.restore();
        }
      }
      ctx.fillStyle=q.produced%2?'#222':'#777';ctx.fillRect(0,0,8,8);q.produced++;track.requestFrame();
      keep(q.video,{kind:'produced',time:now,count:q.produced});
    };
    draw();const timer=setInterval(draw,50);const stop=track.stop.bind(track);track.stop=()=>{clearInterval(timer);stop();};
    return stream;
  }});
}

// Transparent method observers. Never assign controller state or change return values.
export async function observeAcceptanceControllers() {
  const q=window.gestureQa;
  const loaded=path=>performance.getEntriesByType('resource').map(e=>e.name).filter(u=>new URL(u).pathname===path).at(-1)??path;
  const {HandStability}=await import(loaded('/med3d/src/features/xr/handStability.ts'));
  const {HandUiRouter}=await import(loaded('/med3d/src/features/xr/ui/handUiRouter.ts'));
  const {DwellController}=await import(loaded('/med3d/src/features/xr/dwell.ts'));
  const {HandUiRegistry}=await import(loaded('/med3d/src/features/xr/ui/HandUiRegistry.ts'));
  const {normalizeHands}=await import(loaded('/med3d/src/features/xr/gestures.ts'));
  if(document.querySelector('.xr-scene')){const {XrAtlasPresentation}=await import(loaded('/med3d/src/features/xr/atlas/presentation.ts'));const pick=XrAtlasPresentation.prototype.pick;XrAtlasPresentation.prototype.pick=function(...args){q.probe=point=>pick.call(this,point,...args.slice(1));return pick.apply(this,args);};}
  const update=HandStability.prototype.update;
  HandStability.prototype.update=function(...args){const start=performance.now(),mode=update.apply(this,args);
    q.state=this.trackingState;q.point=this.point;q.surface=this.surface;q.pose=()=>({...this.gestures.target,y:this.gestures.verticalOffset});
    q.normalized=normalizeHands(q.lastFrame??{landmarks:[],handedness:[]},4/3);
    const row={time:start,end:performance.now(),sampleTime:args[1],hands:args[0].length,state:this.trackingState,settleSince:this.settleSince,lastValid:this.lastReliableTime,
      target:q.target??null,dwell:q.dwell??null,capture:q.readCapture?.()??null,mode};
    q.tracking.push(row);if(q.tracking.length>20000)q.tracking.shift();return mode;};
  const router=HandUiRouter.prototype.update;
  HandUiRouter.prototype.update=function(...args){const mode=router.apply(this,args);q.target=this.targets.stable?.id??null;q.readCapture=()=>this.scroll.capture?.id??this.capture?.id??null;return mode;};
  const dwell=DwellController.prototype.update;
  DwellController.prototype.update=function(...args){const fired=dwell.apply(this,args);q.dwell=this.snapshot;(q.dwellEvents??=[]).push({time:performance.now(),sampleTime:args[1],...this.snapshot,fired:!!fired});if(q.dwellEvents.length>20000)q.dwellEvents.shift();if(fired)(q.fired??=[]).push({time:performance.now(),sampleTime:args[1],...this.snapshot});return fired;};
  const hit=HandUiRegistry.prototype.hitTest;
  HandUiRegistry.prototype.hitTest=function(...args){q.uiAt=p=>hit.call(this,p);return hit.apply(this,args);};
}
