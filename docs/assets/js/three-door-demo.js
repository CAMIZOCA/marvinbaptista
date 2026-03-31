import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DOOR_CLOSED_ANGLE = 0;
const DOOR_OPEN_ANGLE = -THREE.MathUtils.degToRad(95);

const state = {
    initialized: false,
    running: false,
    mode: "none",
    doorState: "closed",
    doorTargetState: "closed",
    rafId: null,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    container: null,
    clock: new THREE.Clock(),
    doorPivot: null,
    doorMesh: null,
    raycaster: new THREE.Raycaster(),
    pointerNdc: new THREE.Vector2(),
    disposeList: [],
    onResize: null,
    onPointerDown: null,
    onPointerMove: null,
    onPointerLeave: null,
    onKeyDown: null,
    fallbackCanvas: null,
    fallbackCtx: null,
    fallbackRafId: null,
    fallbackPhase: 0
};

function setFallbackVisible(visible) {
    const el = document.getElementById("three-door-fallback");
    if (el) {
        el.hidden = !visible;
    }
}

function setDiagnostic(text) {
    const el = document.getElementById("three-door-diagnostic");
    if (el) {
        el.textContent = text || "";
    }
}

function classifyError(stage, error) {
    const msg = (error && error.message ? error.message : String(error || "")).toLowerCase();
    if (stage === "module") {
        return "CDN/module load error";
    }
    if (msg.includes("webgl") || msg.includes("context") || msg.includes("gpu")) {
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

function emitDoorState() {
    window.dispatchEvent(new CustomEvent("three-door-state", {
        detail: { state: state.doorState }
    }));
}

function setDoorState(nextState) {
    if (state.doorState === nextState) {
        return;
    }
    state.doorState = nextState;
    emitDoorState();
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

function stopDoorCanvasFallback() {
    if (state.fallbackRafId) {
        cancelAnimationFrame(state.fallbackRafId);
        state.fallbackRafId = null;
    }

    if (state.fallbackCanvas && state.fallbackCanvas.parentNode) {
        state.fallbackCanvas.parentNode.removeChild(state.fallbackCanvas);
    }

    state.fallbackCanvas = null;
    state.fallbackCtx = null;
}

function drawDoorFallback() {
    if (!state.fallbackCtx || !state.fallbackCanvas) {
        return;
    }

    const canvas = state.fallbackCanvas;
    const ctx = state.fallbackCtx;
    const width = canvas.width;
    const height = canvas.height;

    state.fallbackPhase += 0.016;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "rgba(8, 16, 30, 1)");
    bg.addColorStop(1, "rgba(5, 10, 18, 1)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.58;
    const frameW = width * 0.18;
    const frameH = height * 0.52;

    ctx.strokeStyle = "rgba(0,255,136,0.65)";
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - frameW * 0.5, cy - frameH * 0.5, frameW, frameH);

    const openRatio = (Math.sin(state.fallbackPhase * 1.2) + 1) * 0.5;
    const doorW = frameW * (0.98 - openRatio * 0.68);
    const doorX = cx - frameW * 0.49;
    const doorY = cy - frameH * 0.49;

    ctx.fillStyle = "rgba(0,212,255,0.45)";
    ctx.fillRect(doorX, doorY, doorW, frameH * 0.98);

    ctx.fillStyle = "rgba(0,255,136,0.9)";
    ctx.beginPath();
    ctx.arc(doorX + doorW - 10, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    state.fallbackRafId = requestAnimationFrame(drawDoorFallback);
}

function startDoorCanvasFallback(containerEl) {
    if (!containerEl) {
        return;
    }

    stopDoorCanvasFallback();

    const width = Math.max(1, containerEl.clientWidth || 720);
    const height = Math.max(1, containerEl.clientHeight || 420);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return;
    }

    ctx.scale(dpr, dpr);

    state.fallbackCanvas = canvas;
    state.fallbackCtx = ctx;

    containerEl.innerHTML = "";
    containerEl.appendChild(canvas);
    state.fallbackRafId = requestAnimationFrame(drawDoorFallback);
}

function buildDoorScene() {
    const roomGroup = new THREE.Group();

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.8, metalness: 0.2 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.05;
    roomGroup.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x0f1826, roughness: 0.75, metalness: 0.15 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), wallMaterial);
    backWall.position.set(0, 1, -1.8);
    roomGroup.add(backWall);

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.25, metalness: 0.85 });
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.2), frameMaterial);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.2), frameMaterial);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.2), frameMaterial);

    frameLeft.position.set(-0.58, 0.15, -1.45);
    frameRight.position.set(0.58, 0.15, -1.45);
    frameTop.position.set(0, 1.29, -1.45);

    roomGroup.add(frameLeft);
    roomGroup.add(frameRight);
    roomGroup.add(frameTop);

    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.52, 0.15, -1.43);

    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x004b32,
        emissiveIntensity: 0.5,
        roughness: 0.35,
        metalness: 0.65
    });
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 2.24, 0.1), doorMaterial);
    doorMesh.position.set(0.51, 0, 0);
    doorMesh.userData.isDoorInteractive = true;

    const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf9fdff, roughness: 0.2, metalness: 0.95 })
    );
    handle.position.set(0.98, 0.05, 0.06);
    doorMesh.add(handle);

    doorPivot.add(doorMesh);
    roomGroup.add(doorPivot);

    state.doorPivot = doorPivot;
    state.doorMesh = doorMesh;
    state.scene.add(roomGroup);

    addDisposable(roomGroup);
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

function applyDoorAnimationStep(deltaSeconds) {
    if (!state.doorPivot) {
        return;
    }

    const targetAngle = state.doorTargetState === "open" ? DOOR_OPEN_ANGLE : DOOR_CLOSED_ANGLE;
    const current = state.doorPivot.rotation.y;
    const maxStep = Math.max(0.001, deltaSeconds * 2.8);
    const next = THREE.MathUtils.damp(current, targetAngle, 7.5, deltaSeconds);

    if (Math.abs(next - current) > maxStep) {
        state.doorPivot.rotation.y = current + Math.sign(next - current) * maxStep;
    } else {
        state.doorPivot.rotation.y = next;
    }

    if (Math.abs(state.doorPivot.rotation.y - targetAngle) < 0.01) {
        state.doorPivot.rotation.y = targetAngle;
        setDoorState(state.doorTargetState);
    } else {
        setDoorState("animating");
    }
}

function animate() {
    if (!state.running || !state.renderer || !state.scene || !state.camera) {
        return;
    }

    state.rafId = requestAnimationFrame(animate);

    try {
        const delta = Math.min(0.04, state.clock.getDelta());
        applyDoorAnimationStep(delta);

        if (state.controls) {
            state.controls.update();
        }

        state.renderer.render(state.scene, state.camera);
    } catch (error) {
        stopThreeDoor();
        setFallbackVisible(true);
        setDiagnostic(formatDiagnostic("runtime", error));
        startDoorCanvasFallback(state.container);
        state.mode = "canvas";
    }
}

function resetWebGLState() {
    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    if (state.container && state.onPointerDown) {
        state.container.removeEventListener("pointerdown", state.onPointerDown);
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
    if (state.onKeyDown) {
        window.removeEventListener("keydown", state.onKeyDown);
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
    state.doorPivot = null;
    state.doorMesh = null;
    state.running = false;
    state.initialized = false;
}

function toggleDoorTarget() {
    if (state.doorState === "animating") {
        return;
    }
    const shouldOpen = state.doorState === "closed";
    state.doorTargetState = shouldOpen ? "open" : "closed";
    setDoorState("animating");
}

function handleDoorPointer(event) {
    if (!state.container || !state.camera || !state.doorMesh || state.mode !== "webgl") {
        return;
    }

    const rect = state.container.getBoundingClientRect();
    if (!rect.width || !rect.height) {
        return;
    }

    state.pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    );

    state.raycaster.setFromCamera(state.pointerNdc, state.camera);
    const intersections = state.raycaster.intersectObject(state.doorMesh, true);
    if (intersections.length > 0) {
        toggleDoorTarget();
    }
}

export function initThreeDoor(containerEl) {
    if (!containerEl) {
        setDiagnostic("Renderer init failed: missing door container");
        return false;
    }

    state.container = containerEl;
    stopDoorCanvasFallback();
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
        scene.fog = new THREE.Fog(0x070b15, 4.8, 12);
        state.scene = scene;

        const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
        camera.position.set(1.6, 1.45, 3.9);
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
        renderer.toneMappingExposure = 1.05;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        state.renderer = renderer;

        containerEl.innerHTML = "";
        containerEl.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enablePan = false;
        controls.minDistance = 2.6;
        controls.maxDistance = 7.4;
        controls.minPolarAngle = 0.9;
        controls.maxPolarAngle = 1.8;
        controls.target.set(0, 0.55, -1.4);
        controls.update();
        state.controls = controls;

        const ambient = new THREE.AmbientLight(0x7cd7ff, 0.72);
        scene.add(ambient);
        addDisposable(ambient);

        const directional = new THREE.DirectionalLight(0x00ff88, 1.45);
        directional.position.set(2.4, 2.2, 2.8);
        scene.add(directional);
        addDisposable(directional);

        const fill = new THREE.DirectionalLight(0x00d4ff, 0.7);
        fill.position.set(-2.2, 1.2, 1.8);
        scene.add(fill);
        addDisposable(fill);

        buildDoorScene();

        state.onResize = () => {
            if (state.renderer) {
                state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
            }
            resizeRendererToContainer();
        };

        state.onPointerDown = handleDoorPointer;
        state.onPointerMove = () => {};
        state.onPointerLeave = () => {};

        state.onKeyDown = (event) => {
            if (event.key.toLowerCase() === "o") {
                toggleDoorTarget();
            }
        };

        window.addEventListener("resize", state.onResize);
        window.addEventListener("keydown", state.onKeyDown);
        containerEl.addEventListener("pointerdown", state.onPointerDown);

        state.doorTargetState = "closed";
        setDoorState("closed");
        state.mode = "webgl";
        state.initialized = true;
        resizeRendererToContainer();
        return true;
    } catch (error) {
        resetWebGLState();
        state.container = containerEl;
        state.mode = "canvas";
        setFallbackVisible(true);
        setDiagnostic(formatDiagnostic("renderer", error));
        startDoorCanvasFallback(containerEl);
        return false;
    }
}

export function startThreeDoor() {
    if (state.mode === "canvas") {
        if (state.container) {
            startDoorCanvasFallback(state.container);
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

export function stopThreeDoor() {
    state.running = false;
    if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }
    stopDoorCanvasFallback();
}

export function disposeThreeDoor() {
    stopThreeDoor();
    resetWebGLState();
    state.mode = "none";
    state.container = null;
    state.doorTargetState = "closed";
    setDoorState("closed");
}

export function toggleThreeDoor() {
    toggleDoorTarget();
}

export function getThreeDoorState() {
    return state.doorState;
}

window.initThreeDoor = initThreeDoor;
window.startThreeDoor = startThreeDoor;
window.stopThreeDoor = stopThreeDoor;
window.disposeThreeDoor = disposeThreeDoor;
window.toggleThreeDoor = toggleThreeDoor;
window.getThreeDoorState = getThreeDoorState;

window.addEventListener("beforeunload", () => {
    disposeThreeDoor();
});
