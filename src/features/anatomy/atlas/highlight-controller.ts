/** Cache ancestry once; a hover change only updates the old and new owners. */
export function createHighlightController<T extends {node:{id:string};ancestors:ReadonlySet<string>}>(parts:T[], apply:(part:T,variant:'base'|'selected'|'hover')=>void) {
  const groups=new Map<string,T[]>(),owners=new Map<string,T[]>();
  for(const part of parts){
    for(const id of part.ancestors){const group=groups.get(id)||[];group.push(part);groups.set(id,group);}
    const own=owners.get(part.node.id)||[];own.push(part);owners.set(part.node.id,own);
  }
  let initialized=false,previousSelected:string|null=null,previousHovered:string|null=null;
  return (selected:string|null,hovered:string|null)=>{
    const affected=new Set<T>(initialized?[]:parts);
    if(selected!==previousSelected)for(const id of [previousSelected,selected])if(id)for(const part of groups.get(id)||[])affected.add(part);
    if(hovered!==previousHovered)for(const id of [previousHovered,hovered])if(id)for(const part of owners.get(id)||[])affected.add(part);
    for(const part of affected)apply(part,selected&&part.ancestors.has(selected)?'selected':part.node.id===hovered?'hover':'base');
    initialized=true;previousSelected=selected;previousHovered=hovered;
    return affected.size;
  };
}
