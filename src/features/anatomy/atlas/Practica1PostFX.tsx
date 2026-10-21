import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export interface Practica1Settings {
  film: boolean;
  glitch: boolean;
  intensity: number;
  intense: boolean;
}

export const PRACTICA1_DEFAULTS: Practica1Settings = {
  film: false, glitch: false, intensity: 0.4, intense: false,
};

type Pipeline = { composer: EffectComposer; renderPass: RenderPass; filmPass: FilmPass; glitchPass: GlitchPass };

/** Only mounted by the atlas's ?practica1=1 mode; shares its existing renderer. */
export default function Practica1PostFX({ active, settings }: { active: boolean; settings: Practica1Settings }) {
  const { gl, scene, camera, size, viewport, invalidate } = useThree();
  const pipeline = useRef<Pipeline | null>(null);

  useLayoutEffect(() => {
    if (!active) return;

    const composer = new EffectComposer(gl);
    // Retain antialiasing on the offscreen buffers, within the device's limits.
    composer.renderTarget1.samples = composer.renderTarget2.samples = Math.min(4, gl.capabilities.maxSamples);
    const renderPass = new RenderPass(scene, camera);
    const filmPass = new FilmPass(0.4, false);
    const glitchPass = new GlitchPass();
    glitchPass.goWild = false;
    const outputPass = new OutputPass();

    // Three r186 adds snow to RGBA. Keep its RGB noise, but preserve the sampled
    // alpha so the atlas's transparent background never becomes an opaque flash.
    glitchPass.material.fragmentShader = glitchPass.material.fragmentShader.replace(
      'gl_FragColor = gl_FragColor+ snow;',
      'gl_FragColor.rgb += snow.rgb * gl_FragColor.a;',
    );

    // Scene → RenderPass → FilmPass → GlitchPass → OutputPass → screen.
    // OutputPass uses the renderer's existing tone mapping and output color space.
    composer.addPass(renderPass);
    composer.addPass(filmPass);
    composer.addPass(glitchPass);
    composer.addPass(outputPass);
    pipeline.current = { composer, renderPass, filmPass, glitchPass };

    const resume = () => { if (!document.hidden) invalidate(); };
    document.addEventListener('visibilitychange', resume);
    invalidate();
    return () => {
      document.removeEventListener('visibilitychange', resume);
      pipeline.current = null;
      // Composer disposes its buffers, but each pass owns additional resources.
      renderPass.dispose();
      filmPass.dispose();
      glitchPass.dispose();
      outputPass.dispose();
      composer.dispose();
      invalidate(); // One original frame after disabling, then demand rendering.
    };
  }, [active, gl, scene, camera, invalidate]);

  useLayoutEffect(() => {
    if (!pipeline.current) return;
    pipeline.current.composer.setPixelRatio(viewport.dpr);
    pipeline.current.composer.setSize(size.width, size.height);
    invalidate();
  }, [active, gl, scene, camera, size.width, size.height, viewport.dpr, invalidate]);

  useFrame((_, delta) => {
    if (!active || !pipeline.current) return;
    const { composer, filmPass, glitchPass } = pipeline.current;
    filmPass.enabled = settings.film;
    // @types/three r186 exposes FilmPass.uniforms as object.
    (filmPass.uniforms as { intensity: { value: number } }).intensity.value = settings.intensity;
    glitchPass.enabled = settings.glitch;
    glitchPass.goWild = settings.glitch && settings.intense;
    composer.render(Math.min(delta, 0.1));
    // A demand canvas needs another invalidation for animated grain/glitches.
    if (!document.hidden) invalidate();
  }, active ? 1 : 0);
  // Priority 1 takes over R3F rendering only while active. GizmoHelper then runs
  // at priority 2, drawing only its overlay; otherwise it keeps its original 1.
  return null;
}
