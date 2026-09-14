import SiteLink from "../../components/SiteLink";
import {ArrowRight,ArrowUpRight,Cube,Stack,Heartbeat,FirstAid,BookOpen,Check} from "@phosphor-icons/react";
import {AnatomyHero} from "../anatomy/AnatomyHero";
import "./home.css";
const systems=[
{id:"heart",name:"Corazón",latin:"Cor",system:"Cardiovascular",description:"Cavidades, válvulas y conexiones. Examina el corazón pieza a pieza.",num:"01"},
{id:"lungs",name:"Pulmones",latin:"Pulmones",system:"Respiratorio",description:"Explora los lóbulos y las ramificaciones del árbol bronquial.",num:"02"},
{id:"brain",name:"Encéfalo",latin:"Encephalon",system:"Nervioso",description:"Descubre regiones, hemisferios y estructuras del encéfalo.",num:"03"}
];
const emergencies=[["atragantamiento","Atragantamiento","Reconocer una obstrucción"],["hemorragias","Hemorragias","Controlar el sangrado"],["quemaduras","Quemaduras","Enfriar y proteger"],["fracturas","Fracturas","Evitar más daño"],["desmayos","Desmayos","Vigilar la recuperación"],["convulsiones","Convulsiones","Proteger y acompañar"],["botiquin","Botiquín","Preparar lo esencial"]];
export default function HomePage(){
return <main className="home-page">
<section className="home-hero" aria-labelledby="hero-title">
<div className="hero-copy"><p className="home-eyebrow"><span className="tiny-rule"/>UNA NUEVA PERSPECTIVA DE LA MEDICINA</p>
<h1 id="hero-title">Explora el cuerpo.<br/><span>Comprende<br className="hero-break"/> la medicina.</span></h1>
<p className="hero-description">Anatomía interactiva, procedimientos y primeros auxilios. El conocimiento médico, en otra dimensión.</p>
<div className="hero-actions"><SiteLink href="/anatomia" className="hero-explore">Explorar anatomía <ArrowUpRight size={19}/></SiteLink><SiteLink href="#plataforma" className="hero-discover">Descubrir la plataforma <ArrowRight size={16}/></SiteLink></div></div>
<div className="hero-scene"><AnatomyHero/></div>
</section>
<section className="pathways" id="plataforma" aria-labelledby="pathways-title">
<div className="pathways-intro"><h2 id="pathways-title">Tres formas de comprender.</h2><p>Una experiencia distinta para cada forma de aprender.</p></div>
<div className="pathway-list">
<SiteLink href="/anatomia" className="pathway-row"><span className="pathway-number">01</span><Cube size={27} weight="light"/><div><h3>Explorar</h3><p>Anatomía 3D</p></div><span className="pathway-description">Acércate. Separa. Descubre las conexiones.</span><ArrowUpRight size={23}/></SiteLink>
<SiteLink href="/procedimientos" className="pathway-row"><span className="pathway-number">02</span><Heartbeat size={27} weight="light"/><div><h3>Observar</h3><p>Procedimientos médicos</p></div><span className="pathway-description">Comprende cada técnica, paso a paso.</span><ArrowUpRight size={23}/></SiteLink>
<SiteLink href="/primeros-auxilios" className="pathway-row"><span className="pathway-number">03</span><FirstAid size={27} weight="light"/><div><h3>Aprender a responder</h3><p>Primeros auxilios</p></div><span className="pathway-description">Reconoce la situación. Aprende cómo actuar.</span><ArrowUpRight size={23}/></SiteLink>
</div></section>
<section className="home-anatomy" aria-labelledby="anatomy-title">
<div className="home-section-heading"><h2 id="anatomy-title">Cada estructura cuenta una historia.</h2><p>Empieza por tres sistemas. Explora las piezas de cada modelo y su relación con el conjunto.</p></div>
<div className="anatomy-index">{systems.map(s=><SiteLink key={s.id} href={"/anatomia?organ="+s.id} className={"organ-entry organ-"+s.id}><div className="organ-index-top"><span>{s.system}</span><span className="organ-numeral">{s.num}</span></div><div className="organ-entry-body"><h3>{s.name}</h3><span className="organ-latin">{s.latin}</span><p>{s.description}</p></div><div className="organ-entry-link"><span>Explorar estructura</span><ArrowUpRight size={21}/></div></SiteLink>)}</div>
<div className="anatomy-caption"><Stack size={17}/><p>Modelos 3D de Human Reference Atlas. Cobertura inicial de órganos; el atlas se ampliará por sistemas.</p><SiteLink href="/acerca#modelos">Conocer el alcance <ArrowRight size={14}/></SiteLink></div>
</section>
<section className="home-procedures" aria-labelledby="procedures-title">
<div className="procedure-visual"><img src={import.meta.env.BASE_URL+"assets/pressure.webp"} alt="Composición ilustrativa de un tensiómetro de brazo con su manguito" loading="lazy" width="1024" height="688"/><span className="image-credit">Equipo de aprendizaje · Ilustración</span></div>
<div className="procedure-copy"><p className="home-eyebrow">DEL CONCEPTO A LA PRÁCTICA</p><h2 id="procedures-title">Observa el cómo.<br/><span>Comprende el porqué.</span></h2><p>Una técnica, diferentes perspectivas. Explora el escenario y avanza a tu ritmo.</p>
<SiteLink className="featured-procedure" href="/procedimientos/presion-arterial"><div><span className="procedure-mode">ESCENA INTERACTIVA</span><h3>Medición de presión arterial</h3><p>Preparación, postura y colocación del manguito.</p></div><ArrowUpRight size={24}/></SiteLink>
<SiteLink href="/procedimientos" className="procedure-catalog-link">Ver procedimientos <ArrowRight size={17}/></SiteLink>
</div></section>
<section className="home-firstaid" aria-labelledby="firstaid-title">
<div className="home-section-heading"><h2 id="firstaid-title">Aprender a responder empieza aquí.</h2><p>Guías educativas para reconocer una emergencia y dar los primeros pasos.</p></div>
<div className="firstaid-layout"><SiteLink className="firstaid-feature" href="/primeros-auxilios/rcp"><img src={import.meta.env.BASE_URL+"assets/cpr.webp"} alt="Ilustración de un maniquí para formación en RCP junto a un equipo de entrenamiento" loading="lazy" width="1024" height="688"/><div><span>SIMULACIÓN PARA ADULTOS</span><h3>Reanimación cardiopulmonar</h3><p>Reconocimiento, ayuda y compresiones.</p><span className="firstaid-feature-link">Explorar RCP <ArrowUpRight size={20}/></span></div></SiteLink>
<div className="emergency-list">{emergencies.map(([id,name,desc])=><SiteLink key={id} href={"/primeros-auxilios/"+id}><div><h3>{name}</h3><p>{desc}</p></div><ArrowUpRight size={19}/></SiteLink>)}</div></div>
<p className="firstaid-scope">Ante una emergencia real, llama al número local de emergencias y sigue las indicaciones del operador.</p>
</section>
<section className="home-knowledge" aria-labelledby="knowledge-title">
<div className="knowledge-title"><BookOpen size={27} weight="light"/><h2 id="knowledge-title">Conoce tu cuerpo.</h2><SiteLink href="/acerca#fuentes">Explorar las fuentes <ArrowUpRight size={16}/></SiteLink></div>
<div className="knowledge-grid"><article><span className="knowledge-topic">CORAZÓN</span><h3>Un recorrido en una sola dirección.</h3><p>Las válvulas ayudan a que la sangre avance en un único sentido a través del corazón.</p><SiteLink href="https://www.nhlbi.nih.gov/health/heart/anatomy" target="_blank" rel="noreferrer">Fuente: NHLBI <ArrowUpRight size={13}/></SiteLink></article>
<article><span className="knowledge-topic">RESPIRACIÓN</span><h3>El intercambio que nos mantiene vivos.</h3><p>En los alvéolos, el oxígeno pasa a la sangre y el dióxido de carbono sale de ella.</p><SiteLink href="https://www.nhlbi.nih.gov/health/lungs/respiratory-system" target="_blank" rel="noreferrer">Fuente: NHLBI <ArrowUpRight size={13}/></SiteLink></article></div>
</section>
<div className="home-method"><Check size={18}/><p>Fuentes identificadas. Modelos con procedencia. Aprendizaje con contexto.</p><SiteLink href="/acerca">Nuestra metodología <ArrowRight size={16}/></SiteLink></div>
</main>;
}