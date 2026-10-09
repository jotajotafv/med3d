import type { HandStabilityDebug } from './handStability';

/** Development + ?xrDebug=1 only. Current derived state, no samples, history or persistence. */
export default function XrCalibrationDebug({ summary }: { summary: HandStabilityDebug | null }) {
  return <aside className="xr-calibration-debug" aria-labelledby="xr-calibration-title">
    <h2 id="xr-calibration-title">Calibración XR · desarrollo</h2>
    <dl>
      <div><dt>Tracking</dt><dd>{summary?.tracking ?? 'lost'}</dd></div>
      <div><dt>Cursor velocity</dt><dd>{(summary?.velocity ?? 0).toFixed(3)}</dd></div>
      <div><dt>Raw target</dt><dd>{summary?.rawTarget ?? 'none'}</dd></div>
      <div><dt>Stable target</dt><dd>{summary?.stableTarget ?? 'none'}</dd></div>
      <div><dt>Stable time</dt><dd>{Math.round(summary?.stableTimeMs ?? 0)} ms</dd></div>
      <div><dt>Lost duration</dt><dd>{Math.round(summary?.lostDurationMs ?? 0)} ms</dd></div>
      <div><dt>Last pinch</dt><dd>{summary?.lastPinch ?? 'none'}</dd></div>
    </dl>
  </aside>;
}
