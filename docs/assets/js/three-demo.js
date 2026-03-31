import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js";

const state = {
    initialized: false,
    running: false,
    mode: "none",
    rafId: null,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    container: null,
    portalGroup: null,
    particles: null,
    directionalLight: null,
    clock: new THREE.Clock(),
    mouseTarget: new THREE.Vector2(0, 0),
    mouseCurrent: new THREE.Vector2(0, 0),
    disposeList: [],
    onResize: null,
    onPointerMove: null,
    onPointerLeave: null,
    runtimeCrashed: false,
    fallbackCanvas: null,
    fallbackCtx: null,
    fallbackRafId: null,
    fallbackParticles: []
};

function setFallbackVisible(visible) {
    const fallback = document.getElementById("three-portal-fallback");
    if (!fallback) {
        return;
    }
    fallback.hidden = !visible;
}

function setDiagnostic(text) {
    const diagnostic = document.getElementById("three-portal-diagnostic");
    if (!diagnostic) {
        return;
    }
    diagnostic.textContent = text || "";
}

function classifyError(stage, error) {
    const message = (error && error.message ? error.message : String(error || "")).toLowerCase();

    if (stage === "module") {
        return "CDN/module load error";
    }
    if (message.includes("webgl") || message.includes("context") || message.includes("gpu")) {
        return "WebGL context unavailable";
    }
    if (stage === "runtime") {
        return "Runtime render error";
    }
    return "Renderer init failed";
}

function formatDiagnostic(stage, error) {
    const kind = classifyError(stage, error);
    const details = error && error.message ? error.message : String(error || "Unknown error");
    return `${kind}: ${details}`;
}

function addDisposable(item) {
    state.disposeList.push(item);
}

function disposeObject3D(object) {
    if (!object) {
        return;
    }
    object.traverse((child) => {
        if (child.geometry) {
            child.geometry.dispose();
        }
        if (child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
            } else {
                child.material.dispose();
            }
        }
    });
}

function stopPortalCanvasFallback() {
    if (state.fallbackRafId) {
        cancelAnimationFrame(state.fallbackRafId);
        state.fallbackRafId = null;
    }

    if (state.fallbackCanvas && state.fallbackCanvas.parentNode) {
        state.fallbackCanvas.parentNode.removeChild(state.fallbackCanvas);
    }

    state.fallbackCanvas = null;
    state.fallbackCtx = null;
    state.fallbackParticles = [];
}

function drawFallbackFrame(timeMs) {
    if (!state.fallbackCtx || !state.fallbackCanvas) {
        return;
    }

    const canvas = state.fallbackCanvas;
    const ctx = state.fallbackCtx;
    const width = canvas.width;
    const height = canvas.height;
    const t = timeMs * 0.001;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        width * 0.08,
        width * 0.5,
        height * 0.5,
        width * 0.6
    );
    gradient.addColorStop(0, "rgba(0,255,136,0.12)");
    gradient.addColorStop(0.4, "rgba(0,212,255,0.08)");
    gradient.addColorStop(1, "rgba(7,11,21,0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const radius = Math.min(width, height) * 0.2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(t * 0.45);

    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0,212,255,0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,255,136,0.85)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * (0.72 + Math.sin(t * 2.2) * 0.03), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    for (let i = 0; i < state.fallbackParticles.length; i += 1) {
        const p = state.fallbackParticles[i];
        p.angle += p.speed;
        p.wobble += p.wobbleSpeed;

        const x = centerX + Math.cos(p.angle) * (p.radius + Math.sin(p.wobble) * 7);
        const y = centerY + Math.sin(p.angle) * (p.radius + Math.cos(p.wobble) * 5);

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    state.fallbackRafId = requestAnimationFrame(drawFallbackFrame);
}

function startPortalCanvasFallback(containerEl) {
    if (!containerEl) {
        return;
    }

    stopPortalCanvasFallback();

    const bounds = containerEl.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(bounds.width || containerEl.clientWidth || 720));
    const cssHeight = Math.max(1, Math.floor(bounds.height || containerEl.clientHeight || 420));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }

    ctx.scale(dpr, dpr);

    state.fallbackCanvas = canvas;
    state.fallbackCtx = ctx;
    state.fallbackParticles = Array.from({ length: 180 }).map(() => ({
        angle: Math.random() * Math.PI * 2,
        radius: 70 + Math.random() * 170,
        size: 0.8 + Math.random() * 2.4,
        speed: 0.002 + Math.random() * 0.006,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        color: Math.random() > 0.5 ? "rgba(0,255,136,0.72)" : "rgba(0,212,255,0.72)"
    }));

    containerEl.innerHTML = "";
    containerEl.appendChild(canvas);
    state.fallbackRafId = requestAnimationFrame(drawFallbackFrame);
}

function buildPortalScene() {
    const portalGroup = new THREE.Group();

    const ringGeometry = new THREE.TorusGeometry(1.3, 0.12, 28, 160);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#00d4ff"),
        emissive: new THREE.Color("#00ff88"),
        emissiveIntensity: 0.7,
        roughness: 0.28,
        metalness: 0.75
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI * 0.15;
    portalGroup.add(ring);

    const innerGeometry = new THREE.TorusGeometry(0.95, 0.04, 16, 120);
    const innerMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#00ff88"),
        transparent: true,
        opacity: 0.85
    });
    const innerRing = new THREE.Mesh(innerGeometry, innerMaterial);
    innerRing.rotation.x = -Math.PI * 0.1;
    portalGroup.add(innerRing);

    const coreGeometry = new THREE.CircleGeometry(0.78, 64);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#08111f"),
        transparent: true,
        opacity: 0.95
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.rotation.x = -Math.PI * 0.02;
    portalGroup.add(core);

    const sparkGeometry = new THREE.BufferGeometry();
    const particleCount = 1400;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i += 1) {
        const radius = 1.15 + Math.random() * 1.7;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 1.6;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    sparkGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const sparkMaterial = new THREE.PointsMaterial({
        color: new THREE.Color("#00ff88"),
        size: 0.03,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particles = new THREE.Points(sparkGeometry, sparkMaterial);
    portalGroup.add(particles);

    state.scene.add(portalGroup);
    state.portalGroup = portalGroup;
    state.particles = particles;

    addDisposable(portalGroup);
}

function resizeRendererToContainer() {
    if (!state.renderer || !state.camera || !state.container) {
        return;
    }

    const width = Math.max(1, state.container.clientWidth);
    const height = Math.max(1, state.container.clientHeight);
    state.renderer.setSize(width, height, false);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
}

function animate() {
    if (!state.running || !state.renderer || !state.scene || !state.camera) {
        return;
    }

    state.rafId = requestAnimationFrame(animate);

    try {
        const t = state.clock.getElapsedTime();
        state.mouseCurrent.lerp(state.mouseTarget, 0.07);

        if (state.portalGroup) {
            state.portalGroup.rotation.y += 0.0035;
            state.portalGroup.rotation.z = Math.sin(t * 0.45) * 0.03;
            const pulse = 1 + Math.sin(t * 2.2) * 0.035;
            state.portalGroup.scale.setScalar(pulse);
        }

        if (state.particles) {
            state.particles.rotation.y -= 0.0018;
            state.particles.rotation.x = Math.cos(t * 0.33) * 0.05;
            state.particles.material.opacity = 0.62 + Math.sin(t * 1.9) * 0.22;
        }

        if (state.directionalLight) {
            state.directionalLight.position.x = 2 + state.mouseCurrent.x * 1.9;
            state.directionalLight.position.y = 2.2 + state.mouseCurrent.y * 1.2;
        }

        if (state.controls) {
            state.controls.autoRotate = true;
            state.controls.autoRotateSpeed = 0.8;
            state.controls.update();
        }

        state.renderer.render(state.scene, state.camera);
    } catch (error) {
        state.runtimeCrashed = true;
        stopThreePortal();
        setFallbackVisible(true);
        setDiagnostic(formatDiagnostic("runtime", error));
        startPortalCanvasFallback(state.container);
        state.mode = "canvas";
    }
}

function resetWebGLState() {
    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    if (state.container && state.onPointerMove) {
        state.container.removeEventListener("pointermove", state.onPointerMove);
    }
    if (state.container && state.onPointerLeave) {
        state.container.removeEventListener("pointerleave", state.onPointerLeave);
    }
    if (state.onResize) {
        window.removeEventListener("resize", state.onResize);
    }

    if (state.controls) {
        state.controls.dispose();
    }

    state.disposeList.forEach((item) => {
        if (item && typeof item.dispose === "function") {
            item.dispose();
        } else {
            disposeObject3D(item);
        }
    });

    state.disposeList = [];

    if (state.renderer) {
        state.renderer.dispose();
    }

    if (state.container) {
        state.container.innerHTML = "";
    }

    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.controls = null;
    state.portalGroup = null;
    state.particles = null;
    state.directionalLight = null;
    state.onResize = null;
    state.onPointerMove = null;
    state.onPointerLeave = null;
    state.running = false;
    state.initialized = false;
}

export function initThreePortal(containerEl) {
    if (!containerEl) {
        setDiagnostic("Renderer init failed: missing container element");
        return false;
    }

    state.container = containerEl;
    state.runtimeCrashed = false;

    stopPortalCanvasFallback();
    setFallbackVisible(false);
    setDiagnostic("");

    if (state.initialized && state.mode === "webgl") {
        resizeRendererToContainer();
        return true;
    }

    resetWebGLState();
    state.container = containerEl;

    try {
        const scene = new THREE.Scene();
        scene.background = null;
        scene.fog = new THREE.Fog(0x070b15, 4.5, 11);
        state.scene = scene;

        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
        camera.position.set(0, 0.35, 4.2);
        state.camera = camera;

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });

        const gl = renderer.getContext();
        if (!gl) {
            throw new Error("WebGL context unavailable");
        }

        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        state.renderer = renderer;

        containerEl.innerHTML = "";
        containerEl.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.055;
        controls.minDistance = 2.6;
        controls.maxDistance = 6.5;
        controls.enablePan = false;
        state.controls = controls;

        const ambient = new THREE.AmbientLight(0x6fd4ff, 0.72);
        scene.add(ambient);
        addDisposable(ambient);

        const directional = new THREE.DirectionalLight(0x00ff88, 1.65);
        directional.position.set(2, 2.2, 2.8);
        scene.add(directional);
        state.directionalLight = directional;
        addDisposable(directional);

        buildPortalScene();

        state.onResize = () => {
            if (state.renderer) {
                state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
            }
            resizeRendererToContainer();
        };

        state.onPointerMove = (event) => {
            const rect = containerEl.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return;
            }
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
            state.mouseTarget.set(
                THREE.MathUtils.clamp(x, -1, 1),
                THREE.MathUtils.clamp(y, -1, 1)
            );
        };

        state.onPointerLeave = () => {
            state.mouseTarget.set(0, 0);
        };

        window.addEventListener("resize", state.onResize);
        containerEl.addEventListener("pointermove", state.onPointerMove);
        containerEl.addEventListener("pointerleave", state.onPointerLeave);

        resizeRendererToContainer();
        state.initialized = true;
        state.mode = "webgl";
        return true;
    } catch (error) {
        resetWebGLState();
        state.container = containerEl;
        state.mode = "canvas";
        setFallbackVisible(true);
        setDiagnostic(formatDiagnostic("renderer", error));
        startPortalCanvasFallback(containerEl);
        return false;
    }
}

export function startThreePortal() {
    if (state.mode === "canvas") {
        if (state.container) {
            startPortalCanvasFallback(state.container);
        }
        return;
    }

    if (!state.initialized || state.running) {
        return;
    }

    state.running = true;
    state.clock.start();
    animate();
}

export function stopThreePortal() {
    state.running = false;
    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }
    stopPortalCanvasFallback();
}

export function disposeThreePortal() {
    stopThreePortal();
    resetWebGLState();
    state.mode = "none";
    state.container = null;
}

window.initThreePortal = initThreePortal;
window.startThreePortal = startThreePortal;
window.stopThreePortal = stopThreePortal;
window.disposeThreePortal = disposeThreePortal;
window.startPortalCanvasFallback = startPortalCanvasFallback;
window.stopPortalCanvasFallback = stopPortalCanvasFallback;
window.setThreePortalDiagnostic = setDiagnostic;
window.classifyThreePortalError = classifyError;

window.addEventListener("beforeunload", () => {
    disposeThreePortal();
});
