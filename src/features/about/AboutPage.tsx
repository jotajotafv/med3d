import SiteLink from "../../components/SiteLink";
import { ArrowUpRight, ArrowRight, Cube, BookOpen, ShieldCheck, Info, GitBranch, GraduationCap } from '@phosphor-icons/react';
import './about.css';

const sources = [
  {
    title: 'Human Reference Atlas · HuBMAP',
    detail: 'Biblioteca de objetos anatómicos de referencia. Modelos GLB de corazón, pulmones y encéfalo.',
    label: 'Modelos · CC BY 4.0',
    href: 'https://github.com/hubmapconsortium/ccf-3d-reference-object-library',
  },
  {
    title: 'American Heart Association',
    detail: 'Guías 2025 de soporte vital básico en adultos y material sobre medición de la presión arterial.',
    label: 'Referencia educativa',
    href: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support',
  },
  {
    title: 'Medición de la presión en casa · AHA',
    detail: 'Preparación, postura y uso de un tensiómetro automático de brazo.',
    label: 'Referencia educativa',
    href: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home',
  },
  {
    title: 'NHS · Primeros auxilios',
    detail: 'Orientación pública sobre lesiones y situaciones frecuentes de primeros auxilios.',
    label: 'Referencia educativa',
    href: 'https://www.nhs.uk/conditions/first-aid/',
  },
  {
    title: 'American Red Cross · Primeros auxilios',
    detail: 'Recursos de aprendizaje y formación práctica para responder a emergencias.',
    label: 'Referencia educativa',
    href: 'https://www.redcross.org/take-a-class/first-aid',
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-page-inner">
        <div className="about-breadcrumb"><SiteLink href="/">Inicio</SiteLink><span>/</span><span>Acerca del proyecto</span></div>
        <header className="about-hero">
          <div>
            <p className="about-eyebrow">EL PROYECTO</p>
            <h1>Aprender empieza<br />por <span>comprender.</span></h1>
            <p className="about-intro">MED3D acerca la anatomía y los fundamentos del cuidado a una experiencia visual, interactiva y fácil de explorar.</p>
          </div>
          <div className="about-version">
            <span className="about-version-mark"><Cube size={36} weight="light" /></span>
            <p>MED3D</p><strong>Primera versión</strong>
            <span>Atlas y aprendizaje interactivo</span>
            <div className="about-version-state"><span /> En desarrollo</div>
          </div>
        </header>

        <div className="about-notice"><Info size={22} /><p><strong>Un recurso educativo.</strong> Los contenidos y las visualizaciones no cuentan con validación clínica y no sustituyen una formación práctica, un diagnóstico ni la atención profesional. Ante una emergencia, contacta con los servicios locales.</p></div>

        <section className="about-section" aria-labelledby="about-purpose">
          <div className="about-section-heading"><p className="about-eyebrow">TRES FORMAS DE APRENDER</p><h2 id="about-purpose">Del cuerpo a la acción.</h2></div>
          <div className="about-purpose-grid">
            <SiteLink href="/anatomia" className="about-purpose-card"><span className="about-card-index">01 / EXPLORAR</span><Cube size={30} weight="light" /><h3>Anatomía en 3D</h3><p>Observa los órganos desde distintos ángulos, selecciona estructuras y consulta sus fichas.</p><span className="about-text-link">Abrir el atlas <ArrowRight size={18} /></span></SiteLink>
            <SiteLink href="/procedimientos" className="about-purpose-card"><span className="about-card-index">02 / OBSERVAR</span><BookOpen size={30} weight="light" /><h3>Procedimientos</h3><p>Recorre secuencias educativas y relaciona cada paso con su contexto y sus precauciones.</p><span className="about-text-link">Ver procedimientos <ArrowRight size={18} /></span></SiteLink>
            <SiteLink href="/primeros-auxilios" className="about-purpose-card"><span className="about-card-index">03 / RESPONDER</span><ShieldCheck size={30} weight="light" /><h3>Primeros auxilios</h3><p>Repasa pautas iniciales para adultos con guías organizadas por situación.</p><span className="about-text-link">Consultar las guías <ArrowRight size={18} /></span></SiteLink>
          </div>
        </section>

        <section className="about-section about-scope" id="modelos" aria-labelledby="about-scope">
          <div className="about-scope-intro"><p className="about-eyebrow">ALCANCE ACTUAL</p><h2 id="about-scope">Qué puedes explorar<br />en esta versión.</h2><p>La disponibilidad se indica en cada experiencia. Las escenas esquemáticas explican una secuencia; no reproducen toda la complejidad anatómica o asistencial.</p><SiteLink className="about-text-link" href="/arquitectura">Consultar la hoja de ruta <ArrowRight size={18} /></SiteLink></div>
          <div className="about-scope-table">
            <div><span>Atlas anatómico</span><p>Corazón, pulmones y encéfalo. Modelos parciales de tres sistemas; no constituyen un cuerpo humano completo.</p><span className="about-status">Interactivo</span></div>
            <div><span>Capa de piel</span><p>Envolvente orientativa para la ubicación espacial. No es un modelo de referencia anatómica.</p><span className="about-status about-status-muted">Esquemática</span></div>
            <div><span>Presión arterial</span><p>Escena educativa con secuencia de preparación y medición.</p><span className="about-status">Escena educativa</span></div>
            <div><span>RCP en adultos</span><p>Secuencia sobre un maniquí esquemático. Requiere complementarse con formación práctica.</p><span className="about-status">Escena educativa</span></div>
            <div><span>Más procedimientos</span><p>Guías de signos vitales, vendaje e inmovilización. Sus visualizaciones están en desarrollo.</p><span className="about-status about-status-muted">Guías</span></div>
            <div><span>Más primeros auxilios</span><p>Siete guías adicionales, de atragantamiento a preparación del botiquín. Sus visualizaciones están en desarrollo.</p><span className="about-status about-status-muted">Guías</span></div>
          </div>
        </section>

        <section className="about-section" id="fuentes" aria-labelledby="about-sources">
          <div className="about-section-heading about-heading-row"><div><p className="about-eyebrow">FUENTES Y ATRIBUCIÓN</p><h2 id="about-sources">El contexto también importa.</h2></div><p className="about-review-date">Revisión documental<br /><strong>14 de septiembre de 2026</strong></p></div>
          <div className="about-source-list">{sources.map((source, index) => <SiteLink className="about-source" href={source.href} target="_blank" rel="noreferrer" key={source.title}><span className="about-source-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{source.title}</h3><p>{source.detail}</p></div><span className="about-source-label">{source.label}</span><ArrowUpRight size={20} /></SiteLink>)}</div>
          <div className="about-source-footnotes"><p>Los modelos de Human Reference Atlas / HuBMAP se distribuyen bajo <SiteLink href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons Atribución 4.0</SiteLink>. La aplicación adapta su presentación, posición, escala y materiales para la experiencia interactiva.</p><p>Las fuentes se citan como referencias. Su inclusión no implica que sus autores u organizaciones hayan revisado, certificado o avalado MED3D. La revisión documental no equivale a una validación clínica.</p></div>
        </section>

        <section className="about-bottom-card"><GraduationCap size={36} weight="light" /><div><p className="about-eyebrow">APRENDIZAJE CON CONTEXTO</p><h2>Una base para seguir aprendiendo.</h2><p>Explora con curiosidad. Contrasta con bibliografía y practica las habilidades asistenciales con personal cualificado.</p></div><SiteLink href="/arquitectura" className="about-outline-button">Cómo está construido <GitBranch size={18} /></SiteLink></section>
      </div>
    </main>
  );
}
