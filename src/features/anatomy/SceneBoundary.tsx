import { Component, type ErrorInfo, type ReactNode } from 'react';
type Props = { children: ReactNode; resetKey?: string | number; onRetry?: () => void };
export default class SceneBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Anatomy renderer:', error.message, info.componentStack); }
  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', padding: 32, textAlign: 'center', color: '#667b83', background: '#eef3f3' }}>
      <strong style={{ color: '#234b50', fontSize: 18 }}>No se pudo iniciar la vista 3D</strong>
      <p style={{ maxWidth: 350, lineHeight: 1.6 }}>Comprueba que la aceleración gráfica del navegador esté activada e inténtalo de nuevo.</p>
      <button type="button" onClick={() => { this.setState({ failed: false }); this.props.onRetry?.(); }} style={{ justifySelf: 'center', padding: '11px 18px', borderRadius: 10, border: '1px solid #94b6b5', color: '#1b6362', background: 'white', cursor: 'pointer', font: 'inherit' }}>Reintentar</button>
    </div>;
  }
}
