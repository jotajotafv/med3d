// Regression-only projection of real catalog modules. No asset substitution.
import assert from 'node:assert/strict';
export function cohortCatalog(source, assetIds) {
  const catalog=structuredClone(source), ids=new Set(assetIds);
  catalog.assets=catalog.assets.filter(asset=>ids.has(asset.id));
  assert.deepEqual(new Set(catalog.assets.map(asset=>asset.id)),ids,'Every original regression module remains available');
  catalog.nodes=catalog.nodes.filter(node=>node.id==='muscular'||node.assetIds.some(id=>ids.has(id)));
  const byId=new Map(catalog.nodes.map(node=>[node.id,node]));
  for(const node of catalog.nodes){
    node.assetIds=node.assetIds.filter(id=>ids.has(id));
    node.children=node.children.filter(id=>byId.has(id));
    node.relatedIds=node.relatedIds.filter(id=>byId.has(id)||!source.nodes.some(other=>other.id===id));
  }
  function aggregate(id){const node=byId.get(id);if(!node.children.length)return node.bounds;const bounds=node.children.map(aggregate);node.bounds=[0,1].map(end=>[0,1,2].map(axis=>Math[end?'max':'min'](...bounds.map(b=>b[end][axis]))));return node.bounds;}
  aggregate('muscular');
  catalog.coverage={...catalog.coverage,structures:catalog.nodes.filter(n=>n.kind==='structure').length,meshes:catalog.assets.reduce((s,a)=>s+a.meshCount,0)};
  return catalog;
}
