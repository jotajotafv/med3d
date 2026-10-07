import SiteLink from '../../components/SiteLink';
import {ArrowRight, ArrowUpRight} from '@phosphor-icons/react';
import AtlasOverview from './AtlasOverview';
import './about.css';

const tools = [
  ['Selección', 'Identifica una estructura y consulta su ficha educativa.'],
  ['Aislamiento', 'Estudia una pieza o un grupo con menos elementos a la vista.'],
  ['Visibilidad y transparencia', 'Oculta estructuras o ajusta la opacidad de un sistema.'],
  ['Capas', 'Activa sistemas y módulos según lo que quieras explorar.'],
  ['Búsqueda', 'Encuentra estructuras por nombre, sinónimo, latín o identificador.'],
  ['Árbol anatómico', 'Recorre sistemas, regiones, grupos y componentes.'],
  ['Despiece', 'Separa sistemas, regiones o estructuras y vuelve al conjunto.'],
  ['Vistas anatómicas', 'Cambia la orientación y enfoca la estructura seleccionada.'],
];

const sources = [
  {name: 'BodyParts3D', version: '4.0 · DBCLS', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', href: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',
    scope: 'Base del cuerpo de referencia y de la mayor parte de las estructuras integradas.',
    credit: 'BodyParts3D, © The Database Center for Life Science. Licencia CC Attribution 4.0 International según la declaración del archivo oficial; se conservan las cabeceras históricas de los originales.'},
  {name: 'BodyParts3D', version: '4.3 · DBCLS', license: 'CC BY-SA 2.1 Japan', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.1/jp/', href: 'https://lifesciencedb.jp/bp3d/info_en/license/index.html',
    scope: 'Activos concretos de parénquima pulmonar, tiroides y paratiroides.',
    credit: 'BodyParts3D, © Database Center for Life Science. MED3D conserva CC BY-SA 2.1 Japan para estas adaptaciones de la versión 4.3.'},
  {name: 'Z-Anatomy', version: 'Selección periférica', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', href: 'https://github.com/Z-Anatomy/Models-of-human-anatomy/tree/38649f4193adbe58e426ccac5670b8c4dde474ec',
    scope: 'Subconjunto de nervios y componentes periféricos con registro regional documentado.',
    credit: 'Gauthier Kervyn y colaboradores; origen BodyParts3D, Kousaku Okubo / DBCLS. Se conserva el crédito original CC BY-SA 2.1 Japan. Los activos con excepciones no comerciales quedan excluidos de esta selección.'},
  {name: 'HRA / HuBMAP', version: 'CCF 3D Reference Object Library', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', href: 'https://github.com/hubmapconsortium/ccf-3d-reference-object-library',
    scope: 'Modelos de corazón, pulmones y encéfalo en exploradores independientes del cuerpo integrado.',
    credit: 'Human Reference Atlas / HuBMAP y colaboradores. Datos de referencia Visible Human y Allen, según cada modelo; procedencia y atribución conservadas en el manifiesto.'},
];

const limits = [
  ['Cobertura parcial', 'No es un cuerpo completo: faltan estructuras y algunas se representan sólo mediante componentes. Cada ficha indica el alcance disponible.'],
  ['Sin validación clínica', 'Es un recurso educativo. No permite establecer diagnósticos, planificar intervenciones ni sustituir formación o atención profesional.'],
  ['Fuentes y cuerpos distintos', 'El cuerpo integrado usa un marco masculino de referencia. El registro de otras fuentes tiene límites; los órganos HRA se exploran por separado.'],
  ['Límites de representación', 'Pueden aparecer interpenetraciones, discontinuidades y artefactos de transparencia. Se conservan y documentan las limitaciones de las fuentes.'],
  ['Variación y detalle', 'No representa todos los cuerpos, edades o variaciones anatómicas. La superficie cutánea y los ojos no reproducen histología ni óptica real.'],
  ['Rendimiento variable', 'La fluidez depende del dispositivo, la GPU y las capas visibles. La carga también depende de la conexión.'],
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
          <a href="#metodologia"><span>04</span>Metodología y tecnología<ArrowRight size={15}/></a>
          <a href="#limitaciones"><span>05</span>Alcance y límites<ArrowRight size={15}/></a>
        </nav>
        <p className="about-hero-caption">CONOCIMIENTO <span>EN TRES DIMENSIONES</span></p>
      </header>

      <section className="about-purpose about-section" aria-labelledby="about-purpose-title">
        <div><p className="about-eyebrow">QUÉ ES MED3D</p><h2 id="about-purpose-title">El cuerpo,<br/>en contexto.</h2></div>
        <div className="about-purpose-copy"><p>MED3D es una plataforma educativa de anatomía 3D. Reúne múltiples sistemas corporales en un atlas interactivo para observar estructuras y estudiar sus relaciones espaciales.</p><p>Seleccionar, aislar, ocultar y usar transparencia permite pasar del conjunto al detalle. El árbol, la búsqueda y las fichas acompañan la exploración con nombres, contexto y fuentes.</p></div>
      </section>

      <section className="about-section" id="atlas" aria-labelledby="about-atlas-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">01 / EL ATLAS</p><h2 id="about-atlas-title">Una mirada<br/>por sistemas.</h2></div><p>La cobertura disponible, consultada directamente en los catálogos que utiliza el atlas.</p></div>
        <AtlasOverview/>
      </section>

      <section className="about-section" id="exploracion" aria-labelledby="about-explore-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">02 / CÓMO SE EXPLORA</p><h2 id="about-explore-title">Del conjunto<br/>a cada estructura.</h2></div><p>Herramientas para orientar la mirada, comparar capas y volver siempre al contexto.</p></div>
        <dl className="about-tools">{tools.map(([name, description], index) => <div key={name}><dt><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{name}</dt><dd>{description}</dd></div>)}</dl>
      </section>

      <section className="about-section" id="fuentes" aria-labelledby="about-sources-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">03 / FUENTES Y LICENCIAS</p><h2 id="about-sources-title">Anatomía con<br/>procedencia.</h2></div><p>Geometría de fuentes documentadas. Cada integración conserva su identidad, atribución y condiciones de uso.</p></div>
        <div className="about-source-list">{sources.map((source, index) => <article className="about-source" key={source.name + source.version}>
          <span className="about-source-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div className="about-source-title"><h3>{source.name}</h3><p>{source.version}</p><SiteLink href={source.href} target="_blank" rel="noreferrer">Fuente original<ArrowUpRight size={14}/></SiteLink></div>
          <div className="about-source-description"><p>{source.scope}</p><small>{source.credit}</small></div>
          <SiteLink className="about-license" href={source.licenseUrl} target="_blank" rel="noreferrer" aria-label={'Licencia ' + source.license + ' de ' + source.name + ' ' + source.version}>{source.license}<ArrowUpRight size={14}/></SiteLink>
        </article>)}</div>
        <div className="about-source-notes"><p>Las adaptaciones incluyen selección de piezas, conversión a GLB, compresión Meshopt, registro documentado cuando corresponde y presentación en español. Las licencias se aplican a los activos indicados, no se extienden automáticamente a todo el código de MED3D.</p><p>Los manifiestos conservan fuentes, versiones, identificadores y hashes. Las fichas del atlas enlazan su procedencia. Citar una fuente no implica que sus autores hayan certificado o avalado este proyecto.</p></div>
      </section>

      <section className="about-section" id="metodologia" aria-labelledby="about-method-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">04 / METODOLOGÍA</p><h2 id="about-method-title">De la fuente<br/>al atlas.</h2></div><p>Un proceso documentado para integrar geometría existente y hacer explícitos sus límites.</p></div>
        <ol className="about-method">
          <li><span>01</span><h3>Auditar y seleccionar</h3><p>Revisar identidad, cobertura, procedencia y licencia de cada conjunto.</p></li>
          <li><span>02</span><h3>Registrar y convertir</h3><p>Comprobar el marco espacial y documentar la conversión a módulos GLB.</p></li>
          <li><span>03</span><h3>Comprimir y verificar</h3><p>Aplicar Meshopt y comparar geometría, identidades y transformaciones con la fuente.</p></li>
          <li><span>04</span><h3>Integrar y documentar</h3><p>Conectar módulos, árbol y fichas. Registrar pruebas y límites de la representación.</p></li>
        </ol>
        <div className="about-technology" id="tecnologia"><div><p className="about-eyebrow">TECNOLOGÍA</p><h3>En el navegador.</h3></div><ul aria-label="Tecnologías del proyecto"><li>React</li><li>TypeScript</li><li>Three.js</li><li>React Three Fiber</li><li>Vite</li></ul></div>
      </section>

      <section className="about-section" id="limitaciones" aria-labelledby="about-limits-title">
        <div className="about-section-heading"><div><p className="about-eyebrow">05 / ALCANCE Y LÍMITES</p><h2 id="about-limits-title">Conocer también<br/>los límites.</h2></div><p>La comprobación geométrica y técnica no equivale a una validación clínica.</p></div>
        <dl className="about-limits">{limits.map(([name, detail]) => <div key={name}><dt>{name}</dt><dd>{detail}</dd></div>)}</dl>
      </section>

      <section className="about-closing" aria-labelledby="about-closing-title"><p className="about-eyebrow">EL CUERPO, PIEZA A PIEZA</p><h2 id="about-closing-title">Explora el<br/>cuerpo humano.</h2><SiteLink href="/anatomia/" className="about-atlas-link">Abrir atlas<ArrowRight size={19}/></SiteLink></section>
    </div>
  </main>;
}
