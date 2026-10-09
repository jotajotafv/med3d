import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Camera, Minus, Plus } from '@phosphor-icons/react';
import { GestureController } from '../gestures';
import { useManualControls } from '../useManualControls';
import { useHandPointer } from '../useHandPointer';
import { useHandTracking } from '../useHandTracking';
import XrCalibrationDebug from '../XrCalibrationDebug';
import { XR_ATLAS_SYSTEMS, loadXrCatalog } from './systems';
import { XrAtlasAssets, type AtlasAssetsSnapshot } from './assets';
import { atlasReducer, initialAtlasState } from './state';
import type { AtlasPicker } from './presentation';
import XrAtlasScene from './XrAtlasScene';
import XrAtlasCard from './XrAtlasCard';
import './atlas-xr.css';

const EMPTY: AtlasAssetsSnapshot = { catalog: null, resources: [], systems: {} };

export default function XrAtlasExperience() {
  const [state, dispatch] = useReducer(atlasReducer, undefined, initialAtlasState);
  const [gestures] = useState(() => new GestureController());
  const [assets, setAssets] = useState(EMPTY), owner = useRef<XrAtlasAssets | null>(null);
  const [layersOpen, setLayersOpen] = useState(() => !window.matchMedia('(max-width:760px)').matches);
  const [showCamera, setShowCamera] = useState(true);
  const pickRef = useRef<AtlasPicker | null>(null);
  const uiRootRef = useRef<HTMLElement | null>(null);
  const onSelect = useCallback((id: string | null) => dispatch({ type: 'select', id }), []);
  const onTap = useCallback((point: { x: number; y: number }) => { const picker = pickRef.current; if (picker) picker.select(picker.hitTest(point)); }, []);
  const manual = useManualControls(gestures, onTap);
  const { cursorRef, tracking, debugEnabled, calibration } = useHandPointer(gestures, pickRef, manual.ref, uiRootRef);
  const { videoRef, status, start, stop } = useHandTracking(tracking);
  const active = ['requesting', 'loading', 'active', 'paused'].includes(status.camera);
  const cameraOn = ['loading', 'active', 'paused'].includes(status.camera);
  useEffect(() => {
    const manager = new XrAtlasAssets(loadXrCatalog);
    owner.current = manager; const unsubscribe = manager.subscribe(setAssets);
    void manager.ensure('skeletal');
    return () => { unsubscribe(); manager.dispose(); if (owner.current === manager) owner.current = null; };
  }, []);
  useEffect(() => { XR_ATLAS_SYSTEMS.forEach(({ id: system }) => { if (state.systemVisibility[system]) void owner.current?.ensure(system); }); }, [state.systemVisibility]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) onSelect(null); };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [onSelect]);
  useEffect(() => {
    if (state.selectedStructure && window.matchMedia('(max-width:760px)').matches) manual.ref.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [state.selectedStructure, manual.ref]);
  const selected = assets.catalog?.nodes.find(node => node.id === state.selectedStructure);
  const resetView = () => { gestures.reset(); tracking.endGesture(); dispatch({ type: 'resetView' }); };
  useEffect(() => {
    if (status.camera === 'active') uiRootRef.current?.querySelector('.xr-atlas-workspace')?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [status.camera]);
  return <main className="xr-page xr-atlas-page" ref={uiRootRef}>
    <span className="xr-hand-cursor" ref={cursorRef} hidden aria-hidden="true"/>
    {debugEnabled && <XrCalibrationDebug summary={calibration}/>}
    <header className="xr-heading"><div><p className="xr-eyebrow">MED3D <span>/</span> ATLAS XR</p>
      <h1>El cuerpo,<br/><span>en tus manos.</span></h1><p className="xr-intro">Explora los once sistemas del atlas. Activa las capas que quieras estudiar.</p></div>
      <p className="xr-atlas-note">Experiencia experimental · pantalla y cámara opcional.</p></header>
    <section className="xr-atlas-workspace" aria-label="Atlas XR de once sistemas">
      <div className="xr-viewport" {...manual} onKeyDown={event => { if (event.target === event.currentTarget && event.key === '0') { event.preventDefault(); resetView(); } else manual.onKeyDown(event); }}
        tabIndex={0} role="group" aria-label="Atlas XR 3D interactivo" aria-describedby="xr-atlas-help">
        <div className="xr-model-label"><span className="xr-eyebrow">ATLAS XR</span><strong>Cuerpo humano</strong></div>
        {assets.catalog ? <XrAtlasScene assets={assets} state={state} gestures={gestures} pickRef={pickRef} onSelect={onSelect}/>
          : <div className="xr-scene-message" role="status">Preparando sistema óseo…</div>}
        <div className={'xr-camera-preview' + (cameraOn && showCamera ? ' is-visible' : '')} aria-hidden={!cameraOn || !showCamera}>
          <video ref={videoRef} autoPlay muted playsInline aria-label="Vista previa de cámara en espejo"/><span>Cámara · Vista espejo</span></div>
        <div className="xr-atlas-loading" data-xr-ui>{XR_ATLAS_SYSTEMS.map(({ id: system, label, name }) => {
          const load = assets.systems[system];
          return load?.error ? <p role="alert" key={system}>{label}: {load.error} <button type="button" onClick={() => owner.current?.retry(system)}>Reintentar {label}</button></p>
            : load?.pending && state.systemVisibility[system] ? <p role="status" key={system}>Cargando {name.toLowerCase()}…</p> : null;
        })}</div>
        <div className="xr-viewport-controls"><button type="button" data-xr-hand-control="reset-view" onClick={resetView}>Restablecer vista</button>
          <div><button type="button" aria-label="Reducir tamaño del atlas" onClick={() => gestures.scale(gestures.target.scale / 1.12, performance.now())}><Minus size={17}/></button>
            <button type="button" aria-label="Aumentar tamaño del atlas" onClick={() => gestures.scale(gestures.target.scale * 1.12, performance.now())}><Plus size={17}/></button></div></div>
      </div>
      <aside className="xr-atlas-tools" aria-label="Capas y control del Atlas XR" data-xr-ui>
        <details className="xr-atlas-layers" open={layersOpen} onToggle={event => setLayersOpen(event.currentTarget.open)}>
          <summary data-xr-hand-control="layers-panel">Sistemas y despiece</summary>
          <fieldset disabled={!!state.isolatedStructure}><legend>Sistemas</legend>
            <div className="xr-atlas-system-list" role="group" aria-label="Once sistemas anatómicos">
            {XR_ATLAS_SYSTEMS.map(({ id: system, label }) => <div className="xr-atlas-layer" key={system}>
              <label><input type="checkbox" data-xr-hand-control={system + '-toggle'} checked={state.systemVisibility[system]} onChange={event => dispatch({ type: 'system', system, enabled: event.target.checked })}/>{label}</label>
              {state.systemVisibility[system] && <label className="xr-atlas-range">Opacidad {label} <output>{Math.round(state.systemOpacity[system] * 100)}%</output>
                <input type="range" data-xr-hand-control={system + '-opacity'} min="10" max="100" step="1" aria-label={'Opacidad ' + label} value={state.systemOpacity[system] * 100} onChange={event => dispatch({ type: 'opacity', system, value: Number(event.target.value) / 100 })}/></label>}
            </div>)}
            </div>
          </fieldset>
          <label className="xr-atlas-range xr-atlas-explode">Despiece <output>{Math.round(state.explodedAmount * 100)}%</output>
            <input type="range" data-xr-hand-control="explosion" aria-label="Despiece" min="0" max="100" step="1" value={state.explodedAmount * 100} onChange={event => dispatch({ type: 'explode', value: Number(event.target.value) / 100 })}/></label>
          {state.isolatedStructure && <p className="xr-atlas-isolation">Estructura aislada. <button type="button" data-xr-hand-control="exit-isolation" onClick={() => dispatch({ type: 'exitIsolation' })}>Restaurar conjunto</button></p>}
          <div className="xr-atlas-restore"><button type="button" data-xr-hand-control="restore-hidden" disabled={!state.hiddenStructures.length || !!state.isolatedStructure} onClick={() => dispatch({ type: 'restoreHidden' })}>Restaurar estructuras</button>
            <button type="button" data-xr-hand-control="restore-atlas" onClick={() => dispatch({ type: 'restoreAtlas' })}>Restaurar atlas</button></div>
        </details>
        <div className="xr-atlas-hands"><p className="xr-eyebrow">CONTROL CON MANOS</p>
          <button type="button" className="xr-primary-button" onClick={active ? stop : start}><Camera size={17}/>{active ? 'Desactivar control con manos' : 'Activar control con manos'}</button>
          <p className="xr-privacy">La imagen de la cámara se procesa localmente en tu dispositivo. No se graba ni se envía.</p>
          <dl className="xr-tracking-status" aria-live="polite"><div><dt>Cámara</dt><dd>{{ off: 'Desactivada', requesting: 'Permiso pendiente', loading: 'Preparando', active: 'Activa', paused: 'En pausa', error: 'No disponible' }[status.camera]}</dd></div>
            <div><dt>Manos</dt><dd>{status.hands} detectadas</dd></div><div><dt>Interacción</dt><dd>{{ idle: 'En espera', pointing: 'Apuntando', candidate: 'Preparando rotación', rotate: 'Rotar', scale: 'Escalar' }[status.gesture]}</dd></div></dl>
          {status.message && <p className="xr-status-message" role="status">{status.message}</p>}
          {cameraOn && <button type="button" className="xr-preview-toggle" onClick={() => setShowCamera(value => !value)}>{showCamera ? 'Ocultar cámara' : 'Mostrar cámara'}</button>}
          <p className="xr-atlas-guide">Apunta 1 segundo para seleccionar o activar controles. En sliders, espera el aro y mueve el índice horizontalmente; sal verticalmente para soltar. Pinch y movimiento para rotar · dos pinches para escalar.</p>
        </div>
      </aside>
    </section>
    <p id="xr-atlas-help" className="xr-manual-help">Clic o toque: seleccionar · arrastra para rotar · rueda o dos dedos para ampliar · flechas y + / − · 0: restablecer vista · Escape: deseleccionar.</p>
    <p className="xr-selection-announcement" role="status" aria-live="polite">{selected ? `${selected.name} seleccionado.` : 'Sin estructura seleccionada.'}</p>
    {!selected && <div className="xr-selection-prompt"><h2>SELECCIONA UNA ESTRUCTURA</h2><p>Toca o haz clic sobre el cuerpo para explorar su anatomía.</p></div>}
    {selected && assets.catalog && <XrAtlasCard node={selected} catalog={assets.catalog} isolated={state.isolatedStructure === selected.id}
      onClose={() => { onSelect(null); manual.ref.current?.focus({ preventScroll: true }); }}
      onIsolate={() => dispatch(state.isolatedStructure === selected.id ? { type: 'exitIsolation' } : { type: 'isolate', id: selected.id })}
      onHide={() => dispatch({ type: 'hide', id: selected.id })}/>}
    <div className="xr-attribution">{[...new Map(assets.catalog?.provenance.map(source => [source.source + source.license, source])).values()].map(source =>
      <p key={source.id}><a href={source.originalUrl} target="_blank" rel="noreferrer">{source.source}</a> · <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></p>)}
      <p>Cobertura anatómica disponible del Atlas MED3D.</p></div>
  </main>;
}
