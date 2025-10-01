// ========== THREE.JS SCENE SETUP ==========
const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Materials: no fill (fully transparent) + strong accent edges
const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0xFFFFFF,
  wireframe: false,
  transparent: true,
  opacity: 0.0,
  depthWrite: false
});
const edgesMaterialAccent = new THREE.LineBasicMaterial({ color: 0x0066FF, transparent: true, opacity: 0.95 });
const edgesMaterialWhite = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.95 });

// Geometry factory
function createObject(geometry, useAccent) {
  const mesh = new THREE.Mesh(geometry, wireframeMaterial.clone());
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, (useAccent ? edgesMaterialAccent : edgesMaterialWhite).clone());
  line.renderOrder = 2;
  mesh.add(line);
  return mesh;
}

// Geometries pool: Torus only (donuts) with subtle variations
function makeGeometries(isMobile) {
  const radial = isMobile ? 12 : 16;    // cross-section segments
  const tubular = isMobile ? 56 : 110;  // around-the-ring segments

  return [
    () => new THREE.TorusGeometry(1.15, 0.36, radial, tubular),
    () => new THREE.TorusGeometry(1.0, 0.32, radial, tubular),
    () => new THREE.TorusGeometry(0.95, 0.28, radial, tubular),
    () => new THREE.TorusGeometry(1.25, 0.40, radial, tubular),
    () => new THREE.TorusGeometry(1.1, 0.34, radial, tubular),
    () => new THREE.TorusGeometry(1.2, 0.30, radial, tubular),
  ];
}

const isMobile = window.matchMedia('(max-width: 768px)').matches;
const count = isMobile ? 16 : 28; // keep higher density
const verticalSpacing = isMobile ? 6.5 : 7.5; // slightly tighter stacking

const objects = [];
for (let i = 0; i < count; i++) {
  const baseGeometries = makeGeometries(isMobile);
  const geometry = baseGeometries[i % baseGeometries.length]();
  const useAccent = i % 2 === 1; // alternate: white, accent
  const mesh = createObject(geometry, useAccent);
  mesh.position.y = -i * verticalSpacing;
  // x position will be set based on viewport width to ensure on-screen travel
  mesh.position.z = (Math.random() - 0.5) * 5;
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  // store baseline Y for float animation
  mesh.userData.baseY = mesh.position.y;
  scene.add(mesh);
  objects.push(mesh);
}

// ========== GSAP + SCROLLTRIGGER ==========
gsap.registerPlugin(ScrollTrigger);

// Minimal progress bar
gsap.to('#progress', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: { scrub: true }
});

// Helpers to keep motion within the visible viewport
const viewportHalfWidthAt = (z) => {
  const distance = Math.max(0.001, camera.position.z - z);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFov / 2) * distance;
  return (height * camera.aspect) / 2;
};
const viewportMargin = 1.2; // keep a small inset so shapes remain fully visible

// Initialize start X positions based on current viewport
function setStartPositions() {
  objects.forEach((obj, index) => {
    const direction = index % 2 === 0 ? 1 : -1;
    const half = viewportHalfWidthAt(obj.position.z);
    const maxX = Math.max(0.5, half - viewportMargin);
    const jitter = (Math.random() - 0.5) * Math.min(0.3 * maxX, 1.0);
    obj.position.x = -direction * maxX + jitter;
  });
}
setStartPositions();

// Master scroll controller to ensure every object sweeps across screen with randomness
const pxFactor = isMobile ? 65 : 85; // controls camera travel vs page height; kept for camera mapping below
const motionParams = [];
function seedMotionParams() {
  motionParams.length = 0;
  objects.forEach((obj, index) => {
    const dir = index % 2 === 0 ? 1 : -1;
    const half = viewportHalfWidthAt(obj.position.z);
    const maxX = Math.max(0.5, half - viewportMargin);
    const jitter = (Math.random() - 0.5) * Math.min(0.3 * maxX, 1.0);
    // phase staggers when each donut starts its sweep; speed scales the sweep length
    const phase = Math.min(0.9, Math.random() * 0.4 + index / (objects.length * 1.4));
    const speed = 0.8 + Math.random() * 0.8; // 0.8x ~ 1.6x
    const spinX = 0.6 + Math.random() * 1.0;
    const spinY = 0.6 + Math.random() * 1.0;
    const floatAmp = 0.12 + Math.random() * 0.18; // vertical float amplitude
    const floatFreq = 0.6 + Math.random() * 1.2; // vertical float frequency
    motionParams.push({ dir, jitter, phase, speed, spinX, spinY, floatAmp, floatFreq });
  });
}
seedMotionParams();

// Master ScrollTrigger: smooth both vertical and horizontal behavior with eased mapping
function updateMotionWithProgress(progress) {
  const eased = gsap.parseEase('power2.out')(progress);
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const p = motionParams[i];
    const half = viewportHalfWidthAt(obj.position.z);
    const maxX = Math.max(0.5, half - viewportMargin);
    const startX = -p.dir * maxX + p.jitter;
    const endX = p.dir * maxX - p.jitter;
    // per-object local progress with speed & phase, also eased to reduce sudden jumps
    const localLinear = gsap.utils.clamp(0, 1, (eased - p.phase) * (1 / p.speed));
    const local = gsap.parseEase('power2.out')(localLinear);
    obj.position.x = gsap.utils.interpolate(startX, endX, local);
    // subtle vertical float around baseline Y to avoid purely vertical-only feeling
    obj.position.y = obj.userData.baseY + Math.sin((local * p.floatFreq + i * 0.13) * Math.PI * 2) * p.floatAmp;
    const spinBase = local * Math.PI * 2;
    obj.rotation.x = spinBase * p.spinX;
    obj.rotation.y = spinBase * p.spinY;
    const visible = local > 0.02 && local < 0.98;
    const m = obj.material;
    if (m) m.opacity = 0.0; // ensure no shell/gray fill remains
    const e = obj.children[0];
    if (e && e.material) {
      e.material.opacity = visible ? 0.95 : 0.5; // strong edge line
    }
  }
}

const masterST = ScrollTrigger.create({
  trigger: document.body,
  start: 'top top',
  end: 'max',
  scrub: 1,
  onUpdate: (self) => updateMotionWithProgress(self.progress),
  onRefresh: (self) => {
    setStartPositions();
    seedMotionParams();
    updateMotionWithProgress(self.progress);
  }
});

// Initialize positions to match the current scroll state to avoid a jump at first scroll
updateMotionWithProgress(masterST.progress);

// Camera vertical scroll mapping
gsap.to(camera.position, {
  y: -objects.length * verticalSpacing,
  ease: 'none',
  scrollTrigger: {
    trigger: document.body,
    start: 'top top',
    end: 'max',
    scrub: 1
  }
});

// ========== LENIS SMOOTH SCROLL INTEGRATION (with fallback) ==========
let lenis = null;
if (window.Lenis) {
  lenis = new Lenis({
    smoothWheel: true,
    smoothTouch: false,
    syncTouch: true,
    wheelMultiplier: 1.0,
    lerp: 0.1
  });
  lenis.on('scroll', () => ScrollTrigger.update());
} else {
  // Fallback: still update ScrollTrigger on native scroll
  window.addEventListener('scroll', () => ScrollTrigger.update(), { passive: true });
}

// Smooth anchor navigation (Lenis if available, else native smooth)
(function setupAnchorSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (href === '#' || href.length <= 1) return; // ignore top-only
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const duration = isMobile ? 0.9 : 1.2;
      const offset = -10;
      if (lenis) {
        lenis.scrollTo(target, {
          duration,
          offset,
          easing: (t) => 1 - Math.pow(1 - t, 3) // easeOutCubic
        });
      } else {
        const top = target.getBoundingClientRect().top + window.pageYOffset + offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();

// ========== RENDER LOOP ==========
function animate(time) {
  if (lenis) {
    lenis.raf(time);
  }
  // Subtle continuous rotation
  for (let i = 0; i < objects.length; i++) {
    objects[i].rotation.z += 0.002;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// ========== RESIZE HANDLING ==========
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  const maxRatio = isMobile ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));
  ScrollTrigger.refresh();
  // Recompute start positions to keep objects on screen after resize
  setStartPositions();
  seedMotionParams();
}
window.addEventListener('resize', onResize);

// ========== DOM REVEAL ANIMATIONS ==========
// Projects - cascading slide-in when work section enters viewport
(() => {
  const section = document.querySelector('.work');
  const items = document.querySelectorAll('.project-list .project');
  if (!section || !items.length) return;

  gsap.fromTo(items, {
    x: -50,
    opacity: 0,
    scale: 0.98,
    filter: 'blur(2px)'
  }, {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    duration: 0.7,
    ease: 'power2.out',
    stagger: {
      each: (isMobile ? 0.12 : 0.18),
      from: 'start'
    },
    scrollTrigger: {
      trigger: section,
      start: 'top 75%',
      once: true
    }
  });
})();

// Skills grid items - shorter stagger
(() => {
  const section = document.querySelector('.skills');
  const items = document.querySelectorAll('.skills .skill-item');
  if (!section || !items.length) return;

  gsap.fromTo(items, { x: -40, opacity: 0 }, {
    x: 0,
    opacity: 1,
    duration: 0.6,
    ease: 'power2.out',
    stagger: { each: (isMobile ? 0.08 : 0.12), from: 'start' },
    scrollTrigger: { trigger: section, start: 'top 80%', once: true }
  });
})();

// Contact elements - minimal stagger
(() => {
  const section = document.querySelector('.contact');
  const items = [
    section && section.querySelector('h2'),
    section && section.querySelector('.contact-button'),
    ...(section ? [...section.querySelectorAll('.social a')] : [])
  ].filter(Boolean);
  if (!section || !items.length) return;

  gsap.fromTo(items, { x: -40, opacity: 0 }, {
    x: 0,
    opacity: 1,
    duration: 0.6,
    ease: 'power2.out',
    stagger: { each: (isMobile ? 0.06 : 0.1), from: 'start' },
    scrollTrigger: { trigger: section, start: 'top 80%', once: true }
  });
})();


