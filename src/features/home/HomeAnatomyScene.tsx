import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type Props = { host: RefObject<HTMLElement | null>; running: boolean; onReady: () => void; onError: () => void };
type Layer = 'skin' | 'bone' | 'organ' | 'muscle';
// Existing registered BodyParts3D assets. No HRA organ frames or atlas state are reused.
const ASSETS: { path: string; layer: Layer }[] = [
  { path: 'integumentary/skin', layer: 'skin' },
  { path: 'nervous/cns', layer: 'organ' },
  { path: 'respiratory/lungs', layer: 'organ' },
  { path: 'cardiovascular/heart', layer: 'organ' },
  { path: 'skeletal/skull', layer: 'bone' },
  { path: 'muscular/muscular-neck', layer: 'muscle' },
  { path: 'skeletal/thorax', layer: 'bone' },
  { path: 'muscular/muscular-torso-anterior', layer: 'muscle' },
  { path: 'muscular/muscular-abdomen', layer: 'muscle' },
  { path: 'muscular/muscular-upper-left', layer: 'muscle' },
  { path: 'muscular/muscular-upper-right', layer: 'muscle' },
  { path: 'muscular/muscular-forearm-left', layer: 'muscle' },
  { path: 'muscular/muscular-forearm-right', layer: 'muscle' },
];
// Centres inside catalogued cerebral, left-lung, cardiac and left-deltoid bounds.
const ANCHORS = [[0, 1.57, .08], [.066, 1.29, .106], [.021, 1.227, .123], [.19, 1.265, .078]];
const PERIOD = 40;

function makeMaterials() {
  const surface = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: { uOpacity: { value: 1 } },
    vertexShader: `varying vec3 vNormal; varying vec3 vView;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal); vView = -p.xyz;
        gl_Position = projectionMatrix * p;
      }`,
    fragmentShader: `varying vec3 vNormal; varying vec3 vView; uniform float uOpacity;
      void main() {
        vec3 n = normalize(vNormal);
        float rim = pow(1.0 - abs(dot(n, normalize(vView))), 2.8);
        float light = max(dot(n, normalize(vec3(-0.8, 1.0, 1.0))), 0.0);
        vec3 color = vec3(0.32 + light * 0.22 + rim * 0.2);
        gl_FragColor = vec4(color, (0.12 + rim * 0.3) * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const material = (color: string, opacity: number) => new THREE.MeshStandardMaterial({
    color, roughness: .65, metalness: .08, transparent: true, opacity,
    depthWrite: false, side: THREE.FrontSide,
  });
  return { skin: surface, organ: new THREE.MeshStandardMaterial({ color: '#606060', roughness: .85, metalness: .04 }), bone: material('#969696', .19), muscle: material('#868686', .22) };
}

export default function HomeAnatomyScene({ host, running, onReady, onError }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const state = useRef({ running, onReady, onError });
  state.current = { running, onReady, onError };
  const invalidate = useRef<() => void>(() => {});
  useEffect(() => { invalidate.current(); }, [running]);

  useEffect(() => {
    const container = mount.current, hero = host.current;
    if (!container || !hero) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { state.current.onError(); return; }
    renderer.setClearColor(0x050505, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 600 ? 1 : 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .85;
    container.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.dataset.homeScene = 'loading';
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 10);
    const pivot = new THREE.Group(), body = new THREE.Group();
    body.position.z = -.1; pivot.add(body); scene.add(pivot);
    pivot.rotation.y = -.7;
    const materials = makeMaterials();
    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-2, 3, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 2.4); rim.position.set(2, 2, -2); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, .6); fill.position.set(1, .5, 3); scene.add(fill);
    const abort = new AbortController();
    const geometries = new Set<THREE.BufferGeometry>();
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const labelNodes = Array.from(hero.querySelectorAll<SVGGElement>('[data-home-label]'));
    const anchors = ANCHORS.map(point => new THREE.Vector3(...point));
    const projected = new THREE.Vector3();
    let width = 1, height = 1, raf = 0, previous = 0, disposed = false;
    let meshes = 0, triangles = 0, loaded = 0, firstFrame = true, contextUnavailable = false;
    const started = performance.now();
    let markTime = 0;

    function updateLabels() {
      body.updateWorldMatrix(true, false);
      const compact = width < 600;
      const positions = compact
        ? [[.12, .24], [.84, .35], [.10, .72], [.90, .76]]
        : [[.27, .22], [.75, .33], [.22, .70], [.78, .80]];
      anchors.forEach((anchor, i) => {
        const group = labelNodes[i]; if (!group) return;
        projected.copy(anchor).applyMatrix4(body.matrixWorld).project(camera);
        const x = (projected.x * .5 + .5) * width, y = (-projected.y * .5 + .5) * height;
        const [px, py] = positions[i], jointX = px * width, jointY = py * height;
        const left = i === 0 || i === 2, endX = jointX + (left ? -18 : 18);
        group.querySelector('path')!.setAttribute('d', `M${x},${y} L${jointX + (left ? 32 : -32)},${jointY} L${endX},${jointY}`);
        const joint = group.querySelector('.label-joint')!;
        joint.setAttribute('cx', String(jointX)); joint.setAttribute('cy', String(jointY));
        const dot = group.querySelector('.label-anchor')!;
        dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y));
        const text = group.querySelector('text')!;
        text.setAttribute('x', String(jointX + (left ? -26 : 26)));
        text.setAttribute('y', String(jointY + 3));
        text.setAttribute('text-anchor', left ? 'end' : 'start');
      });
    }
    function draw(now: number) {
      renderer.render(scene, camera);
      updateLabels();
      if (loaded && firstFrame) {
        firstFrame = false;
        canvas.dataset.firstGeometryMs = String(Math.round(performance.now() - started));
        canvas.dataset.homeScene = 'ready'; state.current.onReady();
      }
      // Sample diagnostics at 1 Hz instead of causing React updates every frame.
      if (now - markTime > 1000 || !state.current.running) {
        canvas.dataset.drawCalls = String(renderer.info.render.calls);
        canvas.dataset.renderTriangles = String(renderer.info.render.triangles);
        canvas.dataset.angle = pivot.rotation.y.toFixed(4);
        markTime = now;
      }
    }
    function tick(now: number) {
      raf = 0;
      if (disposed || contextUnavailable) return;
      if (!state.current.running) { previous = 0; draw(now); return; }
      if (!previous || now - previous >= 1000 / 30) {
        const delta = previous ? Math.min((now - previous) / 1000, .2) : 0;
        pivot.rotation.y = (pivot.rotation.y + delta * Math.PI * 2 / PERIOD) % (Math.PI * 2);
        previous = now; draw(now);
      }
      raf = requestAnimationFrame(tick);
    }
    function requestDraw() { if (!disposed && !contextUnavailable && !raf) { previous = 0; raf = requestAnimationFrame(tick); } }
    invalidate.current = requestDraw;
    function resize() {
      width = container!.clientWidth; height = container!.clientHeight;
      const aspect = width / Math.max(1, height);
      // Upper body is intentionally cropped at the thighs, as in the references.
      const viewHeight = aspect < .7 ? 1.52 : aspect < 1.15 ? 1.28 : 1.10;
      camera.left = -viewHeight * aspect / 2; camera.right = -camera.left;
      camera.top = viewHeight / 2; camera.bottom = -camera.top;
      const targetY = aspect < .7 ? 1.05 : aspect < 1.15 ? 1.13 : 1.215;
      camera.position.set(0, targetY, 4); camera.lookAt(0, targetY, 0); camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 600 ? 1 : 1.25));
      renderer.setSize(width, height);
      requestDraw();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container); resize();
    function contextLost(event: Event) {
      event.preventDefault(); contextUnavailable = true; abort.abort(); cancelAnimationFrame(raf); raf = 0;
      state.current.onError();
    }
    canvas.addEventListener('webglcontextlost', contextLost);

    async function loadAsset(asset: typeof ASSETS[number]) {
      const response = await fetch(`${import.meta.env.BASE_URL}models/anatomy/${asset.path}.glb`, { signal: abort.signal });
      if (!response.ok) throw new Error(`Home asset: ${response.status}`);
      const buffer = await response.arrayBuffer(); abort.signal.throwIfAborted();
      const gltf = await loader.parseAsync(buffer, '');
      const originalMaterials = new Set<THREE.Material>();
      gltf.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => originalMaterials.add(material));
        if (disposed) { object.geometry.dispose(); return; }
        geometries.add(object.geometry);
        object.material = materials[asset.layer];
        object.renderOrder = asset.layer === 'skin' ? 4 : asset.layer === 'muscle' ? 3 : asset.layer === 'bone' ? 2 : 1;
        object.raycast = () => {};
        meshes++; triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
      });
      originalMaterials.forEach(material => {
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) value.dispose(); });
        material.dispose();
      });
      if (disposed) return;
      body.add(gltf.scene); loaded++;
      canvas.dataset.meshes = String(meshes); canvas.dataset.triangles = String(triangles); canvas.dataset.assets = String(loaded);
      requestDraw();
    }
    async function load() {
      try {
        // Silhouette first; at most two additional decodes/downloads in flight.
        await loadAsset(ASSETS[0]);
        for (let i = 1; i < ASSETS.length; i += 2) {
          abort.signal.throwIfAborted();
          await Promise.all(ASSETS.slice(i, i + 2).map(loadAsset));
        }
        if (!disposed) canvas.dataset.allGeometryMs = String(Math.round(performance.now() - started));
      } catch { if (!disposed && !abort.signal.aborted) state.current.onError(); }
    }
    void load();
    return () => {
      disposed = true; abort.abort(); cancelAnimationFrame(raf); resizeObserver.disconnect();
      invalidate.current = () => {};
      canvas.removeEventListener('webglcontextlost', contextLost);
      geometries.forEach(geometry => geometry.dispose());
      Object.values(materials).forEach(material => material.dispose());
      scene.clear(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, [host]);
  return <div className="home-scene-canvas" ref={mount}/>;
}
