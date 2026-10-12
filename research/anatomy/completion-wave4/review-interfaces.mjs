import fs from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project} from '../../../scripts/anatomy/browser-qa.mjs';
const dir=path.join(project,'.cache/anatomy-completion/wave4');
const h=await createHarness({output:path.join(dir,'interfaces-visual'),viewport:{width:1366,height:820},actionTimeoutMs:90000});
const {page}=h;
try{
 await page.route('**/qa-three/**',async r=>r.fulfill({contentType:'text/javascript',body:await fs.readFile(path.join(project,'node_modules/three',new URL(r.request().url()).pathname.split('/qa-three/')[1]))}));
 await page.goto(h.origin+'/med3d/');
 await page.setContent(`<html><head><meta charset="utf-8"><style>body{margin:0;background:#090c10;color:white;font:16px Arial}h1{font-size:20px;margin:12px 20px}p{margin:12px 20px;color:#bac5d0}canvas{display:block}</style><script type="importmap">{"imports":{"three":"${h.origin}/qa-three/build/three.module.js"}}</script></head><body><h1></h1><p></p><canvas></canvas><p>Investigación: cyan = fuente; blanco/rojo = destino. Dos vistas ortogonales. La imagen no constituye aprobación clínica.</p></body></html>`);
 await page.evaluate(async()=>{
  const T=await import('three');const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(1366,650);renderer.setScissorTest(true);
  window.review=spec=>{
   const scene=new T.Scene();scene.add(new T.AmbientLight('white',2));const l=new T.DirectionalLight('white',2);l.position.set(1,2,3);scene.add(l);
   const focus=new T.Box3();
   const add=(g,source)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(g.vertices.flat(),3));geo.setIndex(g.faces.flat());geo.computeVertexNormals();
    const red=/arteria|uretra/i.test(g.name);const mat=new T.MeshStandardMaterial({color:source?'#22cbd5':red?'#fd718b':'#efe4cc',transparent:!source,opacity:source?1:red?.5:.15,depthWrite:source,side:T.DoubleSide});const mesh=new T.Mesh(geo,mat);scene.add(mesh);if(source)focus.expandByObject(mesh);};
   spec.targets.forEach(g=>add(g,false));spec.sources.forEach(g=>add(g,true));
   const center=focus.getCenter(new T.Vector3()),size=focus.getSize(new T.Vector3()),span=Math.max(...size.toArray())*1.6;
   for(let i=0;i<2;i++){const camera=new T.OrthographicCamera(-span*.525,span*.525,span*.5,-span*.5,.0001,10);camera.position.copy(center).addScaledVector(new T.Vector3(...(i===0?spec.direction:spec.direction[0]===1?[0,0,1]:[1,0,0])),2);camera.lookAt(center);camera.updateMatrixWorld();renderer.setViewport(i*683,0,683,650);renderer.setScissor(i*683,0,683,650);renderer.render(scene,camera);}
   document.querySelector('h1').textContent=spec.name;document.querySelector('p').textContent=spec.note;
   for(const mesh of scene.children.filter(x=>x.isMesh)){mesh.geometry.dispose();mesh.material.dispose();}
  };
 });
 for(const spec of JSON.parse(await fs.readFile(path.join(dir,'interface-views.json'))).filter(s=>!process.argv[2]||s.name.includes(process.argv[2]))){await page.evaluate(s=>window.review(s),spec);await page.screenshot({path:path.join(h.output,spec.name+'.png')});console.log('CAPTURE',spec.name);}
 await fs.writeFile(path.join(h.output,'qa.json'),JSON.stringify({errors:h.errors,badRequests:h.badRequests},null,2));
}finally{await h.close();}
