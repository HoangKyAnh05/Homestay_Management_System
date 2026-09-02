/* ==========================================================================
   THREEUI 3D WEBGL AMBIENT ENGINE (60 FPS PERFORMANCE OPTIMIZED)
   Ultra-smooth Mountain Mist, Atmospheric Particles & Parallax Depth
   ========================================================================== */

export class KomorebiScene {
  constructor(canvasId) {
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!this.canvas) return;

    const THREE = window.THREE;
    if (!THREE) return;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();
    this.currentMood = 'night';
    this.scrollProgress = 0;
    this.scrollVelocity = 0;
    this.animationFrameId = null;
    this.isDestroyed = false;
    this.isPaused = false;

    this.onResizeHandler = () => this.onResize();
    this.onMouseMoveHandler = (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 1.5;
      this.mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 1.5;
    };
    this.onVisibilityHandler = () => {
      if (document.hidden) {
        this.isPaused = true;
        this.clock.stop();
      } else {
        this.isPaused = false;
        this.clock.start();
      }
    };

    this.init();
    this.createAtmosphere();
    this.createTerrain();
    this.createFireflies();
    this.bindEvents();
    this.animate();
  }

  init() {
    const THREE = window.THREE;
    // High-performance WebGL Renderer with capped pixelRatio
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false, // Turned off for massive FPS boost
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'mediump',
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

    // Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070b09, 0.025);

    // Camera
    this.camera = new THREE.PerspectiveCamera(48, this.width / this.height, 0.1, 50);
    this.camera.position.set(0, 1.8, 8);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x22362b, 2.2);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xaad0f0, 2.2);
    this.dirLight.position.set(6, 12, 6);
    this.scene.add(this.dirLight);

    // Warm Center Lantern Light
    this.lanternLight = new THREE.PointLight(0xf5cf9e, 3.0, 16, 1.5);
    this.lanternLight.position.set(0, 1.6, 3.2);
    this.scene.add(this.lanternLight);
  }

  createTerrain() {
    const THREE = window.THREE;
    // Optimized 32x32 resolution
    const geometry = new THREE.PlaneGeometry(36, 36, 32, 32);
    geometry.rotateX(-Math.PI / 2.15);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const elevation =
        Math.sin(x * 0.22) * 2.0 +
        Math.cos(y * 0.18) * 1.4 +
        Math.sin(x * 0.7 + y * 0.5) * 0.5;
      pos.setZ(i, elevation - 2.8);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x0e1712,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.position.set(0, -1.2, -5);
    this.scene.add(this.terrain);

    // Glowing Wireframe Crest
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x3e6852,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    this.terrainWire = new THREE.Mesh(geometry, wireMat);
    this.terrainWire.position.set(0, -1.18, -5);
    this.scene.add(this.terrainWire);
  }

  createAtmosphere() {
    const THREE = window.THREE;
    const mistGeo = new THREE.PlaneGeometry(28, 10);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x1d362a,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mistPlanes = [];
    for (let i = 0; i < 3; i++) {
      const mist = new THREE.Mesh(mistGeo, mistMat);
      mist.position.set(
        (i - 1) * 6,
        1.2 + i * 0.4,
        -4 - i * 3
      );
      this.mistPlanes.push(mist);
      this.scene.add(mist);
    }
  }

  createFireflies() {
    const THREE = window.THREE;
    const particleCount = 100; // Optimized particle count
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 6 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Glow canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 245, 210, 1)');
    gradient.addColorStop(0.3, 'rgba(245, 207, 158, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      color: 0xf5cf9e,
      size: 0.45,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setMood(mood) {
    this.currentMood = mood;
    const gsap = window.gsap;
    const duration = 1.0;

    if (!gsap) return;

    if (mood === 'night') {
      gsap.to(this.ambientLight.color, { r: 0.14, g: 0.21, b: 0.17, duration });
      gsap.to(this.dirLight.color, { r: 0.67, g: 0.82, b: 0.94, duration });
      gsap.to(this.lanternLight.color, { r: 0.96, g: 0.81, b: 0.62, duration });
      gsap.to(this.scene.fog.color, { r: 0.027, g: 0.043, b: 0.035, duration });
      if (this.particles) gsap.to(this.particles.material.color, { r: 0.96, g: 0.81, b: 0.62, duration });
    } else if (mood === 'sunset') {
      gsap.to(this.ambientLight.color, { r: 0.32, g: 0.16, b: 0.12, duration });
      gsap.to(this.dirLight.color, { r: 1.0, g: 0.55, b: 0.3, duration });
      gsap.to(this.lanternLight.color, { r: 1.0, g: 0.75, b: 0.42, duration });
      gsap.to(this.scene.fog.color, { r: 0.08, g: 0.04, b: 0.035, duration });
      if (this.particles) gsap.to(this.particles.material.color, { r: 1.0, g: 0.72, b: 0.35, duration });
    } else if (mood === 'dawn') {
      gsap.to(this.ambientLight.color, { r: 0.16, g: 0.26, b: 0.3, duration });
      gsap.to(this.dirLight.color, { r: 0.8, g: 0.95, b: 1.0, duration });
      gsap.to(this.lanternLight.color, { r: 0.7, g: 0.92, b: 0.95, duration });
      gsap.to(this.scene.fog.color, { r: 0.045, g: 0.075, b: 0.09, duration });
      if (this.particles) gsap.to(this.particles.material.color, { r: 0.7, g: 0.92, b: 0.95, duration });
    }
  }

  bindEvents() {
    window.addEventListener('resize', this.onResizeHandler, { passive: true });
    window.addEventListener('mousemove', this.onMouseMoveHandler, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibilityHandler);
  }

  onResize() {
    if (this.isDestroyed || !this.camera || !this.renderer) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  setScrollProgress(progress, velocity = 0) {
    this.scrollProgress = progress;
    this.scrollVelocity = velocity;
  }

  animate() {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.isPaused) return;

    // Pause rendering when scrolled far down the page to save 100% GPU
    if (window.scrollY > window.innerHeight * 2.2) return;

    const time = this.clock.getElapsedTime();

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Camera 3D Scroll
    if (this.camera) {
      this.camera.position.x = this.mouse.x * 0.7;
      this.camera.position.y = 1.8 - this.scrollProgress * 1.8 + this.mouse.y * 0.4;
      this.camera.position.z = 8.0 - this.scrollProgress * 2.5;
      this.camera.lookAt(0, 0.5 - this.scrollProgress * 0.5, 0);
    }

    // Drifting Mist
    if (this.mistPlanes) {
      this.mistPlanes.forEach((mist, i) => {
        mist.position.x += Math.sin(time * 0.2 + i) * 0.002;
      });
    }

    // Particle Group Gentle Float (GPU friendly: no array updates per frame)
    if (this.particles) {
      this.particles.rotation.y = time * 0.03 + this.mouse.x * 0.05;
      this.particles.position.y = Math.sin(time * 0.5) * 0.2;
    }

    // Lantern warm flicker
    if (this.lanternLight) {
      this.lanternLight.intensity = 3.0 + Math.sin(time * 3.0) * 0.3;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResizeHandler);
    window.removeEventListener('mousemove', this.onMouseMoveHandler);
    document.removeEventListener('visibilitychange', this.onVisibilityHandler);

    if (this.renderer) {
      try {
        this.renderer.dispose();
      } catch (e) {}
    }
  }
}
