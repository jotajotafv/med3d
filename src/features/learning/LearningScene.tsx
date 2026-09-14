'use client';

import { Suspense, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

type Point = [number, number, number];
export type LearningSceneProps = {
  scene: 'rcp' | 'pressure';
  progress: number;
  playing: boolean;
  speed: number;
  freeCamera: boolean;
  onSelectEquipment?: (id: string) => void;
};
const skin = '#a8b8b7';
const joint = '#738b8e';
const clothing = '#415d67';
const accent = '#86bec8';

function Part({ at, size, color = skin, rotation }: { at: Point; size: Point; color?: string; rotation?: Point }) {
  return <mesh position={at} rotation={rotation} scale={size} castShadow receiveShadow>
    <sphereGeometry args={[1, 24, 18]} />
    <meshStandardMaterial color={color} roughness={0.62} metalness={0.035} />
  </mesh>;
}
function Segment({ from, to, radius = .08, color = skin }: { from: Point; to: Point; radius?: number; color?: string }) {
  const transform = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    return { position: a.clone().add(b).multiplyScalar(.5), rotation: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()), length: a.distanceTo(b) };
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);
  return <mesh position={transform.position} quaternion={transform.rotation} castShadow receiveShadow>
    <capsuleGeometry args={[radius, Math.max(.01, transform.length - radius * 2), 6, 16]} />
    <meshStandardMaterial color={color} roughness={.68} />
  </mesh>;
}
function Stage() {
  return <>
    <color attach="background" args={['#101c24']} />
    <fog attach="fog" args={['#101c24', 8, 18]} />
    <ambientLight intensity={.7} />
    <hemisphereLight args={['#d2eef0', '#1a2934', 1.5]} />
    <directionalLight position={[3, 7, 4]} intensity={2.6} color="#e0f2f1" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={.025} />
    <pointLight position={[-4, 3, -3]} intensity={28} color="#76adb9" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.045, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} /><meshStandardMaterial color="#13252e" roughness={.98} />
    </mesh>
    <gridHelper args={[18, 36, '#29424c', '#1c323d']} position={[0, -.038, 0]} />
    <ContactShadows position={[0, -.025, 0]} opacity={.5} scale={9} blur={2.7} far={4} resolution={256} color="#020e14" />
  </>;
}
function Patient({ chestRef }: { chestRef: RefObject<THREE.Group | null> }) {
  return <group>
    <RoundedBox args={[1.62, .09, 3.6]} radius={.07} position={[0, .025, .23]} receiveShadow><meshStandardMaterial color="#273f48" roughness={.97} /></RoundedBox>
    <group ref={chestRef}>
      <Part at={[0, .305, -.46]} size={[.385, .205, .56]} />
      <Part at={[0, .31, -.77]} size={[.45, .16, .19]} />
      <mesh position={[0, .511, -.54]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.10, .111, 48]} /><meshBasicMaterial color={accent} transparent opacity={.9} side={THREE.DoubleSide} /></mesh>
    </group>
    <Part at={[0, .265, .16]} size={[.32, .185, .30]} color={clothing} />
    <Segment from={[0, .34, -.94]} to={[0, .35, -1.13]} radius={.10} color={joint} />
    <Part at={[0, .365, -1.30]} size={[.185, .225, .25]} />
    <Part at={[0, .577, -1.31]} size={[.038, .045, .078]} />
    {[-1, 1].map(side => <group key={side}>
      <Segment from={[side * .19, .26, .31]} to={[side * .2, .205, .94]} radius={.133} color={clothing} />
      <Part at={[side * .2, .20, .97]} size={[.11, .105, .12]} color={joint} />
      <Segment from={[side * .2, .19, 1.03]} to={[side * .22, .16, 1.62]} radius={.094} />
      <Part at={[side * .22, .25, 1.72]} size={[.1, .19, .145]} color={clothing} />
      <Part at={[side * .40, .31, -.78]} size={[.105, .12, .12]} color={joint} />
      <Segment from={[side * .43, .29, -.72]} to={[side * .56, .19, -.26]} radius={.081} />
      <Part at={[side * .56, .19, -.24]} size={[.076, .078, .084]} color={joint} />
      <Segment from={[side * .56, .18, -.19]} to={[side * .60, .145, .23]} radius={.067} />
      <Part at={[side * .61, .14, .35]} size={[.075, .045, .13]} />
    </group>)}
  </group>;
}
function Rescuer({ movingRef }: { movingRef: RefObject<THREE.Group | null> }) {
  return <group>
    {[-.71, .01].map(z => <group key={z}>
      <Part at={[-1.03, .17, z]} size={[.14, .15, .16]} color={clothing} />
      <Segment from={[-1.04, .18, z]} to={[-1.6, .15, z + .06]} radius={.11} color={clothing} />
      <Part at={[-1.72, .14, z + .06]} size={[.17, .085, .12]} color="#243b45" />
      <Segment from={[-1.06, .24, z]} to={[-1.21, .87, z]} radius={.14} color={clothing} />
    </group>)}
    <Part at={[-1.18, .93, -.35]} size={[.22, .25, .44]} color={clothing} />
    <group ref={movingRef}>
      <Segment from={[-1.10, 1.03, -.35]} to={[-.12, 1.54, -.44]} radius={.25} color="#6c8c92" />
      <Part at={[-.08, 1.52, -.44]} size={[.23, .18, .36]} color="#6c8c92" />
      <Segment from={[-.10, 1.62, -.45]} to={[-.03, 1.78, -.45]} radius={.085} color={joint} />
      <Part at={[.05, 1.96, -.48]} size={[.18, .24, .185]} rotation={[0, 0, -.31]} />
      <Part at={[.229, 1.90, -.48]} size={[.045, .07, .037]} />
      {[-.65, -.25].map((z, i) => <group key={z}>
        <Part at={[0, 1.50, z]} size={[.105, .105, .105]} color={joint} />
        <Segment from={[0, 1.48, z]} to={[-.017, 1.025, (z - .48) / 2]} radius={.073} />
        <Part at={[-.017, 1.025, (z - .48) / 2]} size={[.065, .065, .065]} color={joint} />
        <Segment from={[-.018, .99, (z - .48) / 2]} to={[-.035, .585 + i * .035, -.48]} radius={.062} />
        <Part at={[0, .55 + i * .035, -.49]} size={[.12, .036, .09]} color={accent} rotation={[0, i * Math.PI / 2, 0]} />
      </group>)}
    </group>
  </group>;
}
function CPR({ progress }: Pick<LearningSceneProps, 'progress'>) {
  const chest = useRef<THREE.Group>(null), rescuer = useRef<THREE.Group>(null);
  useFrame(() => {
    const active = progress >= .5 && progress < 5 / 6;
    const phase = (progress - .5) * 72 * 110 / 60 * Math.PI * 2;
    const depth = active ? .043 * (.5 - .5 * Math.cos(phase)) : 0;
    if (chest.current) chest.current.position.y = -depth;
    if (rescuer.current) rescuer.current.position.y = -depth;
  });
  return <group position={[.2, 0, 0]}>
    <Patient chestRef={chest} /><Rescuer movingRef={rescuer} />
    <RoundedBox position={[1.06, .15, -.86]} args={[.5, .24, .56]} radius={.06} castShadow><meshStandardMaterial color="#c1d2d0" roughness={.5} /></RoundedBox>
    <mesh position={[1.06, .274, -.92]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.29, .2]} /><meshStandardMaterial color="#183039" emissive="#386f77" emissiveIntensity={.28} /></mesh>
    <mesh position={[1.06, .278, -.64]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.037, 24]} /><meshStandardMaterial color={accent} /></mesh>
  </group>;
}
// Geometry keeps the monitor independent of remote fonts and renders the sample 118 / 76.
function DigitalDigit({ value, x }: { value: number; x: number }) {
  const activeSegments: Record<number, number[]> = { 0: [0, 1, 2, 3, 4, 5], 1: [1, 2], 2: [0, 1, 6, 4, 3], 3: [0, 1, 2, 3, 6], 4: [5, 6, 1, 2], 5: [0, 5, 6, 2, 3], 6: [0, 5, 6, 4, 3, 2], 7: [0, 1, 2], 8: [0, 1, 2, 3, 4, 5, 6], 9: [0, 1, 2, 3, 5, 6] };
  const segments: [number, number, boolean][] = [[0, .03, true], [.018, .015, false], [.018, -.015, false], [0, -.03, true], [-.018, -.015, false], [-.018, .015, false], [0, 0, true]];
  return <group position={[x, 0, 0]}>{segments.map(([sx, sy, horizontal], index) => <mesh key={index} position={[sx, sy, 0]}>
    <planeGeometry args={horizontal ? [.03, .0045] : [.0045, .025]} />
    <meshBasicMaterial color="#a9e2db" transparent opacity={activeSegments[value]?.includes(index) ? .95 : .045} />
  </mesh>)}</group>;
}
function Pressure({ progress, onSelectEquipment }: Pick<LearningSceneProps, 'progress' | 'onSelectEquipment'>) {
  const cuff = useRef<THREE.Group>(null);
  const click = (id: string) => (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelectEquipment?.(id); };
  const cuffTransform = useMemo(() => {
    const from = new THREE.Vector3(.32, 1.53, -.04), to = new THREE.Vector3(.46, 1.39, .24);
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
  }, []);
  const tube = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(.43, 1.40, .20), new THREE.Vector3(.58, 1.32, .30), new THREE.Vector3(.87, 1.33, .43), new THREE.Vector3(1.01, 1.40, .29)]), []);
  return <group position={[-.4, 0, 0]}>
    <RoundedBox args={[.82, .1, .76]} radius={.05} position={[0, .76, .05]} castShadow><meshStandardMaterial color="#34525d" /></RoundedBox>
    <RoundedBox args={[.82, .88, .12]} radius={.06} position={[0, 1.25, -.34]} rotation={[-.04, 0, 0]} castShadow><meshStandardMaterial color="#34525d" /></RoundedBox>
    {[-.33, .33].flatMap(x => [-.23, .34].map(z => <Segment key={`${x}-${z}`} from={[x, .04, z]} to={[x, .73, z]} radius={.026} color="#617780" />))}
    <Part at={[0, .87, .015]} size={[.31, .17, .31]} color={clothing} />
    <Part at={[0, 1.25, -.075]} size={[.32, .43, .20]} color="#7f9fa3" />
    <Part at={[0, 1.51, -.065]} size={[.4, .12, .17]} color="#7f9fa3" />
    <Segment from={[0, 1.6, -.07]} to={[0, 1.77, -.07]} radius={.085} color={joint} />
    <Part at={[0, 1.96, -.065]} size={[.18, .245, .185]} />
    <Part at={[0, 1.94, .113]} size={[.037, .07, .047]} />
    {[-1, 1].map(side => <group key={side}>
      <Segment from={[side * .19, .83, .10]} to={[side * .2, .73, .60]} radius={.125} color={clothing} />
      <Part at={[side * .2, .70, .62]} size={[.11, .115, .11]} color={joint} />
      <Segment from={[side * .2, .62, .63]} to={[side * .2, .16, .67]} radius={.089} />
      <Part at={[side * .2, .085, .78]} size={[.105, .085, .20]} color="#27414d" />
    </group>)}
    <Segment from={[-.34, 1.50, -.04]} to={[-.39, 1.06, .12]} radius={.075} />
    <Part at={[-.39, 1.04, .13]} size={[.07, .07, .07]} color={joint} />
    <Segment from={[-.39, 1.03, .14]} to={[-.22, .91, .42]} radius={.062} />
    <Part at={[-.19, .90, .49]} size={[.072, .04, .12]} />
    <Part at={[.33, 1.5, -.025]} size={[.095, .1, .10]} color={joint} />
    <Segment from={[.32, 1.53, -.04]} to={[.46, 1.39, .24]} radius={.077} />
    <Part at={[.46, 1.39, .25]} size={[.075, .075, .075]} color={joint} />
    <Segment from={[.46, 1.39, .25]} to={[.63, 1.39, .64]} radius={.062} />
    <Part at={[.67, 1.39, .74]} size={[.075, .044, .12]} />
    <RoundedBox args={[1.27, .08, 1.1]} radius={.035} position={[.95, 1.285, .46]} castShadow receiveShadow><meshStandardMaterial color="#68858c" roughness={.7} /></RoundedBox>
    {[.42, 1.49].flatMap(x => [.05, .88].map(z => <Segment key={`${x}-${z}`} from={[x, .03, z]} to={[x, 1.26, z]} radius={.033} color="#3b5663" />))}
    <group ref={cuff} position={[.39, 1.46, .10]} quaternion={cuffTransform} onClick={click('manguito')}>
      <mesh castShadow><cylinderGeometry args={[.102, .104, .185, 32, 1, true]} /><meshStandardMaterial color={progress >= 4 / 6 ? accent : '#5d8792'} roughness={.84} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0, .105]}><boxGeometry args={[.08, .15, .008]} /><meshStandardMaterial color="#345d6b" /></mesh>
    </group>
    <mesh><tubeGeometry args={[tube, 24, .011, 8, false]} /><meshStandardMaterial color="#a9c5ca" roughness={.85} /></mesh>
    <group position={[1.06, 1.41, .27]} rotation={[-.20, 0, 0]} onClick={click('monitor')}>
      <RoundedBox args={[.37, .18, .40]} radius={.045} castShadow><meshStandardMaterial color="#c4d6d6" roughness={.5} /></RoundedBox>
      <mesh position={[0, .093, -.035]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.26, .20]} /><meshStandardMaterial color="#173f4a" emissive="#4a9aa5" emissiveIntensity={progress >= 5 / 6 ? .65 + Math.sin(progress * 72 * 2) * .1 : .22} /></mesh>
      {progress >= 5 / 6 ? <>
        <group position={[-.064, .098, -.084]} rotation={[-Math.PI / 2, 0, 0]}>
          <DigitalDigit value={1} x={0} /><DigitalDigit value={1} x={.056} /><DigitalDigit value={8} x={.112} />
        </group>
        <group position={[-.008, .098, .002]} rotation={[-Math.PI / 2, 0, 0]}>
          <DigitalDigit value={7} x={0} /><DigitalDigit value={6} x={.056} />
        </group>
      </> : [-.074, .005].map(z => <mesh key={z} position={[0, .098, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.13, .006]} /><meshBasicMaterial color="#9bd4d7" transparent opacity={.35} /></mesh>)}
      <mesh position={[.09, .095, .12]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.026, 24]} /><meshStandardMaterial color="#477f8b" /></mesh>
    </group>
  </group>;
}
function CameraDirector({ scene, progress, freeCamera }: Pick<LearningSceneProps, 'scene' | 'progress' | 'freeCamera'>) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, .7, 0));
  const controls = useRef<any>(null);
  const step = Math.min(5, Math.floor(Math.max(0, progress) * 6));
  const cprViews: Point[] = [[3.8, 3.5, 4.7], [2.7, 2.9, -.3], [3.8, 3.4, 3.8], [3.25, 3.3, 3.15], [3.25, 3.3, 3.15], [3.2, 3.2, 3.3]];
  const pressureViews: Point[] = [[3.6, 2.7, 4.4], [3.6, 2.7, 4.4], [3.6, 2.7, 4.4], [3.3, 2.1, 4.4], [2.7, 2.5, 2.6], [2.3, 2.7, 2.3]];
  useFrame((_, delta) => {
    if (freeCamera) return;
    const desired = new THREE.Vector3(...(scene === 'rcp' ? cprViews[step] : pressureViews[step]));
    const aim = scene === 'rcp' ? new THREE.Vector3(-.15, step === 1 ? .6 : .65, step === 1 ? -.75 : -.1) : new THREE.Vector3(step >= 4 ? .4 : .05, 1.1, .22);
    const factor = 1 - Math.exp(-delta * 3);
    camera.position.lerp(desired, factor);
    target.current.lerp(aim, factor);
    camera.lookAt(target.current);
    if (controls.current) { controls.current.target.copy(target.current); controls.current.update(); }
  });
  return <OrbitControls ref={controls} enabled={freeCamera} makeDefault enablePan={false} minDistance={2} maxDistance={8} minPolarAngle={.2} maxPolarAngle={Math.PI / 2 - .05} target={[0, .7, 0]} />;
}
export default function LearningScene(props: LearningSceneProps) {
  return <Canvas aria-label={props.scene === 'rcp' ? 'Modelo tridimensional esquemático de RCP en un adulto' : 'Modelo tridimensional de la postura para medir la presión arterial'} shadows dpr={[1, 1.7]} camera={{ position: [3.8, 3.5, 4.7], fov: 39, near: .1, far: 70 }} gl={{ antialias: true, alpha: false }} style={{ width: '100%', height: '100%', minHeight: 300, touchAction: props.freeCamera ? 'none' : 'auto' }}>
    <Suspense fallback={null}>
      <Stage />
      {props.scene === 'rcp' ? <CPR progress={props.progress} /> : <Pressure progress={props.progress} onSelectEquipment={props.onSelectEquipment} />}
      <CameraDirector scene={props.scene} progress={props.progress} freeCamera={props.freeCamera} />
    </Suspense>
  </Canvas>;
}
