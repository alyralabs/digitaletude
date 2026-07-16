import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { StepBackwardAlt } from '@primeicons/react/step-backward-alt'
import { StepForwardAlt } from '@primeicons/react/step-forward-alt'
import { Times } from '@primeicons/react/times'
import { VolumeOff } from '@primeicons/react/volume-off'
import { VolumeUp } from '@primeicons/react/volume-up'
import { WavePulse } from '@primeicons/react/wave-pulse'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '../context/player'
import type { Track } from '../lib/types'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Mirrors NowPlayingBar's thumbless-slider treatment.
const THUMBLESS =
  'data-[orientation=horizontal]:h-3 [&_[data-part=handle]]:size-2.5 [&_[data-part=handle]]:before:size-1.5 [&_[data-part=handle]]:opacity-0 [&_[data-part=handle]:has(:focus-visible)]:opacity-100'

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
const BAND_HUE = [0.6, 0.72, 0.82] // bass: blue, mid: indigo, treble: violet-magenta
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
  const {
    isPlaying,
    toggle,
    prev,
    next,
    stop,
    seekChange,
    seekCommit,
    volume,
    setVolume,
    subscribeTime,
    getTime,
    getDuration,
    getAnalyser,
  } = usePlayer()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentTime = useSyncExternalStore(subscribeTime, getTime)
  const duration = useSyncExternalStore(subscribeTime, getDuration)
  const [volumeOpen, setVolumeOpen] = useState(false)
  const total = duration ?? track.durationSeconds ?? 0

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
          float distortion = 0.15 + u_level * 1.4;
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
        const target = energy > 0.35 ? (energy - 0.35) * 3.2 : 0
        perturb[i] +=
          (target - perturb[i]) * (target > perturb[i] ? 0.35 : 0.04)

        orbitTheta[i] += (orbitSpeed[i] + perturb[i] * 1.4) * dt
        const r = orbitRadius[i] * (1 + perturb[i] * 0.3)

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
      u_decay: { value: 0.88 },
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
        bandLevel[0] += (rawBass - bandLevel[0]) * 0.4
        bandLevel[1] += (rawMid - bandLevel[1]) * 0.4
        bandLevel[2] += (rawTreble - bandLevel[2]) * 0.4
      } else {
        // Idle (no analyser yet, or nothing has ever played): decay toward
        // 0 rather than freezing, so the orb settles instead of stopping.
        bandLevel[0] *= 0.95
        bandLevel[1] *= 0.95
        bandLevel[2] *= 0.95
      }
      const targetLevel = (bandLevel[0] + bandLevel[1] + bandLevel[2]) / 3
      level += (targetLevel - level) * 0.3

      const motion = REDUCED_MOTION ? 0.35 : 1
      group.rotation.y += dt * (0.2 + level * 0.8) * motion
      group.rotation.x = Math.sin(elapsed * 0.15) * 0.2 * motion

      outerUniforms.u_time.value = elapsed
      outerUniforms.u_level.value = level

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
      {/* Same pill as NowPlayingBar, floating over the canvas instead of
          docked in the footer — the desktop static/docking classes don't
          apply since there's no footer slot to dock into here. */}
      <div
        role="region"
        aria-label="Now playing"
        className="fixed bottom-6 left-1/2 z-10 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-center gap-2.5 rounded-full border border-surface bg-panel py-1 pr-2.5 pl-1.5 shadow-lg"
      >
        <div className="flex shrink-0 items-center -space-x-0.5">
          <Button
            iconOnly
            rounded
            size="small"
            variant="text"
            severity="secondary"
            aria-label="Previous track"
            className="[&_svg]:size-3.5!"
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
            className="[&_svg]:size-4!"
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
            className="[&_svg]:size-3.5!"
            onClick={next}
          >
            <StepForwardAlt />
          </Button>
        </div>
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={`${track.title} cover art`}
            decoding="async"
            className="size-8 shrink-0 rounded-md border border-surface object-cover"
          />
        ) : (
          <div className="size-8 shrink-0 rounded-md border border-surface bg-page" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs leading-tight font-medium text-color">
            {track.title || 'Untitled'}
          </p>
          <p className="font-display text-[10px] leading-tight font-semibold tracking-[0.14em] text-muted-color uppercase">
            Alyra
          </p>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[10px] leading-none tabular-nums text-muted-color">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={currentTime}
              min={0}
              max={total}
              onValueChange={(e) => {
                if (typeof e.value === 'number') seekChange(e.value)
              }}
              onValueChangeEnd={(e) => {
                if (typeof e.value === 'number') seekCommit(e.value)
              }}
              className={`min-w-0 flex-1 ${THUMBLESS}`}
            />
            <span className="shrink-0 text-[10px] leading-none tabular-nums text-muted-color">
              {formatTime(total)}
            </span>
          </div>
        </div>
        <div className="relative shrink-0">
          <Button
            iconOnly
            rounded
            size="small"
            variant="text"
            severity="secondary"
            aria-label="Volume"
            aria-expanded={volumeOpen}
            onClick={() => setVolumeOpen((open) => !open)}
          >
            {volume === 0 ? <VolumeOff /> : <VolumeUp />}
          </Button>
          {volumeOpen && (
            <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full border border-surface bg-panel px-1.5 py-3 shadow-lg">
              <Slider
                orientation="vertical"
                value={volume}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(e) => {
                  if (typeof e.value === 'number') setVolume(e.value)
                }}
                className={`data-[orientation=vertical]:w-3 ${THUMBLESS}`}
              />
            </div>
          )}
        </div>
        <Button
          rounded
          iconOnly
          size="small"
          variant="text"
          severity="secondary"
          className="shrink-0 [&_svg]:size-3.5!"
          aria-label="Close visualizer"
          onClick={onClose}
        >
          <WavePulse />
        </Button>
        <Button
          rounded
          iconOnly
          size="small"
          variant="text"
          severity="secondary"
          className="shrink-0 [&_svg]:size-3!"
          aria-label="Close player"
          onClick={stop}
        >
          <Times />
        </Button>
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
