import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// =============================================================================
// SHADER DE POST-PROCESADO CINEMATOGRÁFICO DE TERROR (AAA HORROR FX)
// Aberración cromática dinámica, grano analógico en GPU y viñeteado reactivo
// =============================================================================
const HorrorShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uTension: { value: 0 },
    uHeartPulse: { value: 0 },
    uResolution: { value: new THREE.Vector2(1280, 720) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uTension;
    uniform float uHeartPulse;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Generador de ruido procedural de alta velocidad
    float rand(vec2 co) {
      return fract(sin(dot(co.xy ,vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);
      vec2 toCenter = uv - center;
      float dist = length(toCenter);

      // Aberración cromática radial reactiva al nivel de terror/tensión
      float chroma = 0.0012 + uTension * 0.009;
      vec2 dir = normalize(toCenter);
      vec2 rUv = uv + dir * (chroma * dist * dist * 2.2);
      vec2 bUv = uv - dir * (chroma * dist * dist * 1.8);

      float r = texture2D(tDiffuse, rUv).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, bUv).b;
      vec3 color = vec3(r, g, b);

      // Viñeteado cinematográfico profundo
      float vignette = smoothstep(0.85, 0.28, dist);
      color *= vignette;

      // Pulso cardíaco de sangre periférica (rojo en bordes en peligro)
      if (uHeartPulse > 0.01) {
        float edge = smoothstep(0.3, 0.8, dist);
        vec3 bloodColor = vec3(0.55, 0.02, 0.02);
        color = mix(color, bloodColor * 0.6, edge * uHeartPulse * 0.55);
      }

      // Grano analógico cinematográfico (film grain fino)
      float grain = (rand(uv * uResolution + fract(uTime * 17.0)) - 0.5) * (0.045 + uTension * 0.035);
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export class PostProcess {
  constructor(renderer, scene, camera, isMobile, lowEnd) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = !lowEnd;

    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.composer = new EffectComposer(renderer);

    // 1. Render Pass principal de la escena 3D
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // 2. Unreal Bloom Pass sutil (resplandor en fluorescentes, ojos del ente y hotspot)
    if (!lowEnd) {
      this.bloomPass = new UnrealBloomPass(
        size,
        isMobile ? 0.25 : 0.38, // intensidad
        0.45,                   // radio
        0.82                    // umbral (solo luces muy brillantes)
      );
      this.composer.addPass(this.bloomPass);
    }

    // 3. Shader de terror (aberración cromática, grano en GPU y viñeta)
    this.horrorPass = new ShaderPass(HorrorShader);
    this.horrorPass.uniforms.uResolution.value.copy(size);
    this.composer.addPass(this.horrorPass);

    // 4. Output pass con mapeo tonal y sRGB
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  resize(w, h, pixelRatio) {
    this.composer.setSize(w, h);
    this.composer.setPixelRatio(pixelRatio);
    this.horrorPass.uniforms.uResolution.value.set(w, h);
  }

  update(dt, t, tension = 0, heartPulse = 0) {
    this.horrorPass.uniforms.uTime.value = t;
    this.horrorPass.uniforms.uTension.value = tension;
    this.horrorPass.uniforms.uHeartPulse.value = heartPulse;
  }

  render() {
    if (this.enabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
