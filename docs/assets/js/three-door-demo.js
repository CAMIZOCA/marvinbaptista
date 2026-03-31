import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DOOR_CLOSED_ANGLE = 0;
const DOOR_OPEN_ANGLE = -THREE.MathUtils.degToRad(95);
const OPEN_ANGLE_SPAN = Math.abs(DOOR_OPEN_ANGLE - DOOR_CLOSED_ANGLE) || 1;

const state = {
    initialized: false,
    running: false,
    mode: "none",
    doorState: "closed",
    doorTargetState: "closed",
    currentDoorAngle: DOOR_CLOSED_ANGLE,
    thermalRatio: 0,
    elapsedTime: 0,
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
    onKeyDown: null,
    environment: null,
    coldFlow: null,
    exteriorSnow: null,
    fallbackCanvas: null,
    fallbackCtx: null,
    fallbackRafId: null,
    fallbackLastFrameTs: 0,
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

function getDoorOpenRatio() {
    const ratio = Math.abs(state.currentDoorAngle - DOOR_CLOSED_ANGLE) / OPEN_ANGLE_SPAN;
    return THREE.MathUtils.clamp(ratio, 0, 1);
}

function updateThermalRatio(deltaSeconds) {
    const target = getDoorOpenRatio();
    state.thermalRatio = THREE.MathUtils.damp(state.thermalRatio, target, 4.6, deltaSeconds);
    if (Math.abs(state.thermalRatio - target) < 0.0025) {
        state.thermalRatio = target;
    }
}

function applyDoorAnimationStep(deltaSeconds) {
    const targetAngle = state.doorTargetState === "open" ? DOOR_OPEN_ANGLE : DOOR_CLOSED_ANGLE;
    const current = state.currentDoorAngle;
    const maxStep = Math.max(0.001, deltaSeconds * 2.8);
    const next = THREE.MathUtils.damp(current, targetAngle, 7.5, deltaSeconds);

    if (Math.abs(next - current) > maxStep) {
        state.currentDoorAngle = current + Math.sign(next - current) * maxStep;
    } else {
        state.currentDoorAngle = next;
    }

    if (state.doorPivot) {
        state.doorPivot.rotation.y = state.currentDoorAngle;
    }

    if (Math.abs(state.currentDoorAngle - targetAngle) < 0.01) {
        state.currentDoorAngle = targetAngle;
        if (state.doorPivot) {
            state.doorPivot.rotation.y = targetAngle;
        }
        setDoorState(state.doorTargetState);
    } else {
        setDoorState("animating");
    }
}

function createColdFlowSystem(parentGroup) {
    const count = 260;
    const positions = new Float32Array(count * 3);
    const seedA = new Float32Array(count);
    const seedB = new Float32Array(count);
    const speed = new Float32Array(count);
    const baseX = new Float32Array(count);
    const baseY = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
        baseX[i] = THREE.MathUtils.randFloat(-0.52, 0.52);
        baseY[i] = THREE.MathUtils.randFloat(-0.76, 1.24);
        seedA[i] = Math.random();
        seedB[i] = Math.random() * Math.PI * 2;
        speed[i] = THREE.MathUtils.randFloat(0.32, 1.18);

        const idx = i * 3;
        positions[idx + 0] = baseX[i];
        positions[idx + 1] = baseY[i];
        positions[idx + 2] = -1.82;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xbfeeff,
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    parentGroup.add(points);

    state.coldFlow = {
        positions,
        seedA,
        seedB,
        speed,
        baseX,
        baseY,
        points,
        geometry,
        material,
        count
    };
}

function createExteriorSnowSystem(parentGroup) {
    const count = 140;
    const positions = new Float32Array(count * 3);
    const velocity = new Float32Array(count);
    const sway = new Float32Array(count);
    const baseX = new Float32Array(count);
    const baseZ = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
        baseX[i] = THREE.MathUtils.randFloat(-1.8, 1.8);
        baseZ[i] = THREE.MathUtils.randFloat(-4.1, -2.15);
        velocity[i] = THREE.MathUtils.randFloat(0.22, 0.64);
        sway[i] = Math.random() * Math.PI * 2;

        const idx = i * 3;
        positions[idx + 0] = baseX[i];
        positions[idx + 1] = THREE.MathUtils.randFloat(-0.55, 2.3);
        positions[idx + 2] = baseZ[i];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xf6fbff,
        size: 0.05,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    parentGroup.add(points);

    state.exteriorSnow = {
        positions,
        velocity,
        sway,
        baseX,
        baseZ,
        geometry,
        material,
        count
    };
}

function updateColdFlowParticles(timeSec, coldRatio) {
    if (!state.coldFlow) {
        return;
    }

    const flow = state.coldFlow;
    const doorSwing = getDoorOpenRatio();
    const activeRatio = coldRatio * (0.35 + doorSwing * 0.65);
    const depthSpan = 2.7;

    flow.material.opacity = activeRatio < 0.03 ? 0 : 0.08 + activeRatio * 0.64;

    for (let i = 0; i < flow.count; i += 1) {
        const idx = i * 3;
        const cycle = (timeSec * flow.speed[i] + flow.seedA[i]) % 1;
        const progress = (cycle * (0.16 + activeRatio * 0.84)) % 1;
        const wave = Math.sin(timeSec * 4.4 + flow.seedB[i] + progress * 9.2);

        flow.positions[idx + 0] = flow.baseX[i] + wave * 0.12 * activeRatio;
        flow.positions[idx + 1] = flow.baseY[i] + Math.sin(timeSec * 2.3 + flow.seedB[i]) * 0.045;
        flow.positions[idx + 2] = -1.86 + depthSpan * progress;
    }

    flow.geometry.attributes.position.needsUpdate = true;
}

function updateExteriorSnow(deltaSeconds, timeSec) {
    if (!state.exteriorSnow) {
        return;
    }

    const snow = state.exteriorSnow;

    for (let i = 0; i < snow.count; i += 1) {
        const idx = i * 3;
        const y = snow.positions[idx + 1] - snow.velocity[i] * deltaSeconds;
        if (y < -0.65) {
            snow.positions[idx + 1] = 2.3;
        } else {
            snow.positions[idx + 1] = y;
        }

        snow.positions[idx + 0] = snow.baseX[i] + Math.sin(timeSec * 0.9 + snow.sway[i]) * 0.08;
        snow.positions[idx + 2] = snow.baseZ[i] + Math.sin(timeSec * 0.6 + snow.sway[i] * 0.6) * 0.05;
    }

    snow.geometry.attributes.position.needsUpdate = true;
}

function applyThermalAtmosphere() {
    if (!state.environment) {
        return;
    }

    const env = state.environment;
    const cold = state.thermalRatio;
    const cozy = 1 - cold;

    env.ambient.intensity = 0.35 + cozy * 0.43;
    env.coldKey.intensity = 0.25 + cold * 1.52;
    env.warmPoint.intensity = 0.18 + cozy * 1.58;
    env.outdoorSun.intensity = 0.66 + cold * 0.24;

    env.wallMat.color.copy(env.colors.wallCold).lerp(env.colors.wallWarm, cozy);
    env.floorMat.color.copy(env.colors.floorCold).lerp(env.colors.floorWarm, cozy);
    env.doorMat.emissive.copy(env.colors.doorCold).lerp(env.colors.doorWarm, cozy);
    env.doorMat.emissiveIntensity = 0.25 + cozy * 0.42;

    env.fogColor.copy(env.colors.fogCold).lerp(env.colors.fogWarm, cozy);
    state.scene.fog.color.copy(env.fogColor);

    if (state.renderer) {
        state.renderer.toneMappingExposure = 0.95 + cozy * 0.2 - cold * 0.06;
    }

    env.coldHaze.material.opacity = cold < 0.04 ? 0 : 0.06 + cold * 0.36;
    env.comfortGlow.material.opacity = 0.04 + cozy * 0.32;
}

function updateClimateEffects(deltaSeconds) {
    state.elapsedTime += deltaSeconds;
    applyThermalAtmosphere();
    updateColdFlowParticles(state.elapsedTime, state.thermalRatio);
    updateExteriorSnow(deltaSeconds, state.elapsedTime);
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
    state.fallbackLastFrameTs = 0;
}

function drawDoorFallback(timestamp) {
    if (!state.fallbackCtx || !state.fallbackCanvas) {
        return;
    }

    const canvas = state.fallbackCanvas;
    const ctx = state.fallbackCtx;
    const width = canvas.width;
    const height = canvas.height;

    const prevTs = state.fallbackLastFrameTs || timestamp;
    const delta = Math.min(0.04, Math.max(0.001, (timestamp - prevTs) / 1000));
    state.fallbackLastFrameTs = timestamp;

    state.fallbackPhase += delta;
    applyDoorAnimationStep(delta);
    updateThermalRatio(delta);

    const cold = state.thermalRatio;
    const cozy = 1 - cold;
    const openRatio = getDoorOpenRatio();

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#d6eaff");
    bg.addColorStop(0.58, "#7ea9d1");
    bg.addColorStop(1, "#152537");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.58;
    const frameW = width * 0.2;
    const frameH = height * 0.54;
    const frameX = cx - frameW * 0.5;
    const frameY = cy - frameH * 0.5;

    ctx.fillStyle = "rgba(230,244,255,0.9)";
    ctx.fillRect(frameX, frameY, frameW, frameH);

    ctx.fillStyle = "rgba(245,250,255,0.9)";
    ctx.fillRect(frameX - frameW * 1.7, cy + frameH * 0.5 - 12, frameW * 4.4, 20);

    for (let i = 0; i < 42; i += 1) {
        const sx = frameX - 8 + ((i * 23) % Math.max(60, width));
        const sy = frameY + (((i * 59) + state.fallbackPhase * 120) % Math.max(60, frameH));
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(sx, sy, 2, 2);
    }

    const doorW = frameW * (0.98 - openRatio * 0.73);
    const doorX = frameX + frameW * 0.01;
    const doorY = frameY + frameH * 0.01;

    ctx.fillStyle = "rgba(13,70,75,0.92)";
    ctx.fillRect(doorX, doorY, doorW, frameH * 0.98);

    ctx.strokeStyle = "rgba(70,236,255,0.72)";
    ctx.lineWidth = 3;
    ctx.strokeRect(frameX, frameY, frameW, frameH);

    ctx.fillStyle = "rgba(220,244,255,0.95)";
    ctx.beginPath();
    ctx.arc(doorX + doorW - 11, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    if (cold > 0.04) {
        const gustCount = Math.floor(8 + cold * 26);
        for (let i = 0; i < gustCount; i += 1) {
            const lane = i / Math.max(1, gustCount - 1);
            const y = frameY + 12 + lane * (frameH - 24);
            const phase = state.fallbackPhase * (2.6 + lane) + i * 0.7;
            const xStart = frameX + frameW * 0.5;
            const xEnd = xStart + 140 + cold * 130;
            const bend = Math.sin(phase) * (8 + cold * 20);

            ctx.strokeStyle = `rgba(185,233,255,${0.08 + cold * 0.28})`;
            ctx.lineWidth = 1.2 + cold * 1.6;
            ctx.beginPath();
            ctx.moveTo(xStart, y);
            ctx.quadraticCurveTo(xStart + 56, y + bend, xEnd, y + bend * 0.3);
            ctx.stroke();
        }
    }

    ctx.fillStyle = `rgba(255,185,110,${0.12 + cozy * 0.24})`;
    ctx.fillRect(0, cy - frameH * 0.6, width, frameH * 1.25);

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
    state.fallbackLastFrameTs = 0;

    containerEl.innerHTML = "";
    containerEl.appendChild(canvas);
    state.fallbackRafId = requestAnimationFrame(drawDoorFallback);
}

function buildDoorScene() {
    const roomGroup = new THREE.Group();

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x243242, roughness: 0.86, metalness: 0.08 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.04;
    roomGroup.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x22354b, roughness: 0.76, metalness: 0.12 });

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(2.41, 4, 0.14), wallMat);
    leftWall.position.set(-1.795, 1, -1.8);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2.41, 4, 0.14), wallMat);
    rightWall.position.set(1.795, 1, -1.8);

    const topWall = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.69, 0.14), wallMat);
    topWall.position.set(0, 2.155, -1.8);

    const threshold = new THREE.Mesh(
        new THREE.BoxGeometry(1.16, 0.08, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xd8e4ef, roughness: 0.4, metalness: 0.1 })
    );
    threshold.position.set(0, -1.0, -1.72);

    roomGroup.add(leftWall, rightWall, topWall, threshold);

    const outsideGroup = new THREE.Group();

    const sky = new THREE.Mesh(
        new THREE.PlaneGeometry(4.6, 3.4),
        new THREE.MeshBasicMaterial({ color: 0xd5e9ff })
    );
    sky.position.set(0, 0.55, -4.35);

    const exteriorGround = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 5),
        new THREE.MeshStandardMaterial({ color: 0xf2f8ff, roughness: 0.92, metalness: 0 })
    );
    exteriorGround.rotation.x = -Math.PI / 2;
    exteriorGround.position.set(0, -1.02, -3.3);

    const horizon = new THREE.Mesh(
        new THREE.PlaneGeometry(4.8, 0.9),
        new THREE.MeshBasicMaterial({ color: 0xb8d5f2, transparent: true, opacity: 0.85 })
    );
    horizon.position.set(0, -0.2, -4.2);

    outsideGroup.add(sky, exteriorGround, horizon);

    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x7ee9ff, roughness: 0.22, metalness: 0.84 });
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.42, 0.2), frameMaterial);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.42, 0.2), frameMaterial);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.12, 0.2), frameMaterial);

    frameLeft.position.set(-0.58, 0.15, -1.7);
    frameRight.position.set(0.58, 0.15, -1.7);
    frameTop.position.set(0, 1.3, -1.7);
    roomGroup.add(frameLeft, frameRight, frameTop);

    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.52, 0.15, -1.68);

    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f5460,
        emissive: 0x0f2f35,
        emissiveIntensity: 0.38,
        roughness: 0.42,
        metalness: 0.55
    });

    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 2.24, 0.08), doorMaterial);
    doorMesh.position.set(0.51, 0, 0);
    doorMesh.userData.isDoorInteractive = true;

    const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf7fbff, roughness: 0.16, metalness: 0.95 })
    );
    handle.position.set(0.98, 0.03, 0.05);
    doorMesh.add(handle);

    doorPivot.add(doorMesh);
    roomGroup.add(doorPivot);

    const coldHaze = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 2.2),
        new THREE.MeshBasicMaterial({
            color: 0xc8efff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        })
    );
    coldHaze.position.set(0.02, 0.2, -1.5);
    roomGroup.add(coldHaze);

    const comfortGlow = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 24, 24),
        new THREE.MeshBasicMaterial({
            color: 0xffc27d,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
    );
    comfortGlow.position.set(0.05, 0.18, -0.2);
    roomGroup.add(comfortGlow);

    createColdFlowSystem(roomGroup);
    createExteriorSnowSystem(outsideGroup);

    state.doorPivot = doorPivot;
    state.doorMesh = doorMesh;
    state.scene.add(roomGroup);
    state.scene.add(outsideGroup);

    state.environment = {
        ambient: null,
        coldKey: null,
        warmPoint: null,
        outdoorSun: null,
        wallMat,
        floorMat,
        doorMat: doorMaterial,
        coldHaze,
        comfortGlow,
        fogColor: new THREE.Color(0x1a2c40),
        colors: {
            wallCold: new THREE.Color(0x1f3348),
            wallWarm: new THREE.Color(0x3d332b),
            floorCold: new THREE.Color(0x223345),
            floorWarm: new THREE.Color(0x4f3b2e),
            doorCold: new THREE.Color(0x1b4f63),
            doorWarm: new THREE.Color(0x3a3626),
            fogCold: new THREE.Color(0x172a3f),
            fogWarm: new THREE.Color(0x2b2219)
        }
    };

    addDisposable(roomGroup);
    addDisposable(outsideGroup);
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
        const delta = Math.min(0.04, state.clock.getDelta());

        applyDoorAnimationStep(delta);
        updateThermalRatio(delta);
        updateClimateEffects(delta);

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
    state.environment = null;
    state.coldFlow = null;
    state.exteriorSnow = null;
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
    state.currentDoorAngle = DOOR_CLOSED_ANGLE;
    state.thermalRatio = 0;
    state.elapsedTime = 0;
    state.fallbackPhase = 0;

    try {
        const scene = new THREE.Scene();
        scene.background = null;
        scene.fog = new THREE.Fog(0x172a3f, 4.6, 12.2);
        state.scene = scene;

        const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
        camera.position.set(1.65, 1.48, 3.95);
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
        controls.maxDistance = 7.6;
        controls.minPolarAngle = 0.9;
        controls.maxPolarAngle = 1.82;
        controls.target.set(0, 0.55, -1.55);
        controls.update();
        state.controls = controls;

        const ambient = new THREE.AmbientLight(0xc5dff2, 0.64);
        scene.add(ambient);
        addDisposable(ambient);

        const coldKey = new THREE.DirectionalLight(0xbbe8ff, 0.75);
        coldKey.position.set(-0.7, 1.9, -2.3);
        scene.add(coldKey);
        addDisposable(coldKey);

        const warmPoint = new THREE.PointLight(0xffbd82, 1.2, 6.4, 1.7);
        warmPoint.position.set(0.15, 0.6, 0.75);
        scene.add(warmPoint);
        addDisposable(warmPoint);

        const outdoorSun = new THREE.DirectionalLight(0xe8f5ff, 0.82);
        outdoorSun.position.set(2.4, 3.2, -3.6);
        scene.add(outdoorSun);
        addDisposable(outdoorSun);

        buildDoorScene();

        if (state.environment) {
            state.environment.ambient = ambient;
            state.environment.coldKey = coldKey;
            state.environment.warmPoint = warmPoint;
            state.environment.outdoorSun = outdoorSun;
        }

        state.onResize = () => {
            if (state.renderer) {
                state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
            }
            resizeRendererToContainer();
        };

        state.onPointerDown = handleDoorPointer;

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
        applyThermalAtmosphere();
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
    state.clock.getDelta();
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
    state.currentDoorAngle = DOOR_CLOSED_ANGLE;
    state.thermalRatio = 0;
    state.elapsedTime = 0;
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
