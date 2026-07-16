import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { StepBackwardAlt } from '@primeicons/react/step-backward-alt'
import { StepForwardAlt } from '@primeicons/react/step-forward-alt'
import { Times } from '@primeicons/react/times'
import { Button } from '@/components/ui/button'
import { usePlayer } from '../context/player'
import type { Track } from '../lib/types'

// Ashima Arts / Stefan Gustavson's classic 3D simplex noise — the standard
// freely-reusable webgl-noise snippet, reproduced verbatim.
const SIMPLEX_NOISE_GLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`

const PARTICLE_COUNT = 1400
const BAND_HUE = [0.02, 0.33, 0.62] // bass: red-orange, mid: green-yellow, treble: blue-violet
const REDUCED_MOTION = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches

function makeDotSprite() {
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.8)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(c)
}

function makeRT(w: number, h: number) {
  return new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  })
}

export default function VisualizerOverlay({
  track,
  onClose,
}: {
  track: Track
  onClose: () => void
}) {
  const { isPlaying, toggle, prev, next, getAnalyser } = usePlayer()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x05070c, 1)

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 4.5
    const scene = new THREE.Scene()
    const group = new THREE.Group()
    scene.add(group)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = false
    controls.minDistance = 2.5
    controls.maxDistance = 9

    // --- Orb: noise-displaced icosahedron wireframe ---
    const outerUniforms = { u_time: { value: 0 }, u_level: { value: 0 } }
    const outerMaterial = new THREE.ShaderMaterial({
      uniforms: outerUniforms,
      wireframe: true,
      vertexShader: `
        ${SIMPLEX_NOISE_GLSL}
        uniform float u_time;
        uniform float u_level;
        varying float vDisp;

        void main() {
          float n = snoise(position * 1.8 + u_time * 0.25);
          float distortion = 0.15 + u_level * 0.6;
          float disp = n * distortion;
          vDisp = disp;
          vec3 newPos = position + normal * disp;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float u_level;
        varying float vDisp;

        void main() {
          vec3 base = mix(vec3(0.15, 0.45, 1.0), vec3(1.0, 0.25, 0.6), clamp(vDisp * 2.0 + 0.5, 0.0, 1.0));
          float glow = 0.5 + u_level * 0.9;
          gl_FragColor = vec4(base * glow, 1.0);
        }
      `,
    })
    const outerGeometry = new THREE.IcosahedronGeometry(1, 4)
    group.add(new THREE.Mesh(outerGeometry, outerMaterial))

    // Front-facing fresnel rim: at the silhouette, normal is perpendicular
    // to viewDir so the dot product is ~0 -> fresnel ~1 (bright). At center
    // they're near-parallel so dot ~1 -> fresnel ~0 (dark/clear). A BackSide
    // version was tried and rejected: with the camera looking at the far
    // inside surface, most visible points have a *negative* dot, and
    // clamping that to 0 made the rim term 1 almost everywhere — a flat
    // painted disc, not a rim.
    const innerUniforms = { u_level: { value: 0 } }
    const innerMaterial = new THREE.ShaderMaterial({
      uniforms: innerUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vViewDir;

        void main() {
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float u_level;
        varying vec3 vNormalW;
        varying vec3 vViewDir;

        void main() {
          float facing = clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0);
          float fresnel = pow(1.0 - facing, 2.0 + u_level * 3.0);
          vec3 glowColor = vec3(0.35, 0.7, 1.0);
          gl_FragColor = vec4(glowColor * fresnel, fresnel * 0.75);
        }
      `,
    })
    const innerGeometry = new THREE.SphereGeometry(1.08, 32, 32)
    group.add(new THREE.Mesh(innerGeometry, innerMaterial))

    // --- Particle field: orbiting "planets" tuned to one of 3 bands ---
    const orbitRadius = new Float32Array(PARTICLE_COUNT)
    const orbitSpeed = new Float32Array(PARTICLE_COUNT)
    const orbitTheta = new Float32Array(PARTICLE_COUNT)
    const orbitBand = new Uint8Array(PARTICLE_COUNT)
    const orbitAxis = new Float32Array(PARTICLE_COUNT * 3)
    const orbitAngle = new Float32Array(PARTICLE_COUNT)
    const perturb = new Float32Array(PARTICLE_COUNT)
    const hueBase = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const band = i % 3
      orbitBand[i] = band
      const t = Math.random()
      const radius =
        band === 2 ? 1.5 + t * 0.8 : band === 1 ? 2.1 + t * 0.9 : 2.8 + t * 1.1
      orbitRadius[i] = radius
      orbitSpeed[i] = (0.9 / Math.sqrt(radius)) * (0.7 + Math.random() * 0.6)
      orbitTheta[i] = Math.random() * Math.PI * 2

      const axis = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize()
      orbitAxis[i * 3] = axis.x
      orbitAxis[i * 3 + 1] = axis.y
      orbitAxis[i * 3 + 2] = axis.z
      orbitAngle[i] = (Math.random() - 0.5) * Math.PI * 0.7

      hueBase[i] = BAND_HUE[band] + (Math.random() - 0.5) * 0.06
    }

    const particlePositions = new Float32Array(PARTICLE_COUNT * 3)
    const particleColors = new Float32Array(PARTICLE_COUNT * 3)
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3),
    )
    particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(particleColors, 3),
    )
    const dotSprite = makeDotSprite()
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.045,
      map: dotSprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    group.add(particles)

    const tmpVec = new THREE.Vector3()
    const tmpAxis = new THREE.Vector3()
    const tmpColor = new THREE.Color()

    function updateParticles(dt: number, bandLevel: number[]) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const energy = bandLevel[orbitBand[i]]
        // Resonance kick: rises fast once the assigned band crosses a
        // threshold, decays slowly otherwise.
        const target = energy > 0.55 ? (energy - 0.55) * 2.2 : 0
        perturb[i] +=
          (target - perturb[i]) * (target > perturb[i] ? 0.25 : 0.04)

        orbitTheta[i] += (orbitSpeed[i] + perturb[i] * 1.8) * dt
        const r = orbitRadius[i] * (1 + perturb[i] * 0.5)

        tmpVec.set(Math.cos(orbitTheta[i]) * r, Math.sin(orbitTheta[i]) * r, 0)
        tmpAxis.set(
          orbitAxis[i * 3],
          orbitAxis[i * 3 + 1],
          orbitAxis[i * 3 + 2],
        )
        tmpVec.applyAxisAngle(tmpAxis, orbitAngle[i])

        const idx = i * 3
        particlePositions[idx] = tmpVec.x
        particlePositions[idx + 1] = tmpVec.y
        particlePositions[idx + 2] = tmpVec.z

        tmpColor.setHSL(
          hueBase[i],
          0.85,
          Math.min(0.75, 0.4 + perturb[i] * 0.3),
        )
        particleColors[idx] = tmpColor.r
        particleColors[idx + 1] = tmpColor.g
        particleColors[idx + 2] = tmpColor.b
      }
      particleGeometry.attributes.position.needsUpdate = true
      particleGeometry.attributes.color.needsUpdate = true
    }

    // --- Comet trails via a feedback (ping-pong) buffer ---
    let rtA = makeRT(1, 1)
    let rtB = makeRT(1, 1)
    const trailCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const fadeUniforms = {
      u_tex: { value: null as THREE.Texture | null },
      u_decay: { value: 0.9 },
    }
    const fadeMaterial = new THREE.ShaderMaterial({
      uniforms: fadeUniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D u_tex;
        uniform float u_decay;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(texture2D(u_tex, vUv).rgb * u_decay, 1.0);
        }
      `,
    })
    const fadeScene = new THREE.Scene()
    fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMaterial))

    const copyUniforms = { u_tex: { value: null as THREE.Texture | null } }
    const copyMaterial = new THREE.ShaderMaterial({
      uniforms: copyUniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D u_tex;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(u_tex, vUv);
        }
      `,
    })
    const copyScene = new THREE.Scene()
    copyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMaterial))

    function resize() {
      const w = canvas!.clientWidth || 1
      const h = canvas!.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      const pr = renderer.getPixelRatio()
      rtA.setSize(w * pr, h * pr)
      rtB.setSize(w * pr, h * pr)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const freqData = new Uint8Array(128)
    const bandLevel = [0, 0, 0]
    let level = 0
    let elapsed = 0
    let rafId = 0
    const clock = new THREE.Clock()

    function animate() {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min(clock.getDelta(), 0.05)
      elapsed += dt

      const analyser = getAnalyser()
      if (analyser) {
        analyser.getByteFrequencyData(freqData)
        const n = freqData.length
        const bassEnd = Math.floor(n * 0.15)
        const midEnd = Math.floor(n * 0.5)
        let bassSum = 0
        let midSum = 0
        let trebleSum = 0
        for (let i = 0; i < bassEnd; i++) bassSum += freqData[i]
        for (let i = bassEnd; i < midEnd; i++) midSum += freqData[i]
        for (let i = midEnd; i < n; i++) trebleSum += freqData[i]
        const rawBass = bassSum / bassEnd / 255
        const rawMid = midSum / (midEnd - bassEnd) / 255
        const rawTreble = trebleSum / (n - midEnd) / 255
        bandLevel[0] += (rawBass - bandLevel[0]) * 0.2
        bandLevel[1] += (rawMid - bandLevel[1]) * 0.2
        bandLevel[2] += (rawTreble - bandLevel[2]) * 0.2
      } else {
        // Idle (no analyser yet, or nothing has ever played): decay toward
        // 0 rather than freezing, so the orb settles instead of stopping.
        bandLevel[0] *= 0.95
        bandLevel[1] *= 0.95
        bandLevel[2] *= 0.95
      }
      const targetLevel = (bandLevel[0] + bandLevel[1] + bandLevel[2]) / 3
      level += (targetLevel - level) * 0.15

      const motion = REDUCED_MOTION ? 0.35 : 1
      group.rotation.y += dt * 0.2 * motion
      group.rotation.x = Math.sin(elapsed * 0.15) * 0.2 * motion

      outerUniforms.u_time.value = elapsed
      outerUniforms.u_level.value = level
      innerUniforms.u_level.value = level

      updateParticles(dt * motion, bandLevel)
      controls.update()

      // 1. fade the previous frame into rtB
      fadeUniforms.u_tex.value = rtA.texture
      renderer.setRenderTarget(rtB)
      renderer.render(fadeScene, trailCamera)

      // 2. draw this frame's scene additively on top, without clearing
      renderer.autoClear = false
      renderer.render(scene, camera)
      renderer.autoClear = true

      // 3. present rtB to the canvas
      renderer.setRenderTarget(null)
      copyUniforms.u_tex.value = rtB.texture
      renderer.render(copyScene, trailCamera)

      // swap for next frame
      ;[rtA, rtB] = [rtB, rtA]
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      outerGeometry.dispose()
      outerMaterial.dispose()
      innerGeometry.dispose()
      innerMaterial.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
      dotSprite.dispose()
      fadeMaterial.dispose()
      copyMaterial.dispose()
      rtA.dispose()
      rtB.dispose()
    }
  }, [getAnalyser])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Music visualizer"
      className="fixed inset-0 z-[100] bg-black"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1.5 backdrop-blur">
          <Button
            iconOnly
            rounded
            size="small"
            variant="text"
            severity="secondary"
            aria-label="Previous track"
            className="text-white [&_svg]:size-3.5!"
            onClick={prev}
          >
            <StepBackwardAlt />
          </Button>
          <Button
            iconOnly
            rounded
            size="small"
            variant="text"
            aria-label={
              isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
            }
            className="text-white [&_svg]:size-4!"
            onClick={() => toggle(track)}
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button
            iconOnly
            rounded
            size="small"
            variant="text"
            severity="secondary"
            aria-label="Next track"
            className="text-white [&_svg]:size-3.5!"
            onClick={next}
          >
            <StepForwardAlt />
          </Button>
        </div>
      </div>
      <Button
        rounded
        iconOnly
        size="small"
        variant="text"
        severity="secondary"
        className="absolute top-4 right-4 text-white [&_svg]:size-4!"
        aria-label="Close visualizer"
        onClick={onClose}
      >
        <Times />
      </Button>
    </div>,
    document.body,
  )
}
