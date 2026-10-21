import { useId } from 'react';
import { PRACTICA1_DEFAULTS, type Practica1Settings } from './Practica1PostFX';
import './practica1.css';

interface Props {
  settings: Practica1Settings;
  reducedMotion: boolean;
  onChange: (settings: Practica1Settings) => void;
}

export default function Practica1Panel({ settings, reducedMotion, onChange }: Props) {
  const id = useId();
  const status = reducedMotion || (!settings.film && !settings.glitch) ? 'Imagen original'
    : [settings.film && 'FilmPass', settings.glitch && (settings.intense ? 'GlitchPass intenso' : 'GlitchPass')].filter(Boolean).join(' + ');
  return <details className="practica1-panel">
    <summary><span>Práctica 1 · Efectos</span><small role="status" aria-live="polite">{status}</small></summary>
    <div className="practica1-body">
      <p id={id + '-warning'} className="practica1-warning">GlitchPass produce destellos rápidos. Actívalo solo si deseas verlos.</p>
      {reducedMotion && <p role="status">Movimiento reducido activado: los efectos permanecen deshabilitados.</p>}
      <label className="practica1-toggle"><span>FilmPass</span><input type="checkbox" role="switch" checked={!reducedMotion && settings.film} disabled={reducedMotion} onChange={event => onChange({ ...settings, film: event.target.checked })}/></label>
      <label className="practica1-range"><span>Intensidad FilmPass <output>{settings.intensity.toFixed(2)}</output></span><input aria-label="Intensidad FilmPass" type="range" min="0" max="1" step="0.05" value={settings.intensity} disabled={reducedMotion} onChange={event => onChange({ ...settings, intensity: Number(event.target.value) })}/></label>
      <label className="practica1-toggle"><span>GlitchPass</span><input type="checkbox" role="switch" aria-describedby={id + '-warning'} checked={!reducedMotion && settings.glitch} disabled={reducedMotion} onChange={event => onChange({ ...settings, glitch: event.target.checked, intense: false })}/></label>
      <label className="practica1-toggle"><span>Glitch intenso</span><input type="checkbox" aria-describedby={id + '-warning'} checked={!reducedMotion && settings.intense} disabled={reducedMotion || !settings.glitch} onChange={event => onChange({ ...settings, intense: event.target.checked })}/></label>
      <button type="button" onClick={() => onChange({ ...PRACTICA1_DEFAULTS })}>Restaurar imagen original</button>
      <p className="practica1-hint">Pliega este panel para ver el modelo completo.</p>
    </div>
  </details>;
}
