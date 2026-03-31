import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js";

const state = {
    initialized: false,
    running: false,
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
    onPointerLeave: null
};

function isWebGLAvailable() {
    try {
        const canvas = document.createElement("canvas");
        return Boolean(
            canvas.getContext("webgl2") ||
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl")
        );
    } catch (_e) {
        return false;
    }
}

function setFallbackVisible(visible) {
    const fallback = document.getElementById("three-portal-fallback");
    if (!fallback) {
        return;
    }
    fallback.hidden = !visible;
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
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i += 1) {
        const radius = 1.15 + Math.random() * 1.7;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 1.6;

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
        sizes[i] = 0.6 + Math.random() * 1.3;
    }

    sparkGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    sparkGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

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
}

export function initThreePortal(containerEl) {
    if (!containerEl) {
        return false;
    }

    state.container = containerEl;

    if (!isWebGLAvailable()) {
        setFallbackVisible(true);
        return false;
    }

    setFallbackVisible(false);

    if (state.initialized) {
        resizeRendererToContainer();
        return true;
    }

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
    return true;
}

export function startThreePortal() {
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
}

export function disposeThreePortal() {
    stopThreePortal();

    if (!state.initialized) {
        return;
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

    state.initialized = false;
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.controls = null;
    state.container = null;
    state.portalGroup = null;
    state.particles = null;
    state.directionalLight = null;
}

window.initThreePortal = initThreePortal;
window.startThreePortal = startThreePortal;
window.stopThreePortal = stopThreePortal;
window.disposeThreePortal = disposeThreePortal;

window.addEventListener("beforeunload", () => {
    disposeThreePortal();
});
