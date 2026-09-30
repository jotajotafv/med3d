import {lazy, Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {ArrowCounterClockwise, ArrowSquareOut, ArrowsOut, Bone, CaretRight, Cube, Eye, EyeSlash, List, MagnifyingGlass, Minus, Plus, Scan, SlidersHorizontal, Stack, X} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import {MODEL_DEFINITIONS, STRUCTURES, type OrganId, type Structure} from '../data';
import {BONE_TERMS} from './bone-education';
import {createCatalogIndex, normalizeSearch, SYSTEMS} from './catalog-index';
import type {AnatomyCatalog, AnatomyNode, AssetLoadStatus, AtlasCameraRequest, AtlasMetrics, ExplodeLevel, SystemId} from './types';
import VirtualTree from './VirtualTree';
import AnatomyInformation from './AnatomyInformation';
import {getIntegumentaryContextIds} from './integumentary-education';
import {getNerveContextIds} from './nerve-education';
import {getInternalContextIds, INTERNAL_SYSTEMS} from './internal-education';
import {getDigestiveContextIds} from './digestive-education';
import {getRespiratoryContextIds} from './respiratory-education';
import {getCardiovascularContextIds} from './cardiovascular-education';
import {getMuscleContextIds} from './muscle-education';
import {withOcularCoverage} from './ocular-catalog';
import {ocularContextIds} from './ocular-education';
import {composeBodyCatalog} from './body-catalog';
import '../anatomy.css';
import './atlas.css';

const Scene = lazy(() => import('./AtlasScene'));
const CATALOG_PATHS = ['models/anatomy/skeletal/catalog.json','models/anatomy/muscular/catalog.json','models/anatomy/nervous/catalog.json','models/anatomy/cardiovascular/catalog.json','models/anatomy/respiratory/catalog.json','models/anatomy/digestive/catalog.json','models/anatomy/urinary/catalog.json','models/anatomy/endocrine/catalog.json','models/anatomy/lymphatic/catalog.json','models/anatomy/reproductive/catalog.json','models/anatomy/integumentary/catalog.json','models/anatomy/ocular/catalog.json'];
const initialOpacity: Partial<Record<SystemId, number>> = {skeletal: 1, muscular: 1, nervous: 1, cardiovascular: 1, respiratory: 1, digestive: 1, urinary: 1, endocrine: 1, lymphatic: 1, reproductive: 1, integumentary: 1};
const kindName = (node: AnatomyNode) => node.integumentaryType?node.integumentaryType:node.internalType?node.internalType:node.systemId==='digestive'&&node.digestiveType?node.digestiveType: node.systemId==='respiratory'&&node.respiratoryType?node.respiratoryType: node.systemId==='cardiovascular'&&node.cardioType?node.cardioType: node.systemId==='nervous'&&node.neuralType?node.neuralType: node.kind==='structure'&&node.systemId==='muscular'?'Músculo':node.kind==='structure'&&node.systemId==='skeletal'?'Hueso':({body:'Cuerpo',system:'Sistema',division:'Grupo anatómico',region:'Región',structure:'Estructura',component:'Componente'} as const)[node.kind];
const systemName = (id?:SystemId) => SYSTEMS.find(system=>system.id===id)?.name||'Cuerpo humano';
const ORGAN_IDS: OrganId[] = ['heart','lungs','brain'];
const LEGACY_ORGAN_IDS = new Set(['VH_M_heart','VH_M_lungs_L','VH_M_lungs_R','Allen_brain']);
const legacyKind = (node: Structure) => LEGACY_ORGAN_IDS.has(node.id)?'Órgano':node.id==='VH_M_lungs'?'Grupo de órganos':node.id==='VH_M_respiratory_system'?'Sistema':node.mesh?'Componente':'Grupo anatómico';
const legacySearch = ORGAN_IDS.flatMap(organ => STRUCTURES[organ].map(node => ({organ,node,text:normalizeSearch([node.title,node.latin,node.sourceLabel,node.id].filter(Boolean).join(' '))})));
const mb = (bytes:number) => (bytes/1_000_000).toLocaleString('es',{maximumFractionDigits:1});

export default function SkeletalAtlas() {
  const [catalog,setCatalog] = useState<AnatomyCatalog|null>(null), [catalogError,setCatalogError] = useState(''), [catalogRetry,setCatalogRetry] = useState(0);
  const [assetIds,setAssetIds] = useState<string[]>([]), [selected,setSelected] = useState<string|null>(null);
  const [hidden,setHidden] = useState<string[]>([]), [isolated,setIsolated] = useState<string|null>(null);
  const [contextIds,setContextIds] = useState<string[]>([]);
  const rememberedAssets = useRef<Partial<Record<SystemId,string[]>>>({});
  const initialSystems = useRef(new URLSearchParams(window.location.search).get('systems')?.split(',')||['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive']);
  // Optional regional entry point. Unknown IDs are ignored; the global catalog
  // remains searchable and selecting another region explicitly loads it.
  const initialModules = useRef(new URLSearchParams(window.location.search).get('modules')?.split(','));
  const initialAssets = (value:AnatomyCatalog,system?:SystemId) => value.assets.filter(asset=>
    (system?asset.systemId===system:initialSystems.current.includes(asset.systemId))&&
    (asset.systemId==='skeletal'||!initialModules.current||initialModules.current.includes(asset.id))).map(asset=>asset.id);
  const [opacityBySystem,setOpacityBySystem] = useState(initialOpacity), [exploded,setExploded] = useState(0), [explodeLevel,setExplodeLevel] = useState<ExplodeLevel>('regions');
  const [searchPage,setSearchPage] = useState(0);
  const [query,setQuery] = useState(''), [expanded,setExpanded] = useState<Set<string>>(new Set());
  const [panel,setPanel] = useState<'structures'|'details'|null>(null), [mobileTab,setMobileTab] = useState<'tree'|'layers'>('tree');
  const [statuses,setStatuses] = useState<AssetLoadStatus[]>([]), [metrics,setMetrics] = useState<AtlasMetrics|null>(null);
  const [cameraRequest,setCameraRequest] = useState<AtlasCameraRequest>({kind:'reset',version:0});
  useEffect(() => {
    const abort = new AbortController(); setCatalogError('');
    Promise.all(CATALOG_PATHS.map(async path => {
      const response=await fetch(import.meta.env.BASE_URL+path,{signal:abort.signal});
      if(!response.ok)throw new Error('No se pudo descargar el catálogo anatómico.');
      return await response.json() as AnatomyCatalog;
    })).then(([skeletal,muscular,nervous,cardiovascular,respiratory,digestive,...internal]) => {
      const ocular=internal.pop()!;
      const value=composeBodyCatalog(skeletal,muscular,withOcularCoverage(nervous,ocular),cardiovascular,respiratory,digestive,...internal);
      createCatalogIndex(value);
      if (abort.signal.aborted) return;
      setCatalog(value); setAssetIds(initialAssets(value));
      setExpanded(new Set(value.nodes.filter(node=>node.kind==='body'||node.kind==='system'||node.kind==='division').map(node=>node.id)));
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
  const loadedIds = new Set(statuses.filter(status=>status.state==='ready'&&assetIds.includes(status.id)).map(status=>status.id));
  const visibleNodes = catalog?.nodes.filter(node=>node.meshNames.length&&node.assetIds.some(id=>loadedIds.has(id))&&!hidden.some(id=>index?.inside(node.id,id))&&(!isolated||index?.inside(node.id,isolated))&&(!contextIds.length||contextIds.some(id=>index?.inside(node.id,id))))||[];
  const activeSystemCount = new Set(visibleNodes.map(node=>node.systemId)).size;
  useEffect(()=>{if(activeSystemCount<2&&explodeLevel==='systems')setExplodeLevel('regions');},[activeSystemCount,explodeLevel]);
  const requested = catalog?.assets.filter(asset=>assetIds.includes(asset.id))||[];
  const ready = statuses.filter(status=>status.state==='ready').length;
  const errors = statuses.filter(status=>status.state==='error');
  const terms = current?.family?BONE_TERMS[current.family]:undefined;
  const source = catalog?.provenance.find(item=>item.id===catalog.assets.find(asset=>current?.assetIds.includes(asset.id))?.provenanceId)||catalog?.provenance[0];
  const request = (kind:AtlasCameraRequest['kind'],id?:string|null)=>setCameraRequest(value=>({kind,id,version:value.version+1}));
  const detailSystem=current?.systemId||'skeletal';
  const relatedContext = current&&index?(current.ocularClass?ocularContextIds(current,index.byId):current.systemId==='integumentary'?getIntegumentaryContextIds(current,index.byId):current.systemId&&INTERNAL_SYSTEMS.includes(current.systemId)?getInternalContextIds(current,index.byId):current.systemId==='digestive'?getDigestiveContextIds(current,index.byId):current.systemId==='respiratory'?getRespiratoryContextIds(current,index.byId):current.systemId==='cardiovascular'?getCardiovascularContextIds(current,index.byId):current.systemId==='nervous'?getNerveContextIds(current,index.byId):getMuscleContextIds(current,index.byId)):[];
  function choose(id:string) {
    if(!index)return;
    setSelected(id);setHidden(value=>index.reveal(value,id));setIsolated(null);setContextIds([]);
    // Reveal a searched internal target through the envelope, with visible feedback.
    if(index.byId.get(id)?.systemId&&index.byId.get(id)?.systemId!=='integumentary'&&assetIds.includes('integumentary:skin')&&!isHidden('integ:FMA7163'))setOpacityBySystem(value=>(value.integumentary??1)>.25?{...value,integumentary:.25}:value);
    setAssetIds(value=>[...new Set([...value,...index.assetIdsFor(id)])]);
    setExpanded(value=>new Set([...value,...(index.ancestors.get(id)||[])]));
    request('focus',id);setPanel(null);
  }
  function isHidden(id:string) {return hidden.some(item=>index?.inside(id,item));}
  function hide(id:string) {setHidden(value=>isHidden(id)?index?.reveal(value,id)||[]:[...value,id]);}
  function toggleAsset(id:string) {setAssetIds(value=>value.includes(id)?value.filter(item=>item!==id):[...value,id]);}
  function toggleSystem(systemId:SystemId) {
    const assets=catalog?.assets.filter(asset=>asset.systemId===systemId).map(asset=>asset.id)||[];
    const active=assetIds.filter(id=>assets.includes(id));
    if(active.length)rememberedAssets.current[systemId]=active;
    const regionalDefaults=catalog?initialAssets(catalog,systemId):assets;
    const defaults=regionalDefaults.length?regionalDefaults:assets;
    setAssetIds(value=>active.length?value.filter(id=>!assets.includes(id)):[...new Set([...value,...(rememberedAssets.current[systemId]||defaults)])]);
  }
  function showContext() {
    if(!current||!index||!relatedContext.length)return;
    const targets=[current.id,...relatedContext];
    if(current.systemId==='integumentary'||current.ocularClass)setOpacityBySystem(value=>({...value,integumentary:.25}));
    setContextIds(targets);setIsolated(null);setHidden([]);
    setAssetIds(value=>[...new Set([...value,...targets.flatMap(id=>index.assetIdsFor(id))])]);
    request('focus',current.id);
  }
  function surfaceView(interior:boolean) {
    setQuery('');setContextIds([]);setHidden(value=>index?.reveal(value,'integ:FMA7163')||value);
    setAssetIds(value=>[...new Set([...value,'integumentary:skin'])]);
    setOpacityBySystem(value=>({...value,integumentary:interior?.25:1}));
    setIsolated(interior?null:'integ:FMA7163');setSelected(interior?null:'integ:FMA7163');
    request('reset');setPanel(null);
  }
  function reset() {
    setSelected(null);setHidden([]);setIsolated(null);setContextIds([]);setOpacityBySystem({...initialOpacity});setExploded(0);setExplodeLevel('regions');setQuery('');rememberedAssets.current={};
    setAssetIds(catalog?initialAssets(catalog):[]);request('reset');
  }
  function selectByPointer(id:string|null) {setSelected(id);if(id&&index)setExpanded(value=>new Set([...value,...(index.ancestors.get(id)||[])]));}
  function isolate() {
    if(!current)return;
    setContextIds([]);setHidden([]);
    if(isolated===current.id) {
      // Leaving isolation preserves the user's current layer/module choices.
      setIsolated(null);
      const stillRequested=index?.assetIdsFor(current.id).some(id=>assetIds.includes(id));
      request(stillRequested?'focus':'reset',stillRequested?current.id:undefined);
      return;
    }
    setAssetIds(value=>[...new Set([...value,...(index?.assetIdsFor(current.id)||[])])]);
    setIsolated(current.id);request('focus',current.id);
  }
  function regionName(id:string) {if(id==='integumentary')return 'Cuerpo completo';return index?.byId.get(id)?.name||(id==='nervous:head'?'Cabeza':id);}
  const nodeKind = current?kindName(current):'Cuerpo';
  const availableStructures = catalog?.nodes.filter(node=>node.kind==='structure'&&node.assetIds.some(id=>loadedIds.has(id))).length||0;
  const selectionHidden = !!current&&isHidden(current.id);
  const publicStatus = errors.length?'Hay una región sin cargar':!requested.length?'Elige una región para explorar':ready<requested.length?'Cargando anatomía…':`${availableStructures} ${availableStructures===1?'estructura disponible':'estructuras disponibles'}`;
  const totalBytes = catalog?.assets.reduce((sum,asset)=>sum+asset.bytes,0)||0;
  return <main className="atlas-page atlas-phase2">
    <div className="atlas-heading"><div><span className="anatomy-eyebrow">EL CUERPO, PIEZA A PIEZA</span><h1>Explorador anatómico</h1></div><span className="atlas-edition">ANATOMÍA HUMANA <span>·</span> COBERTURA DISPONIBLE</span></div>
    {!catalog ? <section className="atlas-catalog-state" role={catalogError?'alert':'status'}><Bone size={36} weight="light"/><h2>{catalogError?'No se pudo abrir el atlas':'Preparando el catálogo anatómico'}</h2><p>{catalogError||'Las estructuras se cargarán por regiones.'}</p>{catalogError&&<button onClick={()=>setCatalogRetry(value=>value+1)}>Reintentar</button>}</section> : <>
      <div className="atlas-workspace">
        <aside className={'atlas-sidebar '+(panel==='structures'?'is-open':'')}>
          <div className="atlas-panel-heading"><span>ESTRUCTURAS</span><span className="atlas-count">{catalog.coverage.structures}</span><button className="atlas-mobile-close" onClick={()=>setPanel(null)} aria-label="Cerrar estructuras"><X size={18}/></button></div>
          <label className="atlas-search"><MagnifyingGlass size={16}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar nombre, sinónimo o latín" aria-label="Buscar estructura anatómica"/>{query&&<button aria-label="Limpiar búsqueda" onClick={()=>setQuery('')}><X size={13}/></button>}</label>
          <div className="atlas-sidebar-tabs" aria-label="Organización del atlas"><button className={mobileTab==='tree'?'is-active':''} onClick={()=>setMobileTab('tree')}>Árbol anatómico</button><button className={mobileTab==='layers'?'is-active':''} onClick={()=>setMobileTab('layers')}>Capas</button></div>
          {query ? <div className="atlas-tree atlas-global-results"><p className="atlas-result-count" role="status">{found.length+legacyFound.length} resultados en el atlas disponible</p>
            {found.slice(searchPage*60,(searchPage+1)*60).map(node=><button className={'atlas-search-result '+(node.id===selected?'is-selected':'')} key={node.id} data-node-id={node.id} onClick={()=>choose(node.id)}><span>{node.name}</span>{node.latin&&<small>{node.latin}</small>}<small>{kindName(node)} · {systemName(node.systemId)} · {regionName(node.regionId)}</small></button>)}
            {found.length>60&&<div className="atlas-search-pages"><button disabled={searchPage===0} onClick={()=>setSearchPage(value=>value-1)}>Anterior</button><span>{searchPage+1} / {Math.ceil(found.length/60)}</span><button disabled={(searchPage+1)*60>=found.length} onClick={()=>setSearchPage(value=>value+1)}>Siguiente</button></div>}
            {legacyFound.length>0&&<p className="atlas-reference-heading">ÓRGANOS DE REFERENCIA</p>}
            {legacyFound.map(({organ,node})=><SiteLink className="atlas-search-result" key={organ+node.id} href={'/anatomia?organ='+organ+'&structure='+encodeURIComponent(node.id)}><span>{node.title}</span><small>{legacyKind(node)} · {organ==='heart'?'Cardiovascular · Tórax':organ==='lungs'?'Respiratorio · Tórax':'Nervioso · Cabeza'} · modelo independiente</small></SiteLink>)}
            {!found.length&&!legacyFound.length&&<p className="atlas-empty">No hay coincidencias en las estructuras incorporadas. Prueba con otro nombre o sinónimo.</p>}
          </div> : mobileTab==='tree' ? <><div className="atlas-tree-heading">DESGLOSE ANATÓMICO<div><button onClick={()=>setExpanded(new Set())} aria-label="Contraer todo el árbol"><Minus size={14}/></button><button onClick={()=>setExpanded(new Set(catalog.nodes.filter(node=>node.children.length).map(node=>node.id)))} aria-label="Expandir todo el árbol"><Plus size={14}/></button></div></div>
            {index&&<VirtualTree catalog={catalog} index={index} expanded={expanded} selected={selected} hidden={hidden} onExpand={id=>setExpanded(value=>{const next=new Set(value);next.has(id)?next.delete(id):next.add(id);return next;})} onSelect={choose} onHide={hide}/>}</> : <div className="atlas-layers-scroll">
            {registeredSystems.map(system=>{
              const assets=catalog.assets.filter(asset=>asset.systemId===system.id), active=assets.some(asset=>assetIds.includes(asset.id));
              return <section className="atlas-layer-system" data-system-id={system.id} key={system.id}>
                <label className="atlas-layer-toggle"><input type="checkbox" checked={active} aria-label={system.name} onChange={()=>toggleSystem(system.id)}/><Bone size={19}/><span>{system.name}<small>{system.branches}</small></span></label>
                <label className="atlas-layer-opacity">Opacidad del sistema <strong>{Math.round((opacityBySystem[system.id]??1)*100)}%</strong><input type="range" min="10" max="100" value={(opacityBySystem[system.id]??1)*100} onChange={event=>setOpacityBySystem(value=>({...value,[system.id]:Number(event.target.value)/100}))} aria-label={'Opacidad de '+system.name}/></label>
                {system.id==='integumentary'&&<><p className="atlas-context-note">Opaca, el clic prioriza la piel. Transparente, permite seleccionar el interior. Buscar una estructura interna baja la piel al 25 %. Las superficies pueden intersectarse: Aislar piel muestra sólo la envoltura.</p><div className="atlas-selection-actions atlas-surface-actions"><button onClick={()=>surfaceView(false)}>Aislar piel</button><button onClick={()=>surfaceView(true)}>Explorar interior</button></div></>}
                {system.id==='cardiovascular'&&<fieldset className="atlas-cardio-sublayers"><legend>Mostrar en Cardiovascular</legend>{[['cardio:arterial','Arterias'],['cardio:venous','Venas'],['cardio:heart','Corazón']].map(([id,label])=><label key={id}><input type="checkbox" aria-label={'Mostrar '+label.toLowerCase()} checked={active&&!isHidden(id)} disabled={!active} onChange={()=>hide(id)}/>{label}</label>)}<small>Rojo: arterias · azul: venas. El color indica tipo de vaso, no oxigenación.</small></fieldset>}
                <div className="atlas-region-layers">{assets.map(asset=><label key={asset.id} data-asset-id={asset.id}><input type="checkbox" checked={assetIds.includes(asset.id)} onChange={()=>toggleAsset(asset.id)}/><span>{asset.id==='integumentary:skin'?'Piel · superficie corporal':asset.id==='endocrine:glands'?'Glándulas craneales y suprarrenales':asset.id==='endocrine:thyroid43'?'Tiroides y paratiroides':asset.systemId==='digestive'?({'digestive:upper':'Región oral y esófago','digestive:stomach-accessory':'Estómago y órganos accesorios','digestive:small-intestine':'Intestino delgado','digestive:large-intestine':'Intestino grueso'} as Record<string,string>)[asset.id]:asset.systemId==='cardiovascular'?({'cardio:heart':'Corazón y coronarias','cardio:trunk':'Tórax, abdomen y pelvis','cardio:head-neck':'Cabeza y cuello','cardio:upper-right':'Miembro superior derecho','cardio:upper-left':'Miembro superior izquierdo','cardio:lower-right':'Miembro inferior derecho','cardio:lower-left':'Miembro inferior izquierdo'} as Record<string,string>)[asset.id]:regionName(asset.regionId)}</span></label>)}</div>
              </section>;
            })}
            <div className="atlas-reference-links"><span>ÓRGANOS DE REFERENCIA</span><p>Corazón, pulmones y encéfalo, en sus propios modelos de referencia.</p>{ORGAN_IDS.map(organ=><SiteLink href={'/anatomia?organ='+organ} key={organ}>{MODEL_DEFINITIONS[organ].title}<CaretRight size={13}/></SiteLink>)}</div>
          </div>}
          <div className="atlas-sidebar-footer"><span className="atlas-status-dot"/>{publicStatus}</div>
        </aside>
        <section className="atlas-viewport" aria-label="Modelo interactivo del cuerpo humano" data-selected-id={selected||''} data-context-ids={contextIds.join(',')} aria-busy={statuses.some(status=>status.state==='loading'||status.state==='queued')} data-loaded-assets={metrics?.loadedAssets||0} data-mesh-count={metrics?.meshes||0} data-triangle-count={metrics?.triangles||0} data-geometry-bytes={metrics?.geometryBytes||0} data-draw-calls={metrics?.drawCalls||0} data-render-geometries={metrics?.renderGeometries||0} data-render-textures={metrics?.renderTextures||0} data-load-ms={metrics?.loadMs||0} data-first-geometry-ms={metrics?.firstGeometryMs||0} data-full-system-ms={metrics?.fullSystemMs||0}>
          <div className="atlas-viewbar"><span><Bone size={15}/><strong>Cuerpo humano · {registeredSystems.length} sistemas</strong></span><button onClick={reset} aria-label="Restablecer atlas"><ArrowCounterClockwise size={16}/><span>Restablecer</span></button></div>
          <div className="atlas-canvas"><Suspense fallback={<div className="model-loading">Preparando el visor anatómico…</div>}><Scene catalog={catalog} assetIds={assetIds} selected={selected} hidden={hidden} isolated={isolated} contextIds={contextIds} opacityBySystem={opacityBySystem} exploded={exploded/100} explodeLevel={explodeLevel} cameraRequest={cameraRequest} onSelect={selectByPointer} onLoadStatus={setStatuses} onMetrics={setMetrics}/></Suspense></div>
          <div className="atlas-model-title"><span className="atlas-mono">{current?.systemId==='urinary'?'Systema urinarium':current?.systemId==='endocrine'?'Systema endocrinum':current?.systemId==='lymphatic'?'Systema lymphoideum':current?.systemId==='reproductive'?'Systema genitale masculinum':current?.systemId==='digestive'?'Systema digestorium':current?.systemId==='respiratory'?'Systema respiratorium':current?.systemId==='cardiovascular'?'Systema cardiovasculare':current?.systemId==='nervous'?'Systema nervosum':current?.systemId==='muscular'?'Systema musculare':current?.systemId==='skeletal'?'Systema skeletale':'Corpus humanum'}</span><h2>{current?.name||'Cuerpo humano'}</h2><p>{selectionHidden?'Estructura oculta':contextIds.length?'Contexto anatómico seleccionado':isolated?'Estructura aislada':current?nodeKind:'Modelo anatómico de referencia'}</p></div>
          <label className="atlas-view-picker"><span>Vista</span><select aria-label="Vista anatómica" value="" onChange={event=>{const view=event.target.value as NonNullable<AtlasCameraRequest['view']>;setCameraRequest(value=>({kind:'view',view,id:selected,version:value.version+1}));}}><option value="" disabled>Elegir perspectiva</option><option value="anterior">Frontal</option><option value="posterior">Posterior</option><option value="left">Lateral izquierda</option><option value="right">Lateral derecha</option><option value="superior">Superior</option><option value="inferior">Inferior</option></select></label>
          {!assetIds.length&&<div className="atlas-nolayers"><Stack size={26}/><p>Activa una capa para explorar el cuerpo.</p><button onClick={()=>{setMobileTab('layers');setPanel('structures');}}>Elegir capas</button></div>}
          <div className="atlas-view-controls"><button aria-label="Acercar" onClick={()=>request('zoomIn')}><Plus size={18}/></button><button aria-label="Alejar" onClick={()=>request('zoomOut')}><Minus size={18}/></button><span/><button aria-label="Centrar modelo" onClick={()=>request('reset')}><ArrowsOut size={18}/></button><button aria-label="Enfocar selección" disabled={!selected} onClick={()=>request('focus',selected)}><Scan size={18}/></button></div>
          <div className="atlas-mobile-actions"><button onClick={()=>setPanel('structures')}><List size={17}/> Estructuras</button><button onClick={()=>setPanel('details')}><SlidersHorizontal size={17}/> Inspección</button></div>
          <div className="atlas-load-summary" role="status" aria-live="polite">{publicStatus}</div>
          <div className="atlas-explode-bar"><div><Stack size={17}/><span>Despiece</span><strong>{exploded}%</strong></div><input type="range" min="0" max="100" value={exploded} onChange={event=>setExploded(Number(event.target.value))} aria-label="Separación de piezas"/><select aria-label="Nivel de despiece" value={explodeLevel} onChange={event=>setExplodeLevel(event.target.value as ExplodeLevel)}><option value="regions">Regiones</option><option value="structures">Estructuras</option>{activeSystemCount>=2&&<option value="systems">Sistemas</option>}</select></div>
          {current?.systemId&&current.systemId!=='integumentary'&&assetIds.includes('integumentary:skin')&&!isHidden('integ:FMA7163')&&!isolated&&(!contextIds.length||contextIds.some(id=>index?.inside('integ:FMA7163',id)))&&<div className="atlas-skin-notice" role="status">Piel al {Math.round((opacityBySystem.integumentary??1)*100)} % · selección interior</div>}
          <div className="atlas-interaction-hint"><span>Arrastra para girar · Rueda o pellizco para acercar</span></div>
        </section>
        <aside className={'atlas-detail '+(panel==='details'?'is-open':'')}>
          <div className="atlas-panel-heading"><span>INSPECCIÓN</span><button className="atlas-mobile-close" onClick={()=>setPanel(null)} aria-label="Cerrar inspección"><X size={18}/></button><Cube size={16}/></div>
          <div className="atlas-detail-content"><div className="atlas-detail-icon"><Bone size={26}/></div><span className="anatomy-eyebrow">{nodeKind.toUpperCase()}</span><h2>{current?.name||'Cuerpo humano'}</h2><p className="atlas-latin">{current?.latin||terms?.latin||(!current?'Corpus humanum':'')}</p>
            {current&&<><nav className="atlas-hierarchy-path" aria-label="Ubicación anatómica">{path.map(id=><button key={id} onClick={()=>choose(id)}>{index?.byId.get(id)?.name}<CaretRight size={10}/></button>)}</nav></>}
            {current?<div className="atlas-selection-actions"><button onClick={()=>request('focus',current.id)}><Scan size={17}/> Enfocar</button><button className={isolated===current.id?'is-active':''} onClick={isolate}><ArrowsOut size={17}/>{isolated===current.id?'Ver conjunto':'Aislar'}</button><button onClick={()=>hide(current.id)}>{isHidden(current.id)?<Eye size={17}/>:<EyeSlash size={17}/>} {isHidden(current.id)?'Mostrar':'Ocultar'}</button><button onClick={()=>setSelected(null)}><X size={17}/> Deseleccionar</button></div>:<div className="atlas-select-hint"><Scan size={19}/><p>Selecciona una estructura en el modelo o búscala por su nombre.</p></div>}
            {relatedContext.length>0&&<div className="atlas-context-actions"><button className="atlas-show-context" onClick={showContext}><Eye size={16}/> Mostrar contexto</button><p>{current?.ocularClass?'Ojo y referencias orbitarias curadas':current?.systemId==='integumentary'?'Piel y referencias superficiales; la piel pasa al 25 % de opacidad':current?.systemId&&INTERNAL_SYSTEMS.includes(current.systemId)?'Órgano y referencias anatómicas curadas':current?.systemId==='digestive'?'Estructura digestiva y referencias anatómicas curadas':current?.systemId==='respiratory'?'Estructura respiratoria y referencias anatómicas curadas':current?.systemId==='cardiovascular'?'Estructura cardiovascular y referencias anatómicas curadas':current?.systemId==='nervous'?'Estructura nerviosa y referencias anatómicas curadas':current?.kind==='division'?'Grupo muscular y huesos relacionados':'Músculo y huesos relacionados'} según sus referencias anatómicas. Esta acción limita las piezas visibles.</p></div>}
            {contextIds.length>0&&<p className="atlas-context-note" role="status">Contexto activo: {contextIds.map(regionName).join(' · ')}.</p>}
            {current?.systemId==='nervous'&&!current.ocularClass&&!isolated&&!contextIds.length&&<p className="atlas-context-note">Cobertura parcial: encéfalo, órbitas y nervios de extremidades. Médula, raíces espinales y ciático pendientes. Usa Aislar o reduce la opacidad de las otras capas para ver estructuras profundas.</p>}
            {current?.systemId==='muscular'&&!isolated&&!contextIds.length&&<p className="atlas-context-note">Los músculos profundos pueden quedar cubiertos. Usa Aislar para estudiarlos; cambiar la vista conserva el contexto.</p>}
            <div className="atlas-education"><dl><div><dt>SISTEMA</dt><dd>{systemName(current?.systemId)}</dd></div><div><dt>REGIÓN</dt><dd>{current?regionName(current.regionId):'Cuerpo humano'}</dd></div></dl>
              {current?<AnatomyInformation node={current}/>:<p>Explora los once sistemas corporales disponibles: óseo, muscular, nervioso, cardiovascular, respiratorio, digestivo, urinario, endocrino, linfático e inmunitario, reproductor masculino y tegumentario. La piel está desactivada inicialmente para conservar la exploración interna. La cobertura es parcial: consulta las fichas para conocer las estructuras representadas y sus limitaciones. El corazón, los pulmones y el encéfalo conservan sus exploradores detallados independientes. Activa las regiones en Capas y selecciona una estructura para estudiar su anatomía.</p>}
              {current&&<Related current={current} byId={index?.byId||new Map()} choose={choose}/>}
            </div>
            <div className="atlas-property"><label htmlFor={detailSystem+"-opacity"}>Opacidad de {systemName(detailSystem)} <strong>{Math.round((opacityBySystem[detailSystem]??1)*100)}%</strong></label><input id={detailSystem+"-opacity"} type="range" min="10" max="100" value={(opacityBySystem[detailSystem]??1)*100} onChange={event=>setOpacityBySystem(value=>({...value,[detailSystem]:Number(event.target.value)/100}))}/></div>
            {(hidden.length>0||isolated||contextIds.length>0)&&<button className="atlas-show-all" onClick={()=>{setHidden([]);setIsolated(null);setContextIds([]);}}><Eye size={16}/> Mostrar todas las piezas</button>}
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
  return <><h3>Ubicación y estructuras relacionadas</h3><p className="atlas-relation-context">Grupo de pertenencia, componentes y estructuras homólogas.</p><div className="atlas-related">{items.map(node=><button key={node.id} onClick={()=>choose(node.id)}>{node.name}<CaretRight size={11}/></button>)}</div></>;
}
