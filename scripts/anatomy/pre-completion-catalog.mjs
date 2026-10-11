// Historical regression suites keep testing their original real asset cohort.
// New coverage is tested against the FULL catalogs by test-anatomy-completion.mjs.
// This never substitutes geometry or reads a cached/generated fixture.
export function preCompletionCatalog(value) {
  if (!value?.nodes || !value?.assets || !value?.coverage) return value;
  const additions=new Set(value.assets.filter(a=>a.provenanceId?.startsWith('bodyparts3d-4.0-completion-')).map(a=>a.id));
  if(!additions.size)return value;
  const copy=structuredClone(value),removed=new Set();
  copy.assets=copy.assets.filter(a=>!additions.has(a.id));
  copy.nodes=copy.nodes.filter(n=>{const keep=!n.assetIds.length||n.assetIds.some(id=>!additions.has(id));if(!keep)removed.add(n.id);return keep;});
  for(const n of copy.nodes){n.assetIds=n.assetIds.filter(id=>!additions.has(id));n.children=n.children.filter(id=>!removed.has(id));n.relatedIds=n.relatedIds.filter(id=>!removed.has(id));}
  const affected=new Set(value.nodes.filter(n=>n.assetIds.some(id=>additions.has(id))).map(n=>n.id));
  const byId=new Map(copy.nodes.map(n=>[n.id,n]));
  function bounds(n){
    if(!affected.has(n.id)||n.meshNames.length||!n.children.length)return n.bounds;
    const children=n.children.map(id=>bounds(byId.get(id))).filter(Boolean);
    if(children.length)n.bounds=[0,1].map(end=>[0,1,2].map(axis=>Math[end?'max':'min'](...children.map(b=>b[end][axis]))));
    return n.bounds;
  }
  copy.nodes.filter(n=>!n.parentId).forEach(bounds);
  copy.provenance=copy.provenance.filter(p=>!p.id.startsWith('bodyparts3d-4.0-completion-'));
  copy.coverage={...copy.coverage,structures:copy.nodes.filter(n=>n.kind==='structure').length,meshes:copy.assets.reduce((s,a)=>s+a.meshCount,0)};
  return copy;
}
