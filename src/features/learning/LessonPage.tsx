import SiteLink from "../../components/SiteLink";
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CaretLeft, CaretRight, Check, Clock, Cube, Info, Pause, Play, ArrowsClockwise, CornersOut, X } from '@phosphor-icons/react';
import { lessons, lessonHref, reviewDate, type Lesson, type LessonKind } from './content';
import { LearningIcon } from './LearningCatalog';
import './learning.css';
const LearningScene = lazy(() => import('./LearningScene'));

class SceneBoundary extends Component<{children: ReactNode; onRetry: () => void}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? <div className="learning-scene-message"><Cube size={42} weight="light" /><h3>No se pudo abrir la escena</h3><p>Puedes continuar leyendo los pasos o volver a cargar el visor.</p><button onClick={this.props.onRetry}><ArrowsClockwise size={18} />Reintentar</button></div> : this.props.children; }
}
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
function LessonExperience({ lesson }: {lesson: Lesson}) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [freeCamera, setFreeCamera] = useState(false);
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const duration = Math.max(lesson.steps.length * 12, 1);
  const stepIndex = Math.min(Math.floor(progress * lesson.steps.length), lesson.steps.length - 1);
  const step = lesson.steps[stepIndex];
  const equipment = lesson.equipment.find(item => item.id === equipmentId);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!playing || !lesson.scene) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, .1);
      last = now;
      setProgress(value => Math.min(1, value + elapsed * speed / duration));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, duration, lesson.scene]);
  useEffect(() => { if (progress >= 1) setPlaying(false); }, [progress]);
  const goToStep = (index: number) => { setPlaying(false); setProgress(Math.max(0, Math.min(index, lesson.steps.length - 1)) / lesson.steps.length); };
  const togglePlay = () => { if (progress >= 1) setProgress(0); setPlaying(value => !value); };
  const restart = () => { setPlaying(false); setProgress(0); setFreeCamera(false); };
  return <>
    <div className={`learning-workspace ${lesson.preparation ? 'is-preparation' : ''}`}>
      <section className="learning-stage-panel" aria-label="Escenario educativo">
        <div className="learning-stage-toolbar"><span><Cube size={16} />{lesson.scene ? 'ESCENARIO INTERACTIVO' : 'ESPACIO DE APRENDIZAJE'}</span>{lesson.scene && <button onClick={() => setFreeCamera(value => !value)} className={freeCamera ? 'is-active' : ''} aria-pressed={freeCamera}><CornersOut size={16} />{freeCamera ? 'Cámara libre' : 'Cámara guiada'}</button>}</div>
        <div className="learning-stage">
          {lesson.scene ? <>
            <div className="learning-scene-container" role="img" aria-label={lesson.scene === 'pressure' ? 'Modelo 3D esquemático de una persona sentada junto a un tensiómetro de brazo. El equipo también puede seleccionarse en la lista de materiales.' : 'Modelo 3D esquemático de dos maniquíes adultos para aprender la secuencia de RCP.'}>
              {mounted ? <SceneBoundary key={sceneAttempt} onRetry={() => setSceneAttempt(value => value + 1)}><Suspense fallback={<div className="learning-scene-message"><span className="learning-loading-ring" /><p>Preparando el escenario 3D</p></div>}><LearningScene scene={lesson.scene} progress={progress} playing={playing} speed={speed} freeCamera={freeCamera} onSelectEquipment={setEquipmentId} /></Suspense></SceneBoundary> : <div className="learning-scene-message"><Cube size={38} /><p>Preparando el escenario 3D</p></div>}
            </div>
            <div className="learning-stage-label"><span className="learning-live-dot" />MODELO ESQUEMÁTICO · ADULTOS</div>
            <div className="learning-stage-hint">{freeCamera ? 'Arrastra para girar · Acerca con la rueda o con dos dedos' : lesson.scene === 'pressure' ? (stepIndex === 5 ? '118/76 mmHg · Datos ficticios de una demostración' : 'Selecciona el manguito o el monitor para explorar el equipo') : 'La cámara acompaña cada paso de la secuencia'}</div>
          </> : <div className="learning-scene-message learning-preparation-message"><LearningIcon name={lesson.icon} size={66} /><span className="learning-eyebrow">PRÓXIMAMENTE EN ESTE MÓDULO</span><h3>Escena 3D en preparación</h3><p>{lesson.preparation ? 'Puedes explorar la ficha de materiales. El recorrido práctico se añadirá tras su preparación y revisión.' : 'La guía de lectura ya está disponible. Recorre los pasos y consulta las fuentes al final del módulo.'}</p></div>}
        </div>
        {lesson.scene && <div className="learning-player">
          <div className="learning-player-timeline"><span>{timeLabel(progress * duration)}</span><input type="range" min="0" max="1000" step="1" value={Math.round(progress * 1000)} aria-label="Avance de la animación" aria-valuetext={`Paso ${stepIndex + 1} de ${lesson.steps.length}, ${timeLabel(progress * duration)}`} onChange={event => {setPlaying(false); setProgress(Number(event.target.value) / 1000);}} /><span>{timeLabel(duration)}</span></div>
          <div className="learning-player-controls"><div className="learning-player-main"><button aria-label="Paso anterior" title="Paso anterior" disabled={stepIndex <= 0} onClick={() => goToStep(stepIndex - 1)}><CaretLeft size={20} /></button><button className="learning-play-button" aria-label={playing ? 'Pausar animación' : 'Reproducir animación'} title={playing ? 'Pausar' : 'Reproducir'} onClick={togglePlay}>{playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}</button><button aria-label="Paso siguiente" title="Paso siguiente" disabled={stepIndex >= lesson.steps.length - 1} onClick={() => goToStep(stepIndex + 1)}><CaretRight size={20} /></button><button aria-label="Reiniciar recorrido" title="Reiniciar" onClick={restart}><ArrowsClockwise size={19} /></button></div><label className="learning-speed">Velocidad<select value={speed} onChange={event => setSpeed(Number(event.target.value))} aria-label="Velocidad de reproducción"><option value={.5}>0,5×</option><option value={1}>1×</option><option value={1.5}>1,5×</option></select></label></div>
          <p className="learning-timing-note">{lesson.scene === 'rcp' ? `Animación ilustrativa · ${speed === 1 ? '110 compresiones/min a 1×' : `Velocidad de estudio ${speed === .5 ? '0,5' : '1,5'}×; ritmo clínico de referencia 100-120/min`}` : 'Tiempo de estudio abreviado. Consulta los intervalos reales en los pasos.'}</p>
        </div>}
      </section>
      <aside className="learning-step-panel">
        {step ? <><div className="learning-step-heading"><span className="learning-eyebrow">{lesson.scene ? 'RECORRIDO GUIADO' : 'GUÍA DE LECTURA'}</span><span>{String(stepIndex + 1).padStart(2, '0')} / {String(lesson.steps.length).padStart(2, '0')}</span></div><div className="learning-step-segments" aria-hidden="true">{lesson.steps.map((item, i) => <span key={item.title} className={i <= stepIndex ? 'is-active' : ''} />)}</div><div className="learning-current-step" aria-live="polite" aria-atomic="true"><span className="learning-step-number">{String(stepIndex + 1).padStart(2, '0')}</span><h2>{step.title}</h2><p>{step.text}</p></div><div className="learning-step-navigation"><button disabled={stepIndex <= 0} onClick={() => goToStep(stepIndex - 1)}><ArrowLeft size={17} />Anterior</button><button disabled={stepIndex >= lesson.steps.length - 1} onClick={() => goToStep(stepIndex + 1)}>Siguiente<ArrowRight size={17} /></button></div><button className="learning-all-steps-toggle" aria-expanded={showAll} onClick={() => setShowAll(value => !value)}><BookOpen size={17} />{showAll ? 'Ocultar índice de pasos' : 'Ver todos los pasos'}<span>{lesson.steps.length}</span></button>{showAll && <ol className="learning-step-index">{lesson.steps.map((item, index) => <li key={item.title}><button className={index === stepIndex ? 'is-active' : ''} onClick={() => goToStep(index)} aria-current={index === stepIndex ? 'step' : undefined}><span>{index < stepIndex ? <Check size={14} /> : index + 1}</span>{item.title}</button></li>)}</ol>}{progress >= 1 && <p className="learning-complete"><Check size={17} />Recorrido finalizado. Puedes revisar cualquier paso.</p>}</> : <div className="learning-current-step"><span className="learning-eyebrow">FICHA INTRODUCTORIA</span><h2>Conoce el material</h2><p>Esta ficha está disponible para explorar el equipo. El contenido práctico se encuentra en preparación.</p><SiteLink className="learning-inline-link" href="/procedimientos/presion-arterial">Abrir un procedimiento 3D<ArrowUpRight size={18} /></SiteLink></div>}
      </aside>
    </div>
    <div className="learning-detail-grid">
      <section className="learning-equipment"><div className="learning-section-heading"><div><p className="learning-eyebrow">FAMILIARÍZATE CON EL EQUIPO</p><h2>Materiales del módulo</h2></div><span>{String(lesson.equipment.length).padStart(2, '0')}</span></div><div className="learning-equipment-list">{lesson.equipment.map((item, index) => <button key={item.id} className={equipmentId === item.id ? 'is-active' : ''} onClick={() => setEquipmentId(equipmentId === item.id ? null : item.id)} aria-expanded={equipmentId === item.id}><span>{String(index + 1).padStart(2, '0')}</span>{item.name}<ArrowUpRight size={18} /></button>)}</div>{equipment && <div className="learning-equipment-description"><button className="learning-equipment-close" onClick={() => setEquipmentId(null)} aria-label="Cerrar ficha de material"><X size={17} /></button><p className="learning-eyebrow">FICHA DEL MATERIAL</p><h3>{equipment.name}</h3><p>{equipment.purpose}</p></div>}</section>
      <aside className="learning-clinical-note"><Info size={24} /><div><p className="learning-eyebrow">TENLO PRESENTE</p><h3>Contexto y límites</h3><p>{lesson.note}</p></div></aside>
    </div>
  </>;
}
export default function LessonPage({ kind, slug }: {kind: LessonKind; slug: string}) {
  const lesson = lessons.find(item => item.kind === kind && item.slug === slug);
  const base = kind === 'procedure' ? '/procedimientos' : '/primeros-auxilios';
  const category = kind === 'procedure' ? 'Procedimientos' : 'Primeros auxilios';
  if (!lesson) return <main className="learning learning-lesson"><SiteLink className="learning-back" href={base}><ArrowLeft size={17} />{category}</SiteLink><div className="learning-no-results"><h1>Módulo no encontrado</h1><p>Explora los módulos disponibles en el catálogo.</p><SiteLink className="learning-inline-link" href={base}>Volver al catálogo <ArrowRight size={18} /></SiteLink></div></main>;
  const related = lessons.filter(item => item.kind === kind && item.slug !== slug).slice(0, 3);
  return <main className="learning learning-lesson">
    <SiteLink className="learning-back" href={base}><ArrowLeft size={17} />{category}</SiteLink>
    <header className="learning-lesson-header"><div><p className="learning-eyebrow">{lesson.tag} / ADULTOS</p><h1>{lesson.title}</h1><p>{lesson.description}</p></div><div className="learning-lesson-metadata"><span><Clock size={16} />{lesson.minutes}{!lesson.preparation && ' de lectura'}</span><span><Cube size={16} />{lesson.scene ? 'Escena 3D disponible' : 'Escena 3D en preparación'}</span><span><BookOpen size={16} />{lesson.steps.length ? `${lesson.steps.length} pasos` : 'Ficha de materiales'}</span></div></header>
    <LessonExperience key={lesson.slug} lesson={lesson} />
    <section className="learning-references"><div><p className="learning-eyebrow">APRENDE CON CONTEXTO</p><h2>Fuentes y alcance educativo</h2><p>Consulta documental: {reviewDate}. Material educativo para adultos; no es una certificación. Los modelos simplifican la forma y el movimiento. Ante una emergencia real, llama al número local de emergencias y sigue al operador.</p></div><div className="learning-source-list">{lesson.sources.length ? lesson.sources.map(source => <SiteLink key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><span>{source.title}<small>{source.date || 'Sin fecha editorial visible · consultada el 14 septiembre 2026'}</small></span><ArrowUpRight size={20} /></SiteLink>) : <p>Las fuentes del procedimiento se incorporarán junto con la guía práctica.</p>}</div></section>
    <section className="learning-related"><div className="learning-section-heading"><div><p className="learning-eyebrow">SIGUE EXPLORANDO</p><h2>Otros módulos</h2></div><SiteLink className="learning-inline-link" href={base}>Ver catálogo<ArrowRight size={18} /></SiteLink></div><div className="learning-related-grid">{related.map(item => <SiteLink href={lessonHref(item)} key={item.slug}><LearningIcon name={item.icon} size={28} /><div><small>{item.tag}</small><h3>{item.title}</h3></div><ArrowUpRight size={21} /></SiteLink>)}</div></section>
  </main>;
}
