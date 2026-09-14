import {useEffect, useMemo, useRef, useState} from 'react';
import {CaretDown, CaretRight, Eye, EyeSlash} from '@phosphor-icons/react';
import type {AnatomyCatalog} from './types';
import {flattenTree, type CatalogIndex} from './catalog-index';
type Props = {catalog: AnatomyCatalog; index: CatalogIndex; expanded: Set<string>; selected: string | null; hidden: string[]; onExpand: (id:string) => void; onSelect: (id:string) => void; onHide: (id:string) => void};
const HEIGHT = 40, OVERSCAN = 8;
export default function VirtualTree(props: Props) {
  const {catalog, index, expanded, selected, hidden, onExpand, onSelect, onHide} = props;
  const rows = useMemo(() => flattenTree(catalog, index, expanded), [catalog,index,expanded]);
  const ref = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({top:0,height:360});
  useEffect(() => {
    const element = ref.current; if (!element) return;
    const observer = new ResizeObserver(() => setViewport(value => ({...value,height:element.clientHeight})));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = ref.current, row = rows.findIndex(item => item.node.id === selected);
    if (!element || row < 0) return;
    const y = row * HEIGHT;
    if (y < element.scrollTop || y + HEIGHT > element.scrollTop + element.clientHeight) element.scrollTop = Math.max(0, y - element.clientHeight/2);
  }, [selected,rows]);
  const start = Math.max(0, Math.floor(viewport.top/HEIGHT) - OVERSCAN);
  const end = Math.min(rows.length, Math.ceil((viewport.top+viewport.height)/HEIGHT) + OVERSCAN);
  return <div ref={ref} className="atlas-tree atlas-virtual-tree" role="tree" tabIndex={0} aria-label="Árbol anatómico" aria-activedescendant={selected&&rows.slice(start,end).some(row=>row.node.id===selected)?'atlas-node-'+selected:undefined} onKeyDown={event=>{
    if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!rows.length)return;
    event.preventDefault();event.currentTarget.focus();
    const position=Math.max(0,rows.findIndex(row=>row.node.id===selected)),node=rows[position].node;
    if(event.key==='ArrowRight'){if(node.children.length){if(!expanded.has(node.id))onExpand(node.id);else onSelect(node.children[0]);}}
    else if(event.key==='ArrowLeft'){if(node.children.length&&expanded.has(node.id))onExpand(node.id);else if(node.parentId)onSelect(node.parentId);}
    else {const next=event.key==='Home'?0:event.key==='End'?rows.length-1:Math.max(0,Math.min(rows.length-1,position+(event.key==='ArrowDown'?1:-1)));onSelect(rows[next].node.id);}
  }} onScroll={event => setViewport(value => ({...value,top:event.currentTarget.scrollTop}))}>
    <div style={{height:rows.length*HEIGHT,position:'relative'}}>
      {rows.slice(start,end).map(({node,depth,siblingIndex,siblingCount},offset) => {
        const isHidden = hidden.some(id => index.inside(node.id,id));
        return <div key={node.id} id={'atlas-node-'+node.id} role="treeitem" aria-level={depth+1} aria-posinset={siblingIndex+1} aria-setsize={siblingCount} aria-expanded={node.children.length ? expanded.has(node.id) : undefined} aria-selected={selected===node.id} className={'atlas-tree-row '+(selected===node.id?'is-selected ':'')+(isHidden?'is-hidden':'')} style={{position:'absolute',top:(start+offset)*HEIGHT,left:0,right:0,height:HEIGHT,paddingLeft:7+depth*11}}>
          {node.children.length ? <button type="button" className="atlas-tree-toggle" aria-label={(expanded.has(node.id)?'Contraer ':'Expandir ')+node.name} onClick={()=>onExpand(node.id)}>{expanded.has(node.id)?<CaretDown size={12}/>:<CaretRight size={12}/>}</button>:<span className="atlas-tree-dot"/>}
          <button type="button" className="atlas-tree-label" title={node.name} onClick={()=>onSelect(node.id)}>{node.name}</button>
          <button type="button" className="atlas-tree-eye" aria-label={(isHidden?'Mostrar ':'Ocultar ')+node.name} onClick={()=>onHide(node.id)}>{isHidden?<EyeSlash size={14}/>:<Eye size={14}/>}</button>
        </div>;
      })}
    </div>
  </div>;
}
