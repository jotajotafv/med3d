import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowDown, Pause, Play } from '@phosphor-icons/react';
import SiteLink from '../../components/SiteLink';
import './hero.css';

const HomeAnatomyScene = lazy(() => import('./HomeAnatomyScene'));

// A graphical failure must leave the navigation and primary action available.
class HeroSceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function HomeHero() {
  const hero = useRef<HTMLElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mountScene, setMountScene] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', change);
    let intersecting = true;
    const updateVisibility = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; updateVisibility(); });
    if (hero.current) observer.observe(hero.current);
    document.addEventListener('visibilitychange', updateVisibility);
    // Let the HTML and fonts paint before importing the renderer.
    const frame = requestAnimationFrame(() => setMountScene(true));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      preference.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  return <section ref={hero} className={`home-hero${ready ? ' is-ready' : ''}`} aria-labelledby="hero-title">
    <div className="home-orbits" aria-hidden="true"><div/><div/></div>
    <div className="home-anatomy-stage" aria-hidden="true">
      <HeroSceneBoundary onError={() => setFailed(true)}>
        <Suspense fallback={null}>
          {mountScene && <HomeAnatomyScene host={hero} running={visible && !paused && !reducedMotion}
            onReady={() => setReady(true)} onError={() => setFailed(true)}/>}
        </Suspense>
      </HeroSceneBoundary>
    </div>
    <svg className="home-anatomy-labels" aria-hidden="true">
      {['ENCÉFALO', 'PULMONES', 'CORAZÓN', 'SISTEMA MUSCULAR'].map((label, index) =>
        <g key={label} data-home-label={index} className={`home-label home-label--${index}`}>
          <path/><circle className="label-joint" r="4"/><circle className="label-anchor" r="1.8"/><text>{label}</text>
        </g>)}
    </svg>
    <div className="home-hero-copy">
      <h1 id="hero-title">Explora<br/>el cuerpo humano.</h1>
      <p>Conocimiento médico, en otra dimensión.</p>
      <SiteLink href="/anatomia/" className="home-hero-cta">Explorar ahora <ArrowRight size={20} weight="light"/></SiteLink>
    </div>
    <div className="home-hero-foot">
      <SiteLink href="#plataforma" className="home-scroll-link"><ArrowDown size={15} weight="light"/><span>Una nueva perspectiva</span></SiteLink>
      {!ready && !failed && <span className="home-scene-status" role="status">Preparando el modelo 3D</span>}
      {failed && <span className="home-scene-status" role="status">La vista 3D no está disponible. Puedes abrir el atlas.</span>}
      {ready && !failed && !reducedMotion && <button className="home-motion-toggle" type="button" onClick={() => setPaused(!paused)}
        aria-label={paused ? 'Reanudar rotación del modelo' : 'Pausar rotación del modelo'}>
        {paused ? <Play size={12}/> : <Pause size={12}/>}<span>{paused ? 'Reanudar giro' : 'Pausar giro'}</span>
      </button>}
    </div>
  </section>;
}
