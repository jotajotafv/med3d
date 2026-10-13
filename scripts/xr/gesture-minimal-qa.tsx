// Browser-only QA page. Imports the unchanged production hooks; no anatomy or renderer.
import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GestureController } from '../../src/features/xr/gestures';
import { useHandPointer } from '../../src/features/xr/useHandPointer';
import { useHandTracking } from '../../src/features/xr/useHandTracking';

function Minimal() {
  const [gestures] = useState(() => new GestureController({ verticalPan: true }));
  const root = useRef<HTMLElement>(null), viewport = useRef<HTMLDivElement>(null);
  const picker = useRef(null), [fires, setFires] = useState(0);
  const { cursorRef, tracking } = useHandPointer(gestures, picker, viewport, root);
  const { videoRef, status, start, stop } = useHandTracking(tracking);
  return <main className="xr-page" ref={root}>
    <h1>QA mínima · pipeline original · sin anatomía</h1>
    <section className="xr-atlas-workspace" style={{position:'relative',width:'min(900px,95vw)',height:650,border:'1px solid #567'}}>
      <div ref={viewport} className="xr-viewport" style={{height:500}}><canvas width="640" height="480" style={{width:'100%',height:500}}/></div>
      <div data-xr-ui style={{position:'absolute',right:80,top:180}}><button data-xr-hand-control="qa-dwell" style={{width:140,height:65}} onClick={()=>setFires(n=>n+1)}>Dwell {fires}</button></div>
    </section>
    <span ref={cursorRef} className="xr-hand-cursor" hidden style={{position:'fixed',left:0,top:0,width:12,height:12,background:'cyan',borderRadius:'50%',pointerEvents:'none'}}/>
    <video ref={videoRef} autoPlay muted playsInline style={{width:240}}/>
    <button id="qa-start" onClick={start}>Activar</button><button id="qa-stop" onClick={stop}>Detener</button>
    <output id="qa-camera">{status.camera}</output><output id="qa-fires">{fires}</output>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Minimal/>);
