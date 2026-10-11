import {readFile,writeFile,open} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project,withinQaDeadline} from '../../../scripts/anatomy/browser-qa.mjs';
const dir=path.join(project,'.cache/anatomy-completion/wave3/other-sources');
const h=await createHarness({output:path.join(dir,'visual'),viewport:{width:1500,height:800},reducedMotion:'reduce'}),{page}=h;
const report={method:'Unregistered source/target inspection. Every original bone vertex displayed as a point; ossicles use original indexed triangles. No subsampling. Panels independently center the complete objects, at the same physical scale. No anatomical transform or landmark correspondence asserted; RMS/max not available without validated correspondences.',captures:[],files:[]};
try{await withinQaDeadline(async()=>{
 await page.route('**/qa-three/**',async route=>{const tail=new URL(route.request().url()).pathname.split('/qa-three/')[1];if(tail.includes('..'))throw Error('Invalid path');await route.fulfill({contentType:'text/javascript',body:await readFile(path.join(project,'node_modules/three',tail))});});
 await page.route('**/qa-ear/*.ply',async route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1);await route.fulfill({contentType:'application/octet-stream',body:await readFile(path.join(dir,name))});});
 await page.route('**/qa-ear/*.vertices',async route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1).replace('.vertices','.ply');const fh=await open(path.join(dir,name),'r');try{const head=Buffer.alloc(1500);await fh.read(head,0,1500,0);const str=head.toString(),nv=Number(str.match(/element vertex (\d+)/)[1]),offset=head.indexOf('end_header')+11,positions=Buffer.alloc(nv*12);await fh.read(positions,0,positions.length,offset);report.files.push({name,vertices:nv,faces:Number(str.match(/element face (\d+)/)[1])});await route.fulfill({contentType:'application/octet-stream',body:positions});}finally{await fh.close();}});
 await page.goto(h.origin+'/med3d/');
 await page.setContent(`<html><head><style>body{margin:0;background:#080a0d;color:white;font:16px Arial}header{padding:18px;height:80px}h1{font-size:21px}p,footer{color:#b8c4cc}footer{padding:16px}</style><script type="importmap">{"imports":{"three":"${h.origin}/qa-three/build/three.module.js"}}</script></head><body><header><h1>OpenEar · contexto fuente / temporal corporal original</h1><p></p></header><canvas></canvas><footer>Sin registro aprobado. Hueso fuente: todos los vértices; huesecillos: triángulos originales. Centrado visual independiente; misma escala física. No se calcula un RMS sin correspondencias anatómicas verificadas.</footer></body></html>`);
 const target=JSON.parse(await readFile(path.join(dir,'target-temporal.json'),'utf8'));
 await page.evaluate(async ({origin,target})=>{
  const T=await import('three'),{PLYLoader}=await import(origin+'/qa-three/examples/jsm/loaders/PLYLoader.js');
  const r=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});r.setSize(1500,600);r.setScissorTest(true);r.setClearColor('#080a0d');
  const targetGeometry=new T.BufferGeometry();targetGeometry.setAttribute('position',new T.Float32BufferAttribute(target.vertices.flat(),3));targetGeometry.setIndex(target.faces.flat());targetGeometry.computeVertexNormals();
  window.showEar=async ({cohort,ossicles})=>{
   const source=new T.Group(),vertices=new Float32Array(await (await fetch(origin+'/qa-ear/'+cohort+'-Bone.vertices')).arrayBuffer()),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(vertices,3));const points=new T.Points(g,new T.PointsMaterial({color:'#b7bec9',size:.0003,transparent:true,opacity:.24,depthWrite:false}));source.add(points);
   for(const [i,file] of ossicles.entries()){const geo=new PLYLoader().parse(await (await fetch(origin+'/qa-ear/'+file)).arrayBuffer());geo.computeVertexNormals();source.add(new T.Mesh(geo,new T.MeshStandardMaterial({color:['#26d7d4','#ff9f53','#eb6dac'][i],side:T.DoubleSide,roughness:.7})));}
   // Source PLY uses mm RAS; display axes only, no fit or reflection of a contralateral part.
   source.rotation.x=-Math.PI/2;source.scale.setScalar(.001);source.updateMatrixWorld(true);
   const dst=new T.Mesh(targetGeometry,new T.MeshStandardMaterial({color:'#e5dbc4',side:T.DoubleSide,roughness:.8}));
   const sourceBox=new T.Box3().setFromObject(source),dstBox=new T.Box3().setFromObject(dst);source.position.sub(sourceBox.getCenter(new T.Vector3()));dst.position.sub(dstBox.getCenter(new T.Vector3()));
   const span=Math.max(...sourceBox.getSize(new T.Vector3()).toArray(),...dstBox.getSize(new T.Vector3()).toArray())*1.2;
   const camera=new T.OrthographicCamera(-span*.625,span*.625,span*.5,-span*.5,.001,5);camera.position.set(-1,.2,0);camera.lookAt(0,0,0);camera.updateMatrixWorld();
   for(const [i,obj] of [source,dst].entries()){const scene=new T.Scene();scene.add(obj,new T.AmbientLight('white',2));const light=new T.DirectionalLight('white',2);light.position.set(-1,2,1);scene.add(light);r.setViewport(i*750,0,750,600);r.setScissor(i*750,0,750,600);r.render(scene,camera);}
   document.querySelector('p').textContent=cohort.toUpperCase()+' · fuente: '+vertices.length/3+' vértices · temporal BP3D: '+target.vertices.length+' vértices · ventanas y anillo timpánico sin correspondencias validadas';
   const result={sourceBoundsMetres:[sourceBox.min.toArray(),sourceBox.max.toArray()],targetBoundsMetres:[dstBox.min.toArray(),dstBox.max.toArray()],sourceVertices:vertices.length/3};
   source.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});dst.material.dispose();return result;
  };
 },{origin:h.origin,target});
 for(const [cohort,ossicles] of [['zeta',['openear-zeta-03_Malleus.ply','openear-zeta-04_Incus.ply','openear-zeta-05_Stapes.ply']],['epsilon',['openear-epsilon-Malleus.ply','openear-epsilon-Incus.ply','openear-epsilon-Stapes.ply']]]){const metrics=await page.evaluate(spec=>window.showEar(spec),{cohort,ossicles});const file='27-openear-'+cohort+'.png';await page.screenshot({path:path.join(h.output,file)});report.captures.push({cohort,file,...metrics});console.log('CAPTURE',file);}
 report.errors=h.errors;report.badRequests=h.badRequests;
},300000,'OpenEar context QA');}
finally{await writeFile(path.join(h.output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
