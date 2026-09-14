import SiteLink from "../../components/SiteLink";
import { useMemo, useState } from 'react';
import { ArrowUpRight, Clock, Cube, Heartbeat, Drop, Fire, Bone, Brain, FirstAidKit, Wind, Person, Gauge, Bandaids, MagnifyingGlass, ArrowRight, BookOpen } from '@phosphor-icons/react';
import { lessons, lessonHref, type LessonKind } from './content';
import './learning.css';

export function LearningIcon({ name, size = 32 }: { name: string; size?: number }) {
  const icons: Record<string, typeof Heartbeat> = { heart: Heartbeat, pressure: Gauge, pulse: Heartbeat, bandage: Bandaids, bone: Bone, air: Wind, drop: Drop, fire: Fire, person: Person, brain: Brain, kit: FirstAidKit };
  const Icon = icons[name] || BookOpen;
  return <Icon size={size} weight="light" aria-hidden="true" />;
}
export default function LearningCatalog({ kind }: { kind: LessonKind }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const all = lessons.filter(lesson => lesson.kind === kind);
  const tags = ['Todos', ...new Set(all.map(lesson => lesson.tag))];
  const shown = useMemo(() => all.filter(lesson => (filter === 'Todos' || lesson.tag === filter) && `${lesson.title} ${lesson.description}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))), [all, filter, query]);
  const isProcedure = kind === 'procedure';
  return <main className="learning learning-catalog">
    <div className="learning-catalog-intro">
      <p className="learning-eyebrow">MED3D / {isProcedure ? 'PRÁCTICA GUIADA' : 'APRENDER A ACTUAR'}</p>
      <h1>{isProcedure ? <>Comprende cada<br /><em>procedimiento.</em></> : <>Prepararte también<br />es <em>cuidar.</em></>}</h1>
      <div className="learning-intro-bottom"><p>{isProcedure ? 'Del equipo al gesto. Explora procedimientos básicos, observa cada paso y aprende a tu ritmo.' : 'Primeros auxilios para adultos, paso a paso. Aprende a reconocer una urgencia y a pedir la ayuda adecuada.'}</p><span className="learning-catalog-count"><strong>{String(all.length).padStart(2, '0')}</strong> módulos de aprendizaje</span></div>
    </div>
    <div className="learning-catalog-toolbar"><div><p className="learning-eyebrow">EXPLORA LOS MÓDULOS</p><h2>{isProcedure ? 'La práctica, paso a paso' : 'Una respuesta informada'}</h2></div><label className="learning-search"><MagnifyingGlass size={19} aria-hidden="true" /><input type="search" placeholder="Buscar un módulo" value={query} onChange={event => setQuery(event.target.value)} aria-label="Buscar un módulo" /></label></div>
    <div className="learning-filters" aria-label="Filtrar por categoría">{tags.map(tag => <button key={tag} className={filter === tag ? 'is-active' : ''} onClick={() => setFilter(tag)} aria-pressed={filter === tag}>{tag}</button>)}</div>
    <div className="learning-card-grid">{shown.map((lesson, index) => <SiteLink className={`learning-card ${lesson.scene ? 'learning-card-featured' : ''}`} href={lessonHref(lesson)} key={lesson.slug}>
      <div className="learning-card-visual">{lesson.scene ? <img src={lesson.scene === 'pressure' ? import.meta.env.BASE_URL+'assets/pressure.webp' : import.meta.env.BASE_URL+'assets/cpr.webp'} alt={lesson.scene === 'pressure' ? 'Ilustración de un tensiómetro de brazo para el módulo de presión arterial' : 'Ilustración de maniquí de entrenamiento para el módulo de RCP'} loading="lazy" /> : <><div className="learning-card-grid-pattern" /><LearningIcon name={lesson.icon} size={64} /></>}<span className="learning-card-number">{String(index + 1).padStart(2, '0')}</span><span className={`learning-status ${lesson.scene ? 'is-ready' : ''}`}>{lesson.scene ? <Cube size={13} /> : <BookOpen size={13} />}{lesson.scene ? 'Escena 3D disponible' : lesson.preparation ? 'En preparación' : 'Guía de lectura'}</span></div>
      <div className="learning-card-body"><p className="learning-eyebrow">{lesson.tag}</p><h3>{lesson.title}</h3><p>{lesson.description}</p><div className="learning-card-footer"><span><Clock size={15} />{lesson.minutes}{!lesson.preparation && ' · lectura estimada'}</span><span className="learning-card-arrow"><ArrowUpRight size={22} /></span></div></div>
    </SiteLink>)}</div>
    {shown.length === 0 && <div className="learning-no-results"><MagnifyingGlass size={36} /><h3>No encontramos ese módulo</h3><p>Prueba otro término o muestra todas las categorías.</p><button onClick={() => { setQuery(''); setFilter('Todos'); }}>Ver todos los módulos <ArrowRight size={18} /></button></div>}
    <aside className="learning-catalog-note"><FirstAidKit size={30} weight="light" /><div><h3>Aprender aquí. Practicar con formación.</h3><p>Contenido educativo para adultos. Los modelos simplifican la anatomía y los movimientos; no sustituyen formación práctica ni atención sanitaria. En una emergencia real, llama al número local de emergencias y sigue al operador.</p></div><SiteLink href={isProcedure ? '/primeros-auxilios' : '/procedimientos'}>{isProcedure ? 'Ver primeros auxilios' : 'Ver procedimientos'}<ArrowUpRight size={20} /></SiteLink></aside>
  </main>;
}
