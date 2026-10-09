import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowCounterClockwise, Camera, Hand, Minus, Plus } from '@phosphor-icons/react';
import XrHeartScene from './XrHeartScene';
import { GestureController } from './gestures';
import { arExplanation, detectCapabilities, UNKNOWN_CAPABILITIES, type Support } from './capabilities';
import { useHandTracking } from './useHandTracking';
import { useHandPointer } from './useHandPointer';
import { useManualControls } from './useManualControls';
import XrEducationCard from './XrEducationCard';
import type { HeartSelection, PickHandler, SelectionResult, SelectionRaycastApi } from './selection';
import './xr.css';

const supportLabel = (value: Support) => value === 'available' ? 'Disponible' : value === 'unknown' ? 'Sin confirmar' : 'No disponible';

export default function XrExperiencePage() {
  const gesturesRef = useRef<GestureController | null>(null);
  if (!gesturesRef.current) gesturesRef.current = new GestureController();
  const gestures = gesturesRef.current;
  const [selectedStructure, setSelectedStructure] = useState<HeartSelection | null>(null);
  const [unknownStructure, setUnknownStructure] = useState(false);
  const pickRef = useRef<SelectionRaycastApi | null>(null);
  const onTap = useCallback<PickHandler>(point => {
    const picker = pickRef.current; if (picker) picker.select(picker.hitTest(point));
  }, []);
  const onSelect = useCallback((result: SelectionResult) => {
    setSelectedStructure(result.kind === 'selected' ? result.selection : null);
    setUnknownStructure(result.kind === 'unknown');
  }, []);
  const clearSelection = useCallback(() => onSelect({ kind: 'empty' }), [onSelect]);
  const manual = useManualControls(gestures, onTap);
  const { cursorRef, tracking } = useHandPointer(gestures, pickRef, manual.ref);
  const { videoRef, status, start, stop } = useHandTracking(tracking);
  useEffect(() => {
    // Keep the heart above the mobile sheet without resizing/remounting its canvas.
    if (selectedStructure && window.matchMedia('(max-width: 760px)').matches) {
      manual.ref.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [selectedStructure, manual.ref]);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) clearSelection(); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [clearSelection]);
  const [capabilities, setCapabilities] = useState(UNKNOWN_CAPABILITIES);
  const [showCamera, setShowCamera] = useState(true);
  const [showAr, setShowAr] = useState(false);
  const cameraOn = ['loading', 'active', 'paused'].includes(status.camera);
  const pending = status.camera === 'requesting' || status.camera === 'loading';
  const active = cameraOn || pending;
  useEffect(() => {
    let live = true;
    const check = () => { void detectCapabilities(navigator, window.isSecureContext).then(result => { if (live) setCapabilities(result); }); };
    check();
    const xr = navigator.xr;
    xr?.addEventListener('devicechange', check);
    return () => { live = false; xr?.removeEventListener('devicechange', check); };
  }, []);
  const cameraLabel = { off: 'Desactivada', requesting: 'Permiso pendiente', loading: 'Preparando', active: 'Activa', paused: 'En pausa', error: 'No disponible' }[status.camera];
  return <main className="xr-page">
    <header className="xr-heading">
      <div><p className="xr-eyebrow">MED3D <span>/</span> EXPERIENCIA INMERSIVA</p>
        <h1>La anatomía,<br/><span>en tus manos.</span></h1>
        <p className="xr-intro">Utiliza la cámara de tu dispositivo para interactuar con un modelo anatómico mediante gestos.</p>
      </div>
      <div className="xr-heading-action"><p>Prototipo experimental de interacción gestual.</p>
        <button type="button" className="xr-ar-button" aria-label="Disfrutar experiencia RA, consultar disponibilidad" aria-expanded={showAr} aria-controls="xr-ar-message" onClick={() => setShowAr(value => !value)}>Disfrutar experiencia RA <ArrowUpRight size={17}/></button>
        <p className="xr-phase-note">RA inmersiva prevista para una siguiente fase.</p>
      </div>
    </header>
    {showAr && <p id="xr-ar-message" className="xr-ar-message" role="status">{arExplanation(capabilities.ar)}</p>}
    <section className="xr-workspace" aria-label="Experiencia interactiva con el corazón">
      <div className="xr-viewport" {...manual} tabIndex={0} role="group" aria-label="Corazón 3D interactivo" aria-describedby="xr-manual-help">
        <div className="xr-model-label"><span className="xr-eyebrow">MODELO PILOTO</span><strong>Corazón</strong><span>Vista anatómica 3D</span></div>
        <XrHeartScene gestures={gestures} selectedStructure={selectedStructure} pickRef={pickRef} onSelect={onSelect}/>
        <span className="xr-hand-cursor" ref={cursorRef} hidden aria-hidden="true"/>
        <div className={'xr-camera-preview' + (cameraOn && showCamera ? ' is-visible' : '')} aria-hidden={!cameraOn || !showCamera}>
          <video ref={videoRef} autoPlay muted playsInline aria-label="Vista previa de cámara en espejo"/>
          <span>Cámara · Vista espejo</span>
        </div>
        <div className="xr-viewport-controls">
          <button type="button" aria-label="Restablecer rotación y escala del corazón" onClick={() => gestures.reset()}><ArrowCounterClockwise size={17}/>Restablecer</button>
          <div><button type="button" aria-label="Reducir tamaño del corazón" onClick={() => gestures.scale(gestures.target.scale / 1.12, performance.now())}><Minus size={17}/></button>
            <button type="button" aria-label="Aumentar tamaño del corazón" onClick={() => gestures.scale(gestures.target.scale * 1.12, performance.now())}><Plus size={17}/></button></div>
        </div>
      </div>
      <aside className="xr-control-panel" aria-label="Control con manos">
        <p className="xr-eyebrow">INTERACCIÓN</p><h2>Manipula anatomía <br/>con tus propias manos.</h2>
        <button type="button" className="xr-primary-button" aria-label={active ? (pending ? 'Cancelar activación del control con manos' : 'Desactivar control con manos') : 'Activar control con manos'} onClick={active ? stop : start} disabled={!active && capabilities.camera === 'unavailable'}>
          <Camera size={18}/>{active ? (pending ? 'Cancelar activación' : 'Desactivar control con manos') : 'Activar control con manos'}
        </button>
        <p className="xr-privacy">La imagen de la cámara se procesa localmente en tu dispositivo. No se graba ni se envía.</p>
        <dl className="xr-tracking-status" aria-live="polite" aria-atomic="true">
          <div><dt>Cámara</dt><dd data-active={status.camera === 'active'}>{cameraLabel}</dd></div>
          <div><dt>Manos</dt><dd>{status.hands === 1 ? '1 detectada' : status.hands + ' detectadas'}</dd></div>
          <div><dt>Interacción</dt><dd>{{ idle: 'En espera', pointing: 'Apuntando', candidate: 'Seleccionando', rotate: 'Rotar', scale: 'Escalar' }[status.gesture]}</dd></div>
        </dl>
        {status.message && <p className="xr-status-message" role={status.camera === 'error' ? 'alert' : 'status'}>{status.message}</p>}
        {cameraOn && <button type="button" className="xr-preview-toggle" aria-label={showCamera ? 'Ocultar cámara' : 'Mostrar cámara'} aria-pressed={showCamera} onClick={() => setShowCamera(value => !value)}>{showCamera ? 'Ocultar cámara' : 'Mostrar cámara'}</button>}
        <div className="xr-gesture-guide"><Hand size={20} aria-hidden="true"/><div><p><strong>Apunta para explorar.</strong> Señala con el índice y junta y suelta brevemente pulgar e índice para seleccionar.</p>
          <p><strong>Una mano para rotar.</strong> Mantén el pinch o mueve la mano mientras lo haces.</p>
          <p><strong>Dos manos para escalar.</strong> Haz pinch con ambas y sepáralas o acércalas.</p></div></div>
      </aside>
    </section>
    <XrEducationCard selection={selectedStructure} unknown={unknownStructure} onClose={() => {
      clearSelection(); manual.ref.current?.focus({ preventScroll: true });
    }}/>
    <p id="xr-manual-help" className="xr-manual-help">Clic o toque breve: seleccionar · arrastra para rotar · rueda o dos dedos para ampliar · teclado: flechas, + / −, 0 para restablecer y Escape para deseleccionar.</p>
    <section className="xr-capabilities" aria-labelledby="xr-device-title">
      <div><h2 id="xr-device-title" className="xr-eyebrow">TU DISPOSITIVO</h2><p>La disponibilidad depende de tu navegador y hardware.</p></div>
      <dl><div><dt>Control con cámara</dt><dd>{supportLabel(capabilities.camera)}</dd></div>
        <div><dt>Realidad virtual</dt><dd>{supportLabel(capabilities.vr)}</dd></div>
        <div><dt>Realidad aumentada</dt><dd>{supportLabel(capabilities.ar)}</dd></div></dl>
      <p className="xr-capability-note">Cámara: disponibilidad de la API; requiere permiso y un dispositivo compatible. El seguimiento de manos y su rendimiento deben comprobarse en tu equipo.</p>
    </section>
    <p className="xr-attribution">Corazón: Visible Human / HRA · <a href="https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/main/VH_Male/v1.2/VH_M_Heart.glb" target="_blank" rel="noreferrer">Fuente original</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Recurso educativo existente, sin cambios en el asset.</p>
  </main>;
}
