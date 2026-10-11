import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project} from './browser-qa.mjs';
const h=await createHarness({output:process.env.CONTACT_OUTPUT||'.cache/anatomy-completion/wave2/contact-detail',viewport:{width:1280,height:760}}),{page}=h;
const read=async p=>JSON.parse(await readFile(path.join(project,p),'utf8'));
const screen=await read('.cache/anatomy-completion/wave2/bone-screen.json');
const pairScreen=process.env.CONTACT_PAIRS?await read(process.env.CONTACT_PAIRS):null;
const cats=await Promise.all(['skeletal','muscular','respiratory','ocular','digestive','cardiovascular','nervous'].map(s=>read('public/models/anatomy/'+s+'/catalog.json')));
const nodes=new Map(cats.flatMap(c=>c.nodes).map(n=>[n.id,n])),assets=new Map(cats.flatMap(c=>c.assets).map(a=>[a.id,a]));
const ids=process.env.CONTACT_IDS?.split(',')||['bp3d:FMA22459','bp3d:FMA22591','bp3d:FMA44249','bp3d:FMA22326','bp3d:FMA22338','bp3d:FMA22342','bp3d:FMA22340','bp3d:FMA9758','bp3d:FMA40120','bp3d:FMA22754','resp:FMA46636','bp3d:FMA13351'];
const report={method:'Separate QA viewer. Original GLBs and matrices; temporary transparent materials and a magenta measurement marker. Left: regional anatomy; right: 50 mm field centred at the measured source vertex. Camera follows the direction from that point to its nearest bone surface. No geometry registration or deformation.',captures:[]};
try{
 await page.route('**/qa-three/**',async route=>{const tail=new URL(route.request().url()).pathname.split('/qa-three/')[1];if(tail.includes('..'))throw Error('Invalid module route');const body=await readFile(path.join(project,'node_modules/three',tail));await route.fulfill({status:200,contentType:'text/javascript',body});});
 await page.goto(h.origin+'/med3d/');
 await page.setContent(`<html><head><style>body{margin:0;background:#07090b;color:#fff;font:16px Arial}header{height:78px;padding:18px;box-sizing:border-box}h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#adb6bc}canvas{display:block}footer{position:absolute;bottom:8px;left:18px;color:#b5bdc4}</style><script type="importmap">{"imports":{"three":"${h.origin}/qa-three/build/three.module.js"}}</script></head><body><header><h1 id="title"></h1><p id="detail"></p></header><canvas></canvas><footer>Vista regional / Detalle de 50 mm · cyan: candidato · blanco: hueso · magenta: punto medido · QA, no vista del producto</footer></body></html>`);
 await page.evaluate(async origin=>{
  const THREE=await import('three'),{GLTFLoader}=await import(origin+'/qa-three/examples/jsm/loaders/GLTFLoader.js'),{MeshoptDecoder}=await import(origin+'/qa-three/examples/jsm/libs/meshopt_decoder.module.js');
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(1280,640);renderer.setPixelRatio(1);renderer.setClearColor('#07090b');
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  window.reviewContact=async spec=>{
   const scene=new THREE.Scene();scene.add(new THREE.AmbientLight('#ffffff',2));const light=new THREE.DirectionalLight('#ffffff',2);light.position.set(2,3,4);scene.add(light);
   const aNames=new Set(spec.a.meshNames),bNames=new Set(spec.b.meshNames),loaded=[];
   for(const url of spec.urls){const gltf=await loader.loadAsync(origin+'/med3d/'+url);loaded.push(gltf);gltf.scene.traverse(m=>{if(!m.isMesh)return;m.visible=aNames.has(m.name)||bNames.has(m.name);if(!m.visible)return;m.material=new THREE.MeshStandardMaterial({color:aNames.has(m.name)?'#38c9d1':'#fff4d0',transparent:true,opacity:aNames.has(m.name)?.72:.22,roughness:.8,side:THREE.DoubleSide,depthWrite:false});});scene.add(gltf.scene);}
   scene.updateMatrixWorld(true);const point=new THREE.Vector3(...spec.contact.deepestPointMetres),nearest=new THREE.Vector3(...spec.contact.nearestSurfaceMetres),direction=nearest.clone().sub(point).normalize();
   const marker=new THREE.Mesh(new THREE.SphereGeometry(.0007,12,8),new THREE.MeshBasicMaterial({color:'#ff5797'}));marker.position.copy(point);scene.add(marker);
   const box=new THREE.Box3(new THREE.Vector3(...spec.a.bounds[0]),new THREE.Vector3(...spec.a.bounds[1])),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),span=Math.max(...size.toArray())*1.3;
   function cameraAt(target,width){const camera=new THREE.OrthographicCamera(-width/2,width/2,width/2,-width/2,.0001,10);camera.position.copy(target).addScaledVector(direction,1);camera.up.set(0,1,0);if(Math.abs(direction.y)>.9)camera.up.set(0,0,1);camera.lookAt(target);camera.updateMatrixWorld(true);return camera;}
   renderer.setScissorTest(true);for(const [i,camera]of[cameraAt(center,span),cameraAt(point,.05)].entries()){renderer.setViewport(i*640,0,640,640);renderer.setScissor(i*640,0,640,640);renderer.render(scene,camera);}
   document.getElementById('title').textContent=spec.a.name+' / '+spec.b.name;document.getElementById('detail').textContent='Profundidad muestreada '+spec.contact.maxDepthMm.toFixed(2)+' mm; '+spec.contact.over3mm+' muestras > 3 mm. El valor no establece precisión clínica.';
   for(const gltf of loaded)gltf.scene.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});marker.geometry.dispose();marker.material.dispose();
  };
 },h.origin);
 const descendants=id=>{const n=nodes.get(id);return [n,...n.children.flatMap(descendants)];};
 for(const id of ids){const result=screen.results.find(r=>r.id===id),pair=pairScreen?.pairs.find(p=>p.a===id),contact=pair?{...pair.interiorSamples,maxDepthMm:pair.interiorSamples.maxDepthMetres*1000,bone:pair.b}:result?.contacts[0];if(!contact)throw Error('No sampled contact '+id);const a=nodes.get(id),control=nodes.get(contact.bone),b={...control,meshNames:descendants(control.id).flatMap(n=>n.meshNames)},urls=[...new Set([...a.assetIds,...b.assetIds])].map(id=>assets.get(id).path);
  await page.evaluate(spec=>window.reviewContact(spec),{a,b,urls,contact});await page.waitForTimeout(200);const file=String(report.captures.length+1).padStart(2,'0')+'-'+a.sourceId+'.png';await page.screenshot({path:path.join(h.output,file)});report.captures.push({id,bone:b.id,file,contact});console.log(file);
 }
}finally{await writeFile(path.join(h.output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
