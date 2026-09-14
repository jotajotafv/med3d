import SiteLink from "../../components/SiteLink";
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowCounterClockwise, ArrowsOut, CaretDown, CaretRight, Cube, Eye, EyeSlash, Heart, Brain, MagnifyingGlass, Minus, Plus, Scan, SlidersHorizontal, X, List, ArrowSquareOut, Stack } from '@phosphor-icons/react';
import { MODEL_DEFINITIONS, STRUCTURES, descendants, selectionFromScene, type OrganId, type Structure } from './data';
import { EDUCATION } from './education';
import './anatomy.css';
const Scene=lazy(()=>import('./AnatomyScene'));
const organIds:OrganId[]=['heart','lungs','brain'];
function Icon({organ,size=18}:{organ:OrganId,size?:number}){return organ==='heart'?<Heart size={size}/>:organ==='brain'?<Brain size={size}/>:<Stack size={size}/>}
function match(s:string,q:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())}
export default function AnatomyPage(){
 const [mounted,setMounted]=useState(false),[organ,setOrgan]=useState<OrganId>('heart');
 const [selected,setSelected]=useState<string|null>(null),[hidden,setHidden]=useState<string[]>([]),[isolated,setIsolated]=useState<string|null>(null);
 const [opacity,setOpacity]=useState(1),[exploded,setExploded]=useState(0),[explodeLevel,setExplodeLevel]=useState<'organ'|'parts'>('organ');
 const [query,setQuery]=useState(''),[expanded,setExpanded]=useState<Set<string>>(new Set([MODEL_DEFINITIONS.heart.root,'VH_M_cardiac_chamber','VH_M_heart_valve']));
 const [panel,setPanel]=useState<'structures'|'details'|null>(null);
 const [cameraRequest,setCameraRequest]=useState<{kind:'reset'|'zoomIn'|'zoomOut'|'focus',version:number,id?:string|null}>({kind:'reset',version:0});
 useEffect(()=>{setMounted(true);const v=new URLSearchParams(window.location.search).get('organ');if(v==='heart'||v==='lungs'||v==='brain'){setOrgan(v);setExpanded(new Set([MODEL_DEFINITIONS[v].root]));}},[]);
 const model=MODEL_DEFINITIONS[organ],nodes=STRUCTURES[organ];
 const byId=useMemo(()=>new Map(nodes.map(n=>[n.id,n])),[nodes]);
 const current=selected?byId.get(selected):undefined;
 const lesson=EDUCATION[current?.id||model.root];
 const found=useMemo(()=>query.trim()?nodes.filter(n=>match(n.title+' '+(n.latin||'')+' '+n.sourceLabel,query.trim())):[],[nodes,query]);
 const request=(kind:'reset'|'zoomIn'|'zoomOut'|'focus',id?:string|null)=>setCameraRequest(v=>({kind,version:v.version+1,id}));
 function changeOrgan(v:OrganId){setOrgan(v);setSelected(null);setHidden([]);setIsolated(null);setOpacity(1);setExploded(0);setQuery('');setExpanded(new Set([MODEL_DEFINITIONS[v].root]));request('reset');if(typeof window!=='undefined'){const u=new URL(window.location.href);u.searchParams.set('organ',v);window.history.replaceState({},'',u)}}
 function choose(id:string){setSelected(id);setPanel(null)}
 function toggleHidden(id:string){setHidden(v=>v.some(h=>descendants(organ,h).includes(id))?v.filter(h=>!descendants(organ,h).includes(id)):[...v,id])}
 function reset(){setSelected(null);setHidden([]);setIsolated(null);setOpacity(1);setExploded(0);request('reset')}
 const isHidden=(id:string)=>hidden.some(h=>descendants(organ,h).includes(id));
 function row(n:Structure,depth=0):ReactNode{
  const open=expanded.has(n.id);
  return <div key={n.id} className="atlas-tree-branch"><div className={'atlas-tree-row '+(selected===n.id?'is-selected ':'')+(isHidden(n.id)?'is-hidden':'')} style={{paddingLeft:10+depth*13}}>
   {n.children.length>0?<button className="atlas-tree-toggle" aria-label={(open?'Contraer ':'Expandir ')+n.title} aria-expanded={open} onClick={()=>setExpanded(v=>{const a=new Set(v);a.has(n.id)?a.delete(n.id):a.add(n.id);return a})}>{open?<CaretDown size={12}/>:<CaretRight size={12}/>}</button>:<span className="atlas-tree-dot"/>}
   <button className="atlas-tree-label" onClick={()=>choose(n.id)} title={n.title}>{n.title}</button>
   <button className="atlas-tree-eye" aria-label={(isHidden(n.id)?'Mostrar ':'Ocultar ')+n.title} onClick={()=>toggleHidden(n.id)}>{isHidden(n.id)?<EyeSlash size={14}/>:<Eye size={14}/>}</button></div>
   {open&&n.children.map(id=>byId.get(id)).filter((v):v is Structure=>!!v).map(c=>row(c,depth+1))}</div>
 }
 return <main className="atlas-page">
 <div className="atlas-heading"><div><span className="anatomy-eyebrow">EL CUERPO, PIEZA A PIEZA</span><h1>Explorador anatómico</h1></div><span className="atlas-edition">ATLAS 01 <span>·</span> 3 SISTEMAS</span></div>
 <div className="atlas-workspace">
 <aside className={'atlas-sidebar '+(panel==='structures'?'is-open':'')}>
 <div className="atlas-panel-heading"><span>ESTRUCTURAS</span><button className="atlas-mobile-close" onClick={()=>setPanel(null)} aria-label="Cerrar estructuras"><X size={18}/></button><span className="atlas-count">{model.meshCount}</span></div>
 <label className="atlas-search"><MagnifyingGlass size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar una estructura…" aria-label="Buscar estructura anatómica"/></label>
 <div className="atlas-system-list">{organIds.map(id=><button key={id} onClick={()=>changeOrgan(id)} className={'atlas-system '+(id===organ?'is-active':'')}><Icon organ={id}/><span>{MODEL_DEFINITIONS[id].title}<small>{MODEL_DEFINITIONS[id].system}</small></span><span className="atlas-system-number">{MODEL_DEFINITIONS[id].code}</span></button>)}</div>
 <div className="atlas-tree-heading">{query?found.length+' coincidencias':'DESGLOSE ANATÓMICO'}<button onClick={()=>setExpanded(new Set(nodes.filter(n=>n.children.length).map(n=>n.id)))} aria-label="Expandir todas las estructuras"><Plus size={14}/></button></div>
 <div className="atlas-tree" role="region" aria-label="Árbol de estructuras">{query?(found.length?found.map(n=><button key={n.id} className={'atlas-search-result '+(selected===n.id?'is-selected':'')} onClick={()=>choose(n.id)}><span>{n.title}</span><small>{n.latin||n.sourceLabel}</small></button>):<p className="atlas-empty">No encontramos esa estructura.<br/>Prueba con otro nombre.</p>):row(byId.get(model.root)!)}</div>
 <div className="atlas-sidebar-footer"><span className="atlas-status-dot"/> {model.meshCount} piezas anatómicas reales</div>
 </aside>
 <section className="atlas-viewport" aria-label={'Modelo interactivo de '+model.title}>
 <div className="atlas-viewbar"><span><span className="atlas-mono">0{organIds.indexOf(organ)+1}</span> {model.system} <CaretRight size={12}/> <strong>{model.title}</strong></span><button onClick={reset} aria-label="Restablecer vista"><ArrowCounterClockwise size={16}/><span>Restablecer</span></button></div>
 <div className="atlas-canvas">{mounted?<Suspense fallback={<div className="model-loading">Preparando el explorador 3D…</div>}><Scene modelId={organ} selected={selected} hidden={hidden} isolated={isolated} opacity={opacity} exploded={exploded/100} explodeLevel={explodeLevel} onSelect={id=>setSelected(selectionFromScene(organ,id))} cameraRequest={cameraRequest}/></Suspense>:<div className="model-loading">Preparando el explorador 3D…</div>}</div>
 <div className="atlas-model-title"><span className="atlas-mono">{model.latin}</span><h2>{model.title}</h2><p>Arrastra para descubrir cada perspectiva.</p></div>
 <div className="atlas-view-controls"><button aria-label="Acercar" onClick={()=>request('zoomIn')}><Plus size={18}/></button><button aria-label="Alejar" onClick={()=>request('zoomOut')}><Minus size={18}/></button><span/><button aria-label="Centrar modelo" onClick={()=>request('reset')}><ArrowsOut size={18}/></button><button aria-label="Enfocar selección" disabled={!selected} onClick={()=>request('focus',selected)}><Scan size={18}/></button></div>
 <div className="atlas-mobile-actions"><button onClick={()=>setPanel('structures')}><List size={17}/> Estructuras</button><button onClick={()=>setPanel('details')}><SlidersHorizontal size={17}/> Controles</button></div>
 <div className="atlas-explode-bar"><div><Stack size={17}/><span>Despiece</span><strong>{exploded}%</strong></div><input type="range" min="0" max="100" value={exploded} onChange={e=>setExploded(Number(e.target.value))} aria-label="Separación de piezas"/><div className="atlas-explode-level"><button className={explodeLevel==='organ'?'is-active':''} onClick={()=>setExplodeLevel('organ')}>Grupos</button><button className={explodeLevel==='parts'?'is-active':''} onClick={()=>setExplodeLevel('parts')}>Piezas</button></div></div>
 <div className="atlas-interaction-hint">GIRAR <span>arrastrar</span><i/> ZOOM <span>rueda / pellizco</span><i/> MOVER <span>botón derecho</span></div>
 </section>
 <aside className={'atlas-detail '+(panel==='details'?'is-open':'')}>
 <div className="atlas-panel-heading"><span>INSPECCIÓN</span><button className="atlas-mobile-close" onClick={()=>setPanel(null)} aria-label="Cerrar inspección"><X size={18}/></button><Cube size={16}/></div>
 <div className="atlas-detail-content"><div className="atlas-detail-icon"><Icon organ={organ} size={26}/></div><span className="anatomy-eyebrow">{current?'ESTRUCTURA SELECCIONADA':'MODELO DE REFERENCIA'}</span><h2>{current?.title||model.title}</h2><p className="atlas-latin">{current?.latin||(!current?model.latin:'')}</p>
 {current?<div className="atlas-selected-meta"><span>NOMBRE EN EL MODELO ORIGINAL</span><p>{current.sourceLabel}</p>{current.children.length>0&&<small>{descendants(organ,current.id).filter(id=>byId.get(id)?.mesh).length} piezas dentro de este grupo</small>}</div>:<p className="atlas-description">{model.description}</p>}
 <div className="atlas-education"><dl><div><dt>SISTEMA</dt><dd>{model.system}</dd></div><div><dt>REGIÓN</dt><dd>{lesson?.region||(organ==='brain'?'Cráneo':'Tórax')}</dd></div></dl>{lesson?<><h3>Descripción</h3><p>{lesson.description}</p><h3>Función</h3><p>{lesson.function}</p><h3>Relaciones anatómicas</h3><div className="atlas-related">{lesson.relations.filter(id=>byId.has(id)).map(id=><button key={id} onClick={()=>{setIsolated(null);setHidden([]);choose(id);request('focus',id)}}>{byId.get(id)!.title}<CaretRight size={11}/></button>)}</div><SiteLink href={lesson.source} target="_blank" rel="noreferrer">Fuente educativa · NHLBI / NIH <ArrowSquareOut size={12}/></SiteLink></>:<p className="atlas-note-pending">Ficha educativa específica en preparación.</p>}</div>
 {current?<div className="atlas-selection-actions"><button onClick={()=>request('focus',current.id)}><Scan size={17}/> Enfocar</button><button className={isolated===current.id?'is-active':''} onClick={()=>{setHidden([]);setIsolated(v=>v===current.id?null:current.id)}}><ArrowsOut size={17}/>{isolated===current.id?'Ver conjunto':'Aislar'}</button><button onClick={()=>toggleHidden(current.id)}>{isHidden(current.id)?<Eye size={17}/>:<EyeSlash size={17}/>} {isHidden(current.id)?'Mostrar':'Ocultar'}</button><button onClick={()=>setSelected(null)}><X size={17}/> Deseleccionar</button></div>:<div className="atlas-select-hint"><Scan size={19}/><p>Selecciona una pieza en el modelo o en la lista para examinarla.</p></div>}
 <div className="atlas-property"><label htmlFor="atlas-opacity">Opacidad <strong>{Math.round(opacity*100)}%</strong></label><input id="atlas-opacity" type="range" min="10" max="100" value={opacity*100} onChange={e=>setOpacity(Number(e.target.value)/100)}/><small>Aplica a las piezas visibles del modelo.</small></div>
 {(hidden.length>0||isolated)&&<button className="atlas-show-all" onClick={()=>{setHidden([]);setIsolated(null)}}><Eye size={16}/> Mostrar todas las piezas{hidden.length>0?' ('+hidden.length+')':''}</button>}
 <div className="atlas-source"><span>PROCEDENCIA</span><p>Human Reference Atlas<br/><strong>HRA / HuBMAP</strong></p><p className="atlas-source-note">Modelo masculino · {organ==='lungs'?'v1.4':'v1.2'}<br/>Creative Commons CC BY 4.0</p><SiteLink href={model.sourceUrl} target="_blank" rel="noreferrer">Consultar el modelo <ArrowSquareOut size={13}/></SiteLink><SiteLink href="https://humanatlas.io/3d-reference-library" target="_blank" rel="noreferrer">Biblioteca y documentación <ArrowSquareOut size={13}/></SiteLink></div>
 <p className="atlas-scope">Atlas parcial: esta edición incluye corazón, pulmones y encéfalo. Las fichas educativas específicas están disponibles para una selección de estructuras.</p>
 </div></aside></div>
 <div className="atlas-bottom-note"><span>355 piezas. Una nueva perspectiva.</span><span>Modelos anatómicos de referencia · HRA / HuBMAP</span></div>
 </main>
}

