import {lazy, Suspense, useEffect, useMemo, useState} from 'react';
import {ArrowCounterClockwise, ArrowSquareOut, ArrowsOut, Bone, CaretRight, Cube, Eye, EyeSlash, List, MagnifyingGlass, Minus, Plus, Scan, SlidersHorizontal, Stack, X} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import {MODEL_DEFINITIONS, STRUCTURES, type OrganId} from '../data';
import {BONE_TERMS} from './bone-education';
import {createCatalogIndex, normalizeSearch, SYSTEMS} from './catalog-index';
import type {AnatomyCatalog, AnatomyNode, AssetLoadStatus, AtlasCameraRequest, AtlasMetrics, ExplodeLevel, SystemId} from './types';
import VirtualTree from './VirtualTree';
import BoneInformation from './BoneInformation';
import '../anatomy.css';
import './atlas.css';

const Scene = lazy(() => import('./AtlasScene'));
const CATALOG_PATH = 'models/anatomy/skeletal/catalog.json';
const initialOpacity: Partial<Record<SystemId, number>> = {skeletal: 1};
const ORGAN_IDS: OrganId[] = ['heart','lungs','brain'];
const legacySearch = ORGAN_IDS.flatMap(organ => STRUCTURES[organ].map(node => ({organ,node,text:normalizeSearch([node.title,node.latin,node.sourceLabel,node.id].filter(Boolean).join(' '))})));
const mb = (bytes:number) => (bytes/1_000_000).toLocaleString('es',{maximumFractionDigits:1});

export default function SkeletalAtlas() {
  const [catalog,setCatalog] = useState<AnatomyCatalog|null>(null), [catalogError,setCatalogError] = useState(''), [catalogRetry,setCatalogRetry] = useState(0);
  const [assetIds,setAssetIds] = useState<string[]>([]), [selected,setSelected] = useState<string|null>(null);
  const [hidden,setHidden] = useState<string[]>([]), [isolated,setIsolated] = useState<string|null>(null);
  const [opacityBySystem,setOpacityBySystem] = useState(initialOpacity), [exploded,setExploded] = useState(0), [explodeLevel,setExplodeLevel] = useState<ExplodeLevel>('regions');
  const [searchPage,setSearchPage] = useState(0);
  const [query,setQuery] = useState(''), [expanded,setExpanded] = useState<Set<string>>(new Set());
  const [panel,setPanel] = useState<'structures'|'details'|null>(null), [mobileTab,setMobileTab] = useState<'tree'|'layers'>('tree');
  const [statuses,setStatuses] = useState<AssetLoadStatus[]>([]), [metrics,setMetrics] = useState<AtlasMetrics|null>(null);
  const [cameraRequest,setCameraRequest] = useState<AtlasCameraRequest>({kind:'reset',version:0});
  useEffect(() => {
    const abort = new AbortController(); setCatalogError('');
    fetch(import.meta.env.BASE_URL+CATALOG_PATH,{signal:abort.signal}).then(async response => {
      if (!response.ok) throw new Error('No se pudo descargar el catálogo anatómico.');
      const value = await response.json() as AnatomyCatalog;
      if (value.schemaVersion !== 1 || !Array.isArray(value.nodes) || !Array.isArray(value.assets)) throw new Error('El catálogo no tiene el formato esperado.');
      createCatalogIndex(value);
      if (abort.signal.aborted) return;
      setCatalog(value); setAssetIds(value.assets.map(asset=>asset.id));
      setExpanded(new Set(value.nodes.filter(node=>node.kind==='system'||node.kind==='division').map(node=>node.id)));
    }).catch(error => {if(!abort.signal.aborted)setCatalogError(error instanceof Error?error.message:'No se pudo abrir el catálogo.');});
    return () => abort.abort();
  },[catalogRetry]);
  useEffect(() => {
    if (!panel) return;
    const onKey = (event:KeyboardEvent) => {if(event.key==='Escape')setPanel(null);};
    document.addEventListener('keydown',onKey); return()=>document.removeEventListener('keydown',onKey);
  },[panel]);
  useEffect(()=>setSearchPage(0),[query]);
  const index = useMemo(()=>catalog?createCatalogIndex(catalog):null,[catalog]);
  const current = selected?index?.byId.get(selected):undefined;
  const path = current?index?.ancestors.get(current.id)||[]:[];
  const found = useMemo(()=>index?.find(query)||[],[index,query]);
  const legacyFound = useMemo(()=>{const terms=normalizeSearch(query).split(/\s+/).filter(Boolean);return terms.length?legacySearch.filter(item=>terms.every(term=>item.text.includes(term))):[];},[query]);
  const registeredSystems = useMemo(()=>SYSTEMS.filter(system=>catalog?.assets.some(asset=>asset.systemId===system.id)),[catalog]);
  const activeSystemCount = new Set(catalog?.assets.filter(asset=>assetIds.includes(asset.id)).map(asset=>asset.systemId)).size;
  useEffect(()=>{if(activeSystemCount<2&&explodeLevel==='systems')setExplodeLevel('regions');},[activeSystemCount,explodeLevel]);
  const requested = catalog?.assets.filter(asset=>assetIds.includes(asset.id))||[];
  const ready = statuses.filter(status=>status.state==='ready').length;
  const errors = statuses.filter(status=>status.state==='error');
  const terms = current?.family?BONE_TERMS[current.family]:undefined;
  const source = catalog?.provenance.find(item=>item.id===catalog.assets.find(asset=>current?.assetIds.includes(asset.id))?.provenanceId)||catalog?.provenance[0];
  const request = (kind:AtlasCameraRequest['kind'],id?:string|null)=>setCameraRequest(value=>({kind,id,version:value.version+1}));
  function choose(id:string) {
    if(!index)return;
    setSelected(id);setHidden(value=>index.reveal(value,id));setIsolated(null);
    setAssetIds(value=>[...new Set([...value,...index.assetIdsFor(id)])]);
    setExpanded(value=>new Set([...value,...(index.ancestors.get(id)||[])]));
    request('focus',id);setPanel(null);
  }
  function isHidden(id:string) {return hidden.some(item=>index?.inside(id,item));}
  function hide(id:string) {setHidden(value=>isHidden(id)?index?.reveal(value,id)||[]:[...value,id]);}
  function toggleAsset(id:string) {setAssetIds(value=>value.includes(id)?value.filter(item=>item!==id):[...value,id]);}
  function reset() {
    setSelected(null);setHidden([]);setIsolated(null);setOpacityBySystem({...initialOpacity});setExploded(0);setExplodeLevel('regions');setQuery('');
    setAssetIds(catalog?.assets.map(asset=>asset.id)||[]);request('reset');
  }
  function selectByPointer(id:string|null) {setSelected(id);if(id&&index)setExpanded(value=>new Set([...value,...(index.ancestors.get(id)||[])]));}
  function isolate() {if(!current)return;setHidden([]);setAssetIds(value=>[...new Set([...value,...(index?.assetIdsFor(current.id)||[])])]);setIsolated(value=>value===current.id?null:current.id);request('focus',current.id);}
  function regionName(id:string) {return index?.byId.get(id)?.name||id;}
  const nodeKind = current?({system:'Sistema',division:'Grupo anatómico',region:'Región',structure:'Estructura',component:'Componente'} as const)[current.kind]:'Sistema';
  const loadedIds = new Set(statuses.filter(status=>status.state==='ready').map(status=>status.id));
  const availableStructures = catalog?.nodes.filter(node=>node.kind==='structure'&&node.assetIds.some(id=>loadedIds.has(id))).length||0;
  const selectionHidden = !!current&&isHidden(current.id);
  const publicStatus = errors.length?'Hay una región sin cargar':!requested.length?'Elige una región para explorar':ready<requested.length?'Cargando anatomía…':`${availableStructures} estructuras disponibles`;
  const totalBytes = catalog?.assets.reduce((sum,asset)=>sum+asset.bytes,0)||0;
  return <main className="atlas-page atlas-phase2">
    <div className="atlas-heading"><div><span className="anatomy-eyebrow">EL CUERPO, PIEZA A PIEZA</span><h1>Explorador anatómico</h1></div><span className="atlas-edition">ANATOMÍA HUMANA <span>·</span> SISTEMA ÓSEO</span></div>
    {!catalog ? <section className="atlas-catalog-state" role={catalogError?'alert':'status'}><Bone size={36} weight="light"/><h2>{catalogError?'No se pudo abrir el atlas':'Preparando el catálogo anatómico'}</h2><p>{catalogError||'Las estructuras se cargarán por regiones.'}</p>{catalogError&&<button onClick={()=>setCatalogRetry(value=>value+1)}>Reintentar</button>}</section> : <>
      <div className="atlas-workspace">
        <aside className={'atlas-sidebar '+(panel==='structures'?'is-open':'')}>
          <div className="atlas-panel-heading"><span>ESTRUCTURAS</span><span className="atlas-count">{catalog.coverage.structures}</span><button className="atlas-mobile-close" onClick={()=>setPanel(null)} aria-label="Cerrar estructuras"><X size={18}/></button></div>
          <label className="atlas-search"><MagnifyingGlass size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar nombre, sinónimo o latín" aria-label="Buscar estructura anatómica"/>{query&&<button aria-label="Limpiar búsqueda" onClick={()=>setQuery('')}><X size={13}/></button>}</label>
          <div className="atlas-sidebar-tabs" aria-label="Organización del atlas"><button className={mobileTab==='tree'?'is-active':''} onClick={()=>setMobileTab('tree')}>Árbol anatómico</button><button className={mobileTab==='layers'?'is-active':''} onClick={()=>setMobileTab('layers')}>Capas</button></div>
          {query ? <div className="atlas-tree atlas-global-results"><p className="atlas-result-count" role="status">{found.length+legacyFound.length} resultados en el atlas disponible</p>
            {found.slice(searchPage*60,(searchPage+1)*60).map(node=><button className={'atlas-search-result '+(node.id===selected?'is-selected':'')} key={node.id} onClick={()=>choose(node.id)}><span>{node.name}</span>{node.latin&&<small>{node.latin}</small>}<small>{({system:'Sistema',division:'Grupo anatómico',region:'Región',structure:'Estructura',component:'Componente'} as const)[node.kind]} · {regionName(node.regionId)}</small></button>)}
            {found.length>60&&<div className="atlas-search-pages"><button disabled={searchPage===0} onClick={()=>setSearchPage(value=>value-1)}>Anterior</button><span>{searchPage+1} / {Math.ceil(found.length/60)}</span><button disabled={(searchPage+1)*60>=found.length} onClick={()=>setSearchPage(value=>value+1)}>Siguiente</button></div>}
            {legacyFound.length>0&&<p className="atlas-reference-heading">ÓRGANOS DE REFERENCIA</p>}
            {legacyFound.map(({organ,node})=><SiteLink className="atlas-search-result" key={organ+node.id} href={'/anatomia?organ='+organ+'&structure='+encodeURIComponent(node.id)}><span>{node.title}</span><small>{MODEL_DEFINITIONS[organ].title} · modelo independiente</small></SiteLink>)}
            {!found.length&&!legacyFound.length&&<p className="atlas-empty">No hay coincidencias en las estructuras incorporadas. Prueba con otro nombre o sinónimo.</p>}
          </div> : mobileTab==='tree' ? <><div className="atlas-tree-heading">DESGLOSE ANATÓMICO<div><button onClick={()=>setExpanded(new Set())} aria-label="Contraer todo el árbol"><Minus size={14}/></button><button onClick={()=>setExpanded(new Set(catalog.nodes.filter(node=>node.children.length).map(node=>node.id)))} aria-label="Expandir todo el árbol"><Plus size={14}/></button></div></div>
            {index&&<VirtualTree catalog={catalog} index={index} expanded={expanded} selected={selected} hidden={hidden} onExpand={id=>setExpanded(value=>{const next=new Set(value);next.has(id)?next.delete(id):next.add(id);return next;})} onSelect={choose} onHide={hide}/>}</> : <div className="atlas-layers-scroll">
            {registeredSystems.map(system=>{
              const assets=catalog.assets.filter(asset=>asset.systemId===system.id), active=assets.some(asset=>assetIds.includes(asset.id));
              return <section className="atlas-layer-system" key={system.id}>
                <label className="atlas-layer-toggle"><input type="checkbox" checked={active} onChange={()=>setAssetIds(value=>active?value.filter(id=>!assets.some(asset=>asset.id===id)):[...new Set([...value,...assets.map(asset=>asset.id)])])}/><Bone size={19}/><span>{system.name}<small>{system.branches}</small></span></label>
                <label className="atlas-layer-opacity">Opacidad del sistema <strong>{Math.round((opacityBySystem[system.id]??1)*100)}%</strong><input type="range" min="10" max="100" value={(opacityBySystem[system.id]??1)*100} onChange={event=>setOpacityBySystem(value=>({...value,[system.id]:Number(event.target.value)/100}))} aria-label={'Opacidad de '+system.name}/></label>
                <div className="atlas-region-layers">{assets.map(asset=><label key={asset.id}><input type="checkbox" checked={assetIds.includes(asset.id)} onChange={()=>toggleAsset(asset.id)}/><span>{regionName(asset.regionId)}</span></label>)}</div>
              </section>;
            })}
            <div className="atlas-reference-links"><span>ÓRGANOS DE REFERENCIA</span><p>Corazón, pulmones y encéfalo, en sus propios modelos de referencia.</p>{ORGAN_IDS.map(organ=><SiteLink href={'/anatomia?organ='+organ} key={organ}>{MODEL_DEFINITIONS[organ].title}<CaretRight size={13}/></SiteLink>)}</div>
          </div>}
          <div className="atlas-sidebar-footer"><span className="atlas-status-dot"/>{publicStatus}</div>
        </aside>
        <section className="atlas-viewport" aria-label="Modelo interactivo del sistema óseo" aria-busy={statuses.some(status=>status.state==='loading'||status.state==='queued')} data-loaded-assets={metrics?.loadedAssets||0} data-mesh-count={metrics?.meshes||0} data-triangle-count={metrics?.triangles||0} data-geometry-bytes={metrics?.geometryBytes||0} data-draw-calls={metrics?.drawCalls||0} data-render-geometries={metrics?.renderGeometries||0} data-render-textures={metrics?.renderTextures||0} data-load-ms={metrics?.loadMs||0} data-first-geometry-ms={metrics?.firstGeometryMs||0} data-full-system-ms={metrics?.fullSystemMs||0}>
          <div className="atlas-viewbar"><span><Bone size={15}/><strong>Sistema óseo</strong></span><button onClick={reset} aria-label="Restablecer atlas"><ArrowCounterClockwise size={16}/><span>Restablecer</span></button></div>
          <div className="atlas-canvas"><Suspense fallback={<div className="model-loading">Preparando el visor anatómico…</div>}><Scene catalog={catalog} assetIds={assetIds} selected={selected} hidden={hidden} isolated={isolated} opacityBySystem={opacityBySystem} exploded={exploded/100} explodeLevel={explodeLevel} cameraRequest={cameraRequest} onSelect={selectByPointer} onLoadStatus={setStatuses} onMetrics={setMetrics}/></Suspense></div>
          <div className="atlas-model-title"><span className="atlas-mono">Systema skeletale</span><h2>{current?.name||'Sistema óseo'}</h2><p>{selectionHidden?'Estructura oculta':isolated?'Estructura aislada':current?nodeKind:'Modelo anatómico de referencia'}</p></div>
          <label className="atlas-view-picker"><span>Vista</span><select aria-label="Vista anatómica" value="" onChange={event=>{const view=event.target.value as NonNullable<AtlasCameraRequest['view']>;setCameraRequest(value=>({kind:'view',view,id:selected,version:value.version+1}));}}><option value="" disabled>Elegir perspectiva</option><option value="anterior">Frontal</option><option value="posterior">Posterior</option><option value="left">Lateral izquierda</option><option value="right">Lateral derecha</option><option value="superior">Superior</option><option value="inferior">Inferior</option></select></label>
          {!assetIds.length&&<div className="atlas-nolayers"><Stack size={26}/><p>Activa una capa para explorar el cuerpo.</p><button onClick={()=>{setMobileTab('layers');setPanel('structures');}}>Elegir capas</button></div>}
          <div className="atlas-view-controls"><button aria-label="Acercar" onClick={()=>request('zoomIn')}><Plus size={18}/></button><button aria-label="Alejar" onClick={()=>request('zoomOut')}><Minus size={18}/></button><span/><button aria-label="Centrar modelo" onClick={()=>request('reset')}><ArrowsOut size={18}/></button><button aria-label="Enfocar selección" disabled={!selected} onClick={()=>request('focus',selected)}><Scan size={18}/></button></div>
          <div className="atlas-mobile-actions"><button onClick={()=>setPanel('structures')}><List size={17}/> Estructuras</button><button onClick={()=>setPanel('details')}><SlidersHorizontal size={17}/> Inspección</button></div>
          <div className="atlas-load-summary" role="status" aria-live="polite">{publicStatus}</div>
          <div className="atlas-explode-bar"><div><Stack size={17}/><span>Despiece</span><strong>{exploded}%</strong></div><input type="range" min="0" max="100" value={exploded} onChange={event=>setExploded(Number(event.target.value))} aria-label="Separación de piezas"/><select aria-label="Nivel de despiece" value={explodeLevel} onChange={event=>setExplodeLevel(event.target.value as ExplodeLevel)}><option value="regions">Regiones</option><option value="structures">Estructuras</option>{activeSystemCount>=2&&<option value="systems">Sistemas</option>}</select></div>
          <div className="atlas-interaction-hint"><span>Arrastra para girar · Rueda o pellizco para acercar</span></div>
        </section>
        <aside className={'atlas-detail '+(panel==='details'?'is-open':'')}>
          <div className="atlas-panel-heading"><span>INSPECCIÓN</span><button className="atlas-mobile-close" onClick={()=>setPanel(null)} aria-label="Cerrar inspección"><X size={18}/></button><Cube size={16}/></div>
          <div className="atlas-detail-content"><div className="atlas-detail-icon"><Bone size={26}/></div><span className="anatomy-eyebrow">{nodeKind.toUpperCase()}</span><h2>{current?.name||'Sistema óseo'}</h2><p className="atlas-latin">{current?.latin||terms?.latin||(!current?'Systema skeletale':'')}</p>
            {current&&<><nav className="atlas-hierarchy-path" aria-label="Ubicación anatómica">{path.map(id=><button key={id} onClick={()=>choose(id)}>{index?.byId.get(id)?.name}<CaretRight size={10}/></button>)}</nav></>}
            {current?<div className="atlas-selection-actions"><button onClick={()=>request('focus',current.id)}><Scan size={17}/> Enfocar</button><button className={isolated===current.id?'is-active':''} onClick={isolate}><ArrowsOut size={17}/>{isolated===current.id?'Ver conjunto':'Aislar'}</button><button onClick={()=>hide(current.id)}>{isHidden(current.id)?<Eye size={17}/>:<EyeSlash size={17}/>} {isHidden(current.id)?'Mostrar':'Ocultar'}</button><button onClick={()=>setSelected(null)}><X size={17}/> Deseleccionar</button></div>:<div className="atlas-select-hint"><Scan size={19}/><p>Selecciona un hueso en el modelo o búscalo por su nombre.</p></div>}
            <div className="atlas-education"><dl><div><dt>SISTEMA</dt><dd>{current?SYSTEMS.find(system=>system.id===current.systemId)?.name:'Sistema óseo'}</dd></div><div><dt>REGIÓN</dt><dd>{current?regionName(current.regionId):'Esqueleto axial y apendicular'}</dd></div></dl>
              {current?<BoneInformation node={current}/>:<p>Explora los huesos del esqueleto axial y apendicular. Selecciona una estructura en el modelo, el árbol o el buscador para estudiar su anatomía.</p>}
              {current&&<Related current={current} byId={index?.byId||new Map()} choose={choose}/>}
            </div>
            <div className="atlas-property"><label htmlFor="skeletal-opacity">Opacidad del sistema óseo <strong>{Math.round((opacityBySystem.skeletal??1)*100)}%</strong></label><input id="skeletal-opacity" type="range" min="10" max="100" value={(opacityBySystem.skeletal??1)*100} onChange={event=>setOpacityBySystem(value=>({...value,skeletal:Number(event.target.value)/100}))}/></div>
            {(hidden.length>0||isolated)&&<button className="atlas-show-all" onClick={()=>{setHidden([]);setIsolated(null);}}><Eye size={16}/> Mostrar todas las piezas</button>}
            {source&&<div className="atlas-source"><span>PROCEDENCIA DEL MODELO</span><p><strong>{source.source}</strong><br/>{source.author}</p><p className="atlas-source-note">Versión {source.version}<br/>{source.license}</p><SiteLink href={source.originalUrl} target="_blank" rel="noreferrer">Fuente original <ArrowSquareOut size={13}/></SiteLink><SiteLink href={source.licenseUrl} target="_blank" rel="noreferrer">Licencia y atribución <ArrowSquareOut size={13}/></SiteLink><details><summary>Adaptaciones realizadas</summary><ul>{source.modifications.map(change=><li key={change}>{change}</li>)}</ul></details></div>}
            <details className="atlas-coverage"><summary>Cobertura y límites del modelo</summary><p>{catalog.coverage.note}</p>{catalog.coverage.limitations.length>0&&<ul>{catalog.coverage.limitations.map(note=><li key={note}>{note}</li>)}</ul>}</details>
            <details className="atlas-technical"><summary>Información técnica</summary><dl>{current&&<><dt>Identificador anatómico</dt><dd>{current.sourceId||current.id}</dd></>}<dt>Modelos cargados</dt><dd>{ready} / {requested.length}</dd><dt>Descarga del conjunto</dt><dd>{mb(totalBytes)} MB · {catalog.assets.length} módulos</dd><dt>Geometría</dt><dd>{metrics?.meshes||0} mallas · {(metrics?.triangles||0).toLocaleString('es')} triángulos</dd><dt>Memoria de geometría</dt><dd>{mb(metrics?.geometryBytes||0)} MB</dd><dt>Llamadas de dibujo</dt><dd>{metrics?.drawCalls||0}</dd></dl></details>
          </div>
        </aside>
      </div>
      <div className="atlas-bottom-note"><span>{catalog.coverage.title}</span><span>Geometría real · Procedencia documentada</span></div>
      <div className="atlas-reference-footer"><span>Continúa explorando</span>{ORGAN_IDS.map(organ=><SiteLink href={'/anatomia?organ='+organ} key={organ}>{MODEL_DEFINITIONS[organ].title}<CaretRight size={12}/></SiteLink>)}</div>
    </>}
  </main>;
}
function Related({current,byId,choose}:{current:AnatomyNode;byId:Map<string,AnatomyNode>;choose:(id:string)=>void}) {
  const items = [...new Set([...(current.parentId?[current.parentId]:[]),...current.children,...current.relatedIds])].map(id=>byId.get(id)).filter((node):node is AnatomyNode=>!!node&&node.id!==current.id);
  if(!items.length)return null;
  return <><h3>Ubicación y estructuras relacionadas</h3><p className="atlas-relation-context">Grupo de pertenencia, componentes y huesos homólogos.</p><div className="atlas-related">{items.map(node=><button key={node.id} onClick={()=>choose(node.id)}>{node.name}<CaretRight size={11}/></button>)}</div></>;
}
