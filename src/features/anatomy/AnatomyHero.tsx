import SiteLink from "../../components/SiteLink";
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowUpRight, ArrowsOut, ArrowCounterClockwise } from '@phosphor-icons/react';
import { MODEL_DEFINITIONS, type ModelId, type OrganId } from './data';
import './anatomy.css';
const Scene=lazy(()=>import('./AnatomyScene'));
export function AnatomyHero({className=''}:{className?:string}){
 const [mounted,setMounted]=useState(false),[model,setModel]=useState<ModelId>('heart'),[selected,setSelected]=useState<string|null>(null);
 const [cameraRequest,setCameraRequest]=useState<{kind:'reset',version:number}>({kind:'reset',version:0});
 useEffect(()=>setMounted(true),[]);
 function change(v:ModelId){setModel(v);setSelected(null)}
 const active=model==='body'?null:MODEL_DEFINITIONS[model];
 return <div className={'anatomy-hero '+className}>
 <div className="anatomy-hero-grid"/><div className="anatomy-hero-orbit anatomy-hero-orbit-one"/><div className="anatomy-hero-orbit anatomy-hero-orbit-two"/>
 <div className="anatomy-hero-top"><span><i/> MODELO INTERACTIVO</span><button aria-label="Restablecer modelo" onClick={()=>setCameraRequest(v=>({kind:'reset',version:v.version+1}))}><ArrowCounterClockwise size={16}/></button></div>
 <div className="anatomy-hero-canvas">{mounted?<Suspense fallback={<div className="model-loading">Preparando modelo anatómico…</div>}><Scene modelId={model} framing={model==='body'?'torso':'full'} selected={selected} hidden={[]} isolated={null} opacity={1} exploded={0} explodeLevel="organ" onSelect={setSelected} cameraRequest={cameraRequest}/></Suspense>:<div className="model-loading">Preparando modelo anatómico…</div>}</div>
 <div className="anatomy-hero-tag anatomy-hero-tag-top"><span>01 / ANATOMÍA HUMANA</span><strong>{active?.latin||'Corpus humanum'}</strong></div>
 {model==='body'&&<><button className="anatomy-hero-label anatomy-label-brain" onClick={()=>change('brain')}><span>ENCÉFALO</span><i/></button><button className="anatomy-hero-label anatomy-label-lungs" onClick={()=>change('lungs')}><i/><span>PULMONES</span></button><button className="anatomy-hero-label anatomy-label-heart" onClick={()=>change('heart')}><span>CORAZÓN</span><i/></button></>}
 <div className="anatomy-hero-bottom"><div className="anatomy-hero-tabs" aria-label="Elegir modelo"><button className={model==='body'?'is-active':''} onClick={()=>change('body')}>Conjunto</button>{(['heart','lungs','brain'] as OrganId[]).map(id=><button key={id} className={model===id?'is-active':''} onClick={()=>change(id)}>{MODEL_DEFINITIONS[id].title}</button>)}</div><span className="anatomy-hero-instruction"><ArrowsOut size={13}/> Arrastra para explorar</span></div>
 <SiteLink className="anatomy-hero-open" href={'/anatomia?organ='+(model==='body'?'heart':model)}>Abrir explorador <ArrowUpRight size={16}/></SiteLink>
 <span className="anatomy-hero-credit">HRA / HuBMAP · CC BY 4.0</span>
 </div>
}

