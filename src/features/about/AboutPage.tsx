import SiteLink from '../../components/SiteLink';
import {ArrowRight, ArrowUpRight} from '@phosphor-icons/react';
import AtlasOverview from './AtlasOverview';
import './about.css';

const tools = [
  ['Selección', 'Identifica una estructura y consulta su ficha educativa.'],
  ['Aislamiento', 'Estudia una pieza o un grupo con menos elementos a la vista.'],
  ['Visibilidad y transparencia', 'Oculta estructuras o ajusta la opacidad de un sistema.'],
  ['Capas', 'Activa los sistemas que quieras explorar.'],
  ['Búsqueda', 'Encuentra estructuras por nombre, sinónimo o latín.'],
  ['Árbol anatómico', 'Recorre sistemas, regiones, grupos y componentes.'],
  ['Despiece', 'Separa sistemas, regiones o estructuras y vuelve al conjunto.'],
  ['Vistas anatómicas', 'Cambia la orientación y enfoca la estructura seleccionada.'],
];

const sources = [
  {name: 'BodyParts3D', version: 'DBCLS · Cuerpo de referencia', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', href: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',
    scope: 'Base del cuerpo de referencia y de la mayor parte de las estructuras integradas.',
    credit: 'BodyParts3D, © The Database Center for Life Science.'},
  {name: 'BodyParts3D', version: 'DBCLS · Modelos complementarios', license: 'CC BY-SA 2.1 Japan', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.1/jp/', href: 'https://lifesciencedb.jp/bp3d/info_en/license/index.html',
    scope: 'Modelos de parénquima pulmonar, tiroides y paratiroides.',
    credit: 'BodyParts3D, © Database Center for Life Science.'},
  {name: 'Z-Anatomy', version: 'Selección periférica', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', href: 'https://github.com/Z-Anatomy/Models-of-human-anatomy/tree/38649f4193adbe58e426ccac5670b8c4dde474ec',
    scope: 'Modelos de nervios periféricos.',
    credit: 'Gauthier Kervyn y colaboradores. Basado en BodyParts3D, Kousaku Okubo / DBCLS, con crédito original CC BY-SA 2.1 Japan.'},
  {name: 'HRA / HuBMAP', version: 'Human Reference Atlas', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', href: 'https://github.com/hubmapconsortium/ccf-3d-reference-object-library',
    scope: 'Modelos detallados de corazón, pulmones y encéfalo.',
    credit: 'Human Reference Atlas / HuBMAP y colaboradores; referencias Visible Human y Allen, según el modelo.'},
];

export default function AboutPage() {
  return <main className="about-page">
    <div className="about-page-inner">
      <header className="about-hero">
        <div className="about-hero-copy">
          <p className="about-eyebrow">ACERCA DEL PROYECTO</p>
          <h1><span className="about-name">MED<span>3D</span></span>Atlas anatómico<br/>interactivo.</h1>
          <p className="about-intro">Una plataforma para explorar el cuerpo humano en tres dimensiones.</p>
          <SiteLink href="/anatomia/" className="about-atlas-link">Abrir atlas <ArrowRight size={19}/></SiteLink>
        </div>
        <nav className="about-index" aria-label="En esta página">
          <p className="about-eyebrow">EL PROYECTO, EN CONTEXTO</p>
          <a href="#atlas"><span>01</span>El atlas<ArrowRight size={15}/></a>
          <a href="#exploracion"><span>02</span>Cómo se explora<ArrowRight size={15}/></a>
          <a href="#fuentes"><span>03</span>Fuentes y licencias<ArrowRight size={15}/></a>
          <a href="#metodologia"><span>04</span>De la fuente al atlas<ArrowRight size={15}/></a>
          <a href="#limitaciones"><span>05</span>Limitaciones y futuro<ArrowRight size={15}/></a>
        </nav>
        <p className="about-hero-caption">CONOCIMIENTO <span>EN TRES DIMENSIONES</span></p>
      </header>

      <section className="about-purpose about-section" aria-labelledby="about-purpose-title">
        <div><p className="about-eyebrow">QUÉ ES MED3D</p><h2 id="about-purpose-title">El cuerpo,<br/>en contexto.</h2></div>
        <div className="about-purpose-copy"><p>MED3D es una plataforma educativa de anatomía 3D. Reúne múltiples sistemas corporales en un atlas interactivo para observar estructuras y estudiar sus relaciones espaciales.</p><p>Seleccionar, aislar, ocultar y usar transparencia permite pasar del conjunto al detalle. El árbol, la búsqueda y las fichas acompañan la exploración con nombres, contexto y fuentes.</p></div>
      </section>

      <section className="about-section" id="atlas" aria-labelledby="about-atlas-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">01 / EL ATLAS</p><h2 id="about-atlas-title">Una mirada<br/>por sistemas.</h2></div><p>Explora las estructuras disponibles, organizadas por sistemas corporales.</p></div>
        <AtlasOverview/>
      </section>

      <section className="about-section" id="exploracion" aria-labelledby="about-explore-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">02 / CÓMO SE EXPLORA</p><h2 id="about-explore-title">Del conjunto<br/>a cada estructura.</h2></div><p>Herramientas para orientar la mirada, comparar capas y volver siempre al contexto.</p></div>
        <dl className="about-tools">{tools.map(([name, description], index) => <div key={name}><dt><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{name}</dt><dd>{description}</dd></div>)}</dl>
      </section>

      <section className="about-section" id="fuentes" aria-labelledby="about-sources-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">03 / FUENTES Y LICENCIAS</p><h2 id="about-sources-title">Anatomía con<br/>procedencia.</h2></div><p>Modelos anatómicos abiertos con fuentes y licencias identificadas.</p></div>
        <div className="about-source-list">{sources.map((source, index) => <article className="about-source" key={source.name + source.version}>
          <span className="about-source-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div className="about-source-title"><h3>{source.name}</h3><p>{source.version}</p><SiteLink href={source.href} target="_blank" rel="noreferrer">Fuente original<ArrowUpRight size={14}/></SiteLink></div>
          <div className="about-source-description"><p>{source.scope}</p><small>{source.credit}</small></div>
          <SiteLink className="about-license" href={source.licenseUrl} target="_blank" rel="noreferrer" aria-label={'Licencia ' + source.license + ' de ' + source.name + ' ' + source.version}>{source.license}<ArrowUpRight size={14}/></SiteLink>
        </article>)}</div>
        <div className="about-source-notes"><p>Los modelos fueron adaptados y optimizados para su visualización interactiva en MED3D.</p><p>Cada ficha enlaza su fuente y licencia. Citar una fuente no implica que sus autores avalen el proyecto.</p></div>
      </section>

      <section className="about-section" id="metodologia" aria-labelledby="about-method-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">04 / METODOLOGÍA</p><h2 id="about-method-title">De la fuente<br/>al atlas.</h2></div><p>Fuentes documentadas y contenido educativo para acompañar la exploración.</p></div>
        <ol className="about-method">
          <li><span>01</span><h3>Seleccionar fuentes</h3><p>Revisar la procedencia, la cobertura y la licencia de los modelos.</p></li>
          <li><span>02</span><h3>Organizar la anatomía</h3><p>Reunir las estructuras por sistemas y regiones para facilitar su estudio.</p></li>
          <li><span>03</span><h3>Acompañar la exploración</h3><p>Presentar nombres, funciones y relaciones con referencias educativas.</p></li>
          <li><span>04</span><h3>Explicar el alcance</h3><p>Mantener visibles las fuentes y los límites de la representación.</p></li>
        </ol>
        <div className="about-technology" id="tecnologia"><div><p className="about-eyebrow">EXPLORACIÓN INTERACTIVA</p><h3>En el navegador.</h3></div><p>Gira el modelo, explora sus capas y consulta las fichas mientras estudias.</p></div>
      </section>

      <section className="about-section" id="limitaciones" aria-labelledby="about-limits-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">05 / ALCANCE DEL PROYECTO</p><h2 id="about-limits-title">Limitaciones y<br/>desarrollo futuro.</h2></div><p>MED3D continúa en evolución. La cobertura actual depende de la disponibilidad y calidad de modelos anatómicos abiertos y trazables. Algunas estructuras permanecen pendientes y podrán incorporarse en futuras versiones.</p></div>
        <div className="about-source-notes"><p>Cobertura educativa parcial. Algunas estructuras pueden no estar representadas o presentar simplificaciones propias de las fuentes anatómicas utilizadas.</p><p>MED3D no constituye una herramienta de diagnóstico ni una validación clínica.</p></div>
      </section>

      <section className="about-closing" aria-labelledby="about-closing-title"><p className="about-eyebrow">EL CUERPO, PIEZA A PIEZA</p><h2 id="about-closing-title">Explora el<br/>cuerpo humano.</h2><SiteLink href="/anatomia/" className="about-atlas-link">Abrir atlas<ArrowRight size={19}/></SiteLink></section>
    </div>
  </main>;
}
