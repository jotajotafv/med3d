import type { PinchCalibration } from './handInteraction';

/** Rendered only in development with ?xrDebug=1. One derived summary, no history. */
export default function XrCalibrationDebug({ summary }: { summary: PinchCalibration | null }) {
  return <aside className="xr-calibration-debug" aria-labelledby="xr-calibration-title">
    <h2 id="xr-calibration-title">Calibración XR · desarrollo</h2>
    {summary ? <dl>
      <div><dt>Duración del último pinch</dt><dd>{Math.round(summary.durationMs)} ms</dd></div>
      <div><dt>Movimiento máximo candidate</dt><dd>{summary.maxCandidateMovement.toFixed(4)}</dd></div>
      <div><dt>Resultado</dt><dd>{summary.outcome}</dd></div>
      <div><dt>Ratio mínimo</dt><dd>{summary.minRatio.toFixed(3)}</dd></div>
    </dl> : <p>Sin pinch completado.</p>}
  </aside>;
}
