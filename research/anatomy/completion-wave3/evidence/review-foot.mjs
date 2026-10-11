import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project,withinQaDeadline} from '../../../scripts/anatomy/browser-qa.mjs';
const dir=path.join(project,'.cache/anatomy-completion/wave3/foot-regional');
const h=await createHarness({output:path.join(dir,'visual'),viewport:{width:1536,height:820},reducedMotion:'reduce'}),{page}=h;
const registration=JSON.parse(await readFile(path.join(dir,'registration.json'),'utf8'));
const cases=[['foot_l','17-foot-left-lateral',[1,0,0],null],['foot_l','18-foot-left-plantar',[0,-1,.05],null],['foot_r','19-foot-right-plantar',[0,-1,.05],null]];
const report={method:'Three panels: source in global similarity orientation; target original bones; regional overlay. Only QA display materials. Target/source landmark errors shown with green/magenta points and connecting lines. Each named region uses one shared rigid transform after global similarity, no candidate-specific fit.',captures:[]};
try{await withinQaDeadline(async()=>{
 await page.route('**/qa-three/**',async route=>{const tail=new URL(route.request().url()).pathname.split('/qa-three/')[1];if(tail.includes('..'))throw Error('Invalid path');await route.fulfill({status:200,contentType:'text/javascript',body:await readFile(path.join(project,'node_modules/three',tail))});});
 await page.route('**/qa-source/*.glb',async route=>{const file=new URL(route.request().url()).pathname.split('/').at(-1);await route.fulfill({status:200,contentType:'model/gltf-binary',body:await readFile(path.join(dir,file))});});
 await page.goto(h.origin+'/med3d/');
 await page.setContent(`<html><head><style>body{margin:0;background:#07090b;color:white;font:16px Arial}header{height:86px;padding:14px 20px;box-sizing:border-box}h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#b6bfc5}.labels{display:flex;height:30px}.labels span{width:33.333%;text-align:center}footer{padding:12px;color:#b6bfc5;font-size:14px}</style><script type="importmap">{"imports":{"three":"${h.origin}/qa-three/build/three.module.js"}}</script></head><body><header><h1></h1><p></p></header><div class="labels"><span>Fuente · orientación global</span><span>Destino · huesos originales</span><span>Registro regional · overlay y landmarks</span></div><canvas></canvas><footer>Investigación, no aprobación anatómica · cyan: candidato · blanco: huesos · magenta/verde: landmarks transformados/destino · Sin deformación</footer></body></html>`);
 await page.evaluate(async origin=>{
  const THREE=await import('three'),{GLTFLoader}=await import(origin+'/qa-three/examples/jsm/loaders/GLTFLoader.js');
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:true});renderer.setSize(1536,650);renderer.setPixelRatio(1);renderer.setClearColor('#07090b');renderer.setScissorTest(true);
  const loader=new GLTFLoader(),target=(await loader.loadAsync(origin+'/qa-source/qa-target.glb')).scene,cache=new Map();
  const material=(color,opacity)=>new THREE.MeshStandardMaterial({color,opacity,transparent:opacity<1,depthWrite:opacity===1,roughness:.8,side:THREE.DoubleSide});
  const sourceMaterial=material('#28cbd0',.8),sourceBone=material('#b4aed5',.2),targetMaterial=material('#fff3d4',.8),overlayBone=material('#fff3d4',.15);
  window.showRegistration=async spec=>{
   if(!cache.has(spec.region))cache.set(spec.region,(await loader.loadAsync(origin+'/qa-source/qa-'+spec.region+'.glb')).scene);
   const model=cache.get(spec.region),landmarks=spec.data.landmarks,boneIds=new Set(landmarks.map(l=>l.target));
   const scenes=[0,1,2].map(()=>{const s=new THREE.Scene();s.add(new THREE.AmbientLight('white',2));const l=new THREE.DirectionalLight('white',2);l.position.set(2,3,4);s.add(l);return s;});
   const selected=m=>m.userData.role==='candidate'&&(!spec.gaps||m.userData.gaps.some(g=>spec.gaps.includes(g)));
   const focus=new THREE.Box3();
   model.traverse(m=>{if(!m.isMesh)return;const chosen=selected(m);if(!chosen&&m.userData.role!=='reference')return;
    if(m.userData.mode==='global'){const c=m.clone();c.material=chosen?sourceMaterial:sourceBone;scenes[0].add(c);}
    if(m.userData.mode==='regional'&&chosen){const c=m.clone();c.material=sourceMaterial;scenes[2].add(c);focus.expandByObject(c);}
   });
   target.traverse(m=>{if(!m.isMesh||!boneIds.has(m.userData.boneId))return;for(const i of [1,2]){const c=m.clone();c.material=i===1?targetMaterial:overlayBone;scenes[i].add(c);}});
   const M=new THREE.Matrix4().set(...spec.data.matrix.flat());
   for(const l of landmarks){const a=new THREE.Vector3(...l.sourceLandmark).applyMatrix4(M),b=new THREE.Vector3(...l.targetLandmark);for(const [point,color] of [[a,'#ff4baf'],[b,'#60fb91']]){const m=new THREE.Mesh(new THREE.SphereGeometry(.0015,8,6),new THREE.MeshBasicMaterial({color}));m.position.copy(point);scenes[2].add(m);}scenes[2].add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color:'#f4e773'})));}
   const center=focus.getCenter(new THREE.Vector3()),size=focus.getSize(new THREE.Vector3()),span=Math.max(...size.toArray())*1.15;
   const dir=new THREE.Vector3(...spec.direction);const camera=new THREE.OrthographicCamera(-span*.5,span*.5,span*.635,-span*.635,.001,10);camera.position.copy(center).addScaledVector(dir,2);camera.up.set(0,1,0);camera.lookAt(center);camera.updateMatrixWorld(true);
   for(const [i,s] of scenes.entries()){renderer.setViewport(i*512,0,512,650);renderer.setScissor(i*512,0,512,650);renderer.render(s,camera);}
   document.querySelector('h1').textContent=spec.file+' · '+spec.region;document.querySelector('p').textContent='Superficie: RMS '+spec.data.surfaceRmsMm.toFixed(2)+' mm / máximo muestreado '+spec.data.surfaceMaxMm.toFixed(2)+' mm · '+spec.data.heldOutBones.length+' controles reservados · escala global '+spec.data.globalScale.toFixed(6);
  };
 },h.origin);
 for(const [region,file,direction,gaps] of cases){await page.evaluate(spec=>window.showRegistration(spec),{region,file,direction,gaps,data:registration.regions[region]});await page.screenshot({path:path.join(h.output,file+'.png')});report.captures.push({region,file:file+'.png',gaps});console.log('CAPTURE',file);}
 report.errors=h.errors;report.badRequests=h.badRequests;
},600000,'Registration visual QA');}
finally{await writeFile(path.join(h.output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
