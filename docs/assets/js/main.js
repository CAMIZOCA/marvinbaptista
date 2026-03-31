const WEB_PROJECT_FALLBACK_IMAGE = "assets/img/web/placeholder-web-project.svg";

const webProjects = [
    {
        title: "IonPacific Corporate Site",
        description: "A financial services website focused on venture capital, offering investment management and liquidity solutions for investors and the innovation economy.",
        tags: ["WordPress", "PHP", "Custom Theme"],
        image: "assets/img/web/ionpacific.jpg",
        liveUrl: "https://ionpacific.com/",
        repoUrl: ""
    },
    {
        title: "Telesing Platform",
        description: "A digital identity and communications platform that helps businesses verify users, prevent fraud, and engage customers through SMS, voice, and authentication APIs.",
        tags: ["WordPress", "API Integration"],
        image: "assets/img/web/telesing.jpg",
        liveUrl: "https://www.telesign.com/",
        repoUrl: ""
    },
    {
        title: "The sunset team",
        description: "A luxury real estate website showcasing high-end homes and expert buying, selling, and design services in Los Angeles.",
        tags: ["Wordpress", "mysql", "php"],
        image: "assets/img/web/sunset.jpg",
        liveUrl: "https://www.thesunsetteam.com/",
        repoUrl: ""
    },    
    {
        title: "Mitto Solutions",
        description: "An omnichannel communications platform that helps businesses connect with customers through SMS, voice, chat apps, and authentication solutions.",
        tags: ["React", "Node.js"],
        image: "assets/img/web/mitto.jpg",
        liveUrl: "https://mitto.ch/",
        repoUrl: ""
    },
    {
        title: "Un tesoro para mamá",
        description: "A website that sells DIY breast milk jewelry kits, helping moms turn a meaningful part of their breastfeeding journey into a lasting keepsake.",
        tags: ["Laravel", "php", "mysql", "stripe"],
        image: "assets/img/web/jewelry.jpg",
        liveUrl: "https://untesoroparamama.com/"
    },
    {
        title: "Optica Andina",
        description: "A family eye care and optical website in Quito, offering eye exams, contact lenses, eyewear, and personalized vision services.",
        tags: ["Laravel", "php", "mysql", "stripe"],
        image: "assets/img/web/optica.jpg",
        liveUrl: "https://opticaandina.com.ec/",
        repoUrl: "https://github.com/CAMIZOCA/OpticaAndina"
    },
    {
        title: "Recipe website",
        description: "A recipe website featuring authentic Latin American and Mediterranean dishes, with step-by-step cooking guides, chef tips, and cookbook recommendations.",
        tags: ["Laravel", "php", "mysql"],
        image: "assets/img/web/cookbook.jpg",
        liveUrl: "http://marvinbaptista.com/",
        repoUrl: "https://github.com/CAMIZOCA/marvinBaptistaRecipe"
    }
];

function renderWebPortfolioProjects() {
    const grid = document.getElementById("webPortfolioGrid");
    if (!grid) {
        return;
    }

    const cards = webProjects.map((project) => {
        const tagsMarkup = project.tags
            .map((tag) => `<span class="portfolio-tag">${tag}</span>`)
            .join("");

        const liveHref = project.liveUrl || "#contact";
        const liveText = "Visit Site";
        const liveExternalAttrs = project.liveUrl ? ' target="_blank" rel="noopener noreferrer"' : "";
        const githubLinkMarkup = project.repoUrl
            ? `<a href="${project.repoUrl}" class="portfolio-link secondary" target="_blank" rel="noopener noreferrer">GitHub</a>`
            : "";

        return `
            <article class="portfolio-item">
                <div class="portfolio-thumbnail">
                    <img
                        src="${project.image}"
                        alt="${project.title} screenshot"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='${WEB_PROJECT_FALLBACK_IMAGE}'"
                    >
                </div>
                <div class="portfolio-info">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <div class="portfolio-tags">${tagsMarkup}</div>
                    <div class="portfolio-links">
                        <a href="${liveHref}" class="portfolio-link"${liveExternalAttrs}>${liveText}</a>
                        ${githubLinkMarkup}
                    </div>
                </div>
            </article>
        `;
    }).join("");

    grid.innerHTML = cards;
}

renderWebPortfolioProjects();

function initProjectGalleryLinks() {
    const galleryItems = document.querySelectorAll(".carousel-item");
    if (!galleryItems.length) {
        return;
    }

    galleryItems.forEach((item) => {
        const gameUrl = (item.dataset.gameUrl || "").trim();
        const existingActions = item.querySelector(".carousel-actions");
        if (existingActions) {
            existingActions.remove();
        }

        if (!gameUrl) {
            return;
        }

        const actions = document.createElement("div");
        actions.className = "carousel-actions";

        const visitBtn = document.createElement("a");
        visitBtn.className = "carousel-visit-btn";
        visitBtn.href = gameUrl;
        visitBtn.target = "_blank";
        visitBtn.rel = "noopener noreferrer";
        visitBtn.textContent = "Visit";

        actions.appendChild(visitBtn);
        item.appendChild(actions);
    });
}

initProjectGalleryLinks();

let localThreeFallbackRaf = null;
let localThreeFallbackCanvas = null;
let localThreeFallbackCtx = null;
let localThreeFallbackParticles = [];

function setThreePortalDiagnostic(message) {
    const diagnostic = document.getElementById('three-portal-diagnostic');
    if (diagnostic) {
        diagnostic.textContent = message || '';
    }
}

function showThreePortalFallback() {
    const fallback = document.getElementById('three-portal-fallback');
    if (fallback) {
        fallback.hidden = false;
    }
}

function hideThreePortalFallback() {
    const fallback = document.getElementById('three-portal-fallback');
    if (fallback) {
        fallback.hidden = true;
    }
}

function stopLocalThreePortalFallback() {
    if (localThreeFallbackRaf) {
        cancelAnimationFrame(localThreeFallbackRaf);
        localThreeFallbackRaf = null;
    }

    if (localThreeFallbackCanvas && localThreeFallbackCanvas.parentNode) {
        localThreeFallbackCanvas.parentNode.removeChild(localThreeFallbackCanvas);
    }

    localThreeFallbackCanvas = null;
    localThreeFallbackCtx = null;
    localThreeFallbackParticles = [];
}

function drawLocalThreePortalFallbackFrame() {
    if (!localThreeFallbackCtx || !localThreeFallbackCanvas) {
        return;
    }

    const canvas = localThreeFallbackCanvas;
    const ctx = localThreeFallbackCtx;
    const width = canvas.width;
    const height = canvas.height;
    const t = performance.now() * 0.001;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.1, width * 0.5, height * 0.5, width * 0.6);
    gradient.addColorStop(0, 'rgba(0,255,136,0.08)');
    gradient.addColorStop(0.5, 'rgba(0,212,255,0.06)');
    gradient.addColorStop(1, 'rgba(13,17,23,0.96)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const radius = Math.min(width, height) * 0.22;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.35);
    ctx.strokeStyle = 'rgba(0,212,255,0.85)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,255,136,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (0.76 + Math.sin(t * 2) * 0.03), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < localThreeFallbackParticles.length; i += 1) {
        const p = localThreeFallbackParticles[i];
        p.angle += p.speed;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    localThreeFallbackRaf = requestAnimationFrame(drawLocalThreePortalFallbackFrame);
}

function startLocalThreePortalFallback(container) {
    if (!container) {
        return;
    }

    stopLocalThreePortalFallback();

    const width = Math.max(1, container.clientWidth || 720);
    const height = Math.max(1, container.clientHeight || 420);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }

    ctx.scale(dpr, dpr);

    localThreeFallbackCanvas = canvas;
    localThreeFallbackCtx = ctx;
    localThreeFallbackParticles = Array.from({ length: 120 }).map(() => ({
        angle: Math.random() * Math.PI * 2,
        radius: 65 + Math.random() * 155,
        speed: 0.002 + Math.random() * 0.004,
        size: 0.8 + Math.random() * 2.2,
        color: Math.random() > 0.5 ? 'rgba(0,255,136,0.72)' : 'rgba(0,212,255,0.72)'
    }));

    container.innerHTML = '';
    container.appendChild(canvas);
    localThreeFallbackRaf = requestAnimationFrame(drawLocalThreePortalFallbackFrame);
}

function showModuleLoadFallback(message) {
    const threeContainer = document.getElementById('three-portal-canvas');
    // Show a clear diagnostic so users understand file:// CORS/module issues.
    showThreePortalFallback();
    setThreePortalDiagnostic(message);
    startLocalThreePortalFallback(threeContainer);
}

function getThreePortalModuleUnavailableReason(isLoadingPhase) {
    if (window.__threeModulesBlockedByFileProtocol || window.location.protocol === 'file:') {
        return 'Local file mode (file://) blocks ES modules by browser CORS policy. Run a local server (for example: `cd docs && python -m http.server 5500`) or use GitHub Pages.';
    }
    if (window.__threePortalModuleError) {
        return 'CDN/module load error: failed to load Three.js module script.';
    }
    return isLoadingPhase
        ? 'CDN/module load error: Three.js module is still loading.'
        : 'CDN/module load error: Three.js API is unavailable.';
}

function setupThreePortalRetryButton() {
    const retryBtn = document.getElementById('three-portal-retry-btn');
    if (!retryBtn || retryBtn.dataset.bound === 'true') {
        return;
    }

    retryBtn.dataset.bound = 'true';
    retryBtn.addEventListener('click', function () {
        const threeContainer = document.getElementById('three-portal-canvas');
        stopLocalThreePortalFallback();

        if (typeof window.initThreePortal === 'function') {
            const initialized = window.initThreePortal(threeContainer);
            if (typeof window.startThreePortal === 'function') {
                window.startThreePortal();
            }
            if (initialized) {
                hideThreePortalFallback();
                setThreePortalDiagnostic('');
            }
            return;
        }

        showModuleLoadFallback(getThreePortalModuleUnavailableReason(false));
    });
}

setupThreePortalRetryButton();

function setThreeDoorDiagnostic(message) {
    const diagnostic = document.getElementById('three-door-diagnostic');
    if (diagnostic) {
        diagnostic.textContent = message || '';
    }
}

function showThreeDoorFallback() {
    const fallback = document.getElementById('three-door-fallback');
    if (fallback) {
        fallback.hidden = false;
    }
}

function hideThreeDoorFallback() {
    const fallback = document.getElementById('three-door-fallback');
    if (fallback) {
        fallback.hidden = true;
    }
}

function updateDoorToggleButton() {
    const btn = document.getElementById('three-door-toggle-btn');
    if (!btn || typeof window.getThreeDoorState !== 'function') {
        return;
    }

    const currentState = window.getThreeDoorState();
    btn.disabled = currentState === 'animating';

    if (currentState === 'open') {
        btn.textContent = 'Close Door';
    } else if (currentState === 'closed') {
        btn.textContent = 'Open Door';
    } else {
        btn.textContent = 'Animating...';
    }
}

function showDoorModuleLoadFallback(message) {
    showThreeDoorFallback();
    setThreeDoorDiagnostic(message);
    updateDoorToggleButton();
}

function getThreeDoorModuleUnavailableReason(isLoadingPhase) {
    if (window.__threeModulesBlockedByFileProtocol || window.location.protocol === 'file:') {
        return 'Local file mode (file://) blocks ES modules by browser CORS policy. Run a local server (for example: `cd docs && python -m http.server 5500`) or use GitHub Pages.';
    }
    if (window.__threeDoorModuleError) {
        return 'CDN/module load error: failed to load Three.js Door module.';
    }
    return isLoadingPhase
        ? 'CDN/module load error: Three.js Door module is still loading.'
        : 'CDN/module load error: Three.js Door API is unavailable.';
}

function setupThreeDoorControls() {
    const retryBtn = document.getElementById('three-door-retry-btn');
    if (retryBtn && retryBtn.dataset.bound !== 'true') {
        retryBtn.dataset.bound = 'true';
        retryBtn.addEventListener('click', function () {
            const doorContainer = document.getElementById('three-door-canvas');
            if (typeof window.initThreeDoor === 'function') {
                const initialized = window.initThreeDoor(doorContainer);
                if (typeof window.startThreeDoor === 'function') {
                    window.startThreeDoor();
                }
                if (initialized) {
                    hideThreeDoorFallback();
                    setThreeDoorDiagnostic('');
                }
                updateDoorToggleButton();
                return;
            }

            showDoorModuleLoadFallback(getThreeDoorModuleUnavailableReason(false));
        });
    }

    const toggleBtn = document.getElementById('three-door-toggle-btn');
    if (toggleBtn && toggleBtn.dataset.bound !== 'true') {
        toggleBtn.dataset.bound = 'true';
        toggleBtn.addEventListener('click', function () {
            if (typeof window.toggleThreeDoor === 'function') {
                window.toggleThreeDoor();
            }
            updateDoorToggleButton();
        });
    }

    updateDoorToggleButton();
}

setupThreeDoorControls();

window.addEventListener('three-door-state', function () {
    updateDoorToggleButton();
});

/* =============================================
   Interactive Demo Panels
   ============================================= */

function toggleDemo(panelId, triggerBtn) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const isOpen = panel.classList.contains('active');

    // Close all other open panels
    document.querySelectorAll('.demo-panel.active').forEach(function(p) {
        if (p.id !== panelId) {
            p.classList.remove('active');
            if (p.id === 'panel-threejs' && typeof window.stopThreePortal === 'function') {
                window.stopThreePortal();
            }
            if (p.id === 'panel-threejs') {
                stopLocalThreePortalFallback();
            }
            if (p.id === 'panel-threejs-door' && typeof window.stopThreeDoor === 'function') {
                window.stopThreeDoor();
            }
        }
    });

    panel.classList.toggle('active', !isOpen);

    if (!isOpen) {
        if (panelId === 'panel-perf' && window.Chart) initCharts();
        if (panelId === 'panel-ts' && window.Prism) Prism.highlightAll();
        if (panelId === 'panel-threejs') {
            const threeContainer = document.getElementById('three-portal-canvas');
            if (typeof window.initThreePortal === 'function') {
                const initialized = window.initThreePortal(threeContainer);
                if (typeof window.startThreePortal === 'function') {
                    window.startThreePortal();
                }
                // Hide the error overlay whether WebGL or canvas fallback is running —
                // the animation is already visible so the message is unnecessary.
                hideThreePortalFallback();
                setThreePortalDiagnostic('');
            } else {
                showModuleLoadFallback(getThreePortalModuleUnavailableReason(true));

                // Module script may still be loading; retry once shortly after opening the panel.
                setTimeout(function() {
                    if (typeof window.initThreePortal === 'function') {
                        stopLocalThreePortalFallback();
                        const initialized = window.initThreePortal(threeContainer);
                        if (typeof window.startThreePortal === 'function') {
                            window.startThreePortal();
                        }
                        hideThreePortalFallback();
                        setThreePortalDiagnostic('');
                    } else {
                        showModuleLoadFallback(getThreePortalModuleUnavailableReason(false));
                    }
                }, 250);
            }
        }
        if (panelId === 'panel-threejs-door') {
            const doorContainer = document.getElementById('three-door-canvas');
            setupThreeDoorControls();
            if (typeof window.initThreeDoor === 'function') {
                const initialized = window.initThreeDoor(doorContainer);
                if (typeof window.startThreeDoor === 'function') {
                    window.startThreeDoor();
                }
                if (initialized) {
                    hideThreeDoorFallback();
                    setThreeDoorDiagnostic('');
                }
                updateDoorToggleButton();
            } else {
                showDoorModuleLoadFallback(getThreeDoorModuleUnavailableReason(true));

                setTimeout(function() {
                    if (typeof window.initThreeDoor === 'function') {
                        const initialized = window.initThreeDoor(doorContainer);
                        if (typeof window.startThreeDoor === 'function') {
                            window.startThreeDoor();
                        }
                        if (initialized) {
                            hideThreeDoorFallback();
                            setThreeDoorDiagnostic('');
                        }
                        updateDoorToggleButton();
                    } else {
                        showDoorModuleLoadFallback(getThreeDoorModuleUnavailableReason(false));
                    }
                }, 250);
            }
        }
        setTimeout(function() {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    } else if (panelId === 'panel-threejs' && typeof window.stopThreePortal === 'function') {
        window.stopThreePortal();
        stopLocalThreePortalFallback();
    } else if (panelId === 'panel-threejs-door' && typeof window.stopThreeDoor === 'function') {
        window.stopThreeDoor();
    }
}

// ---- TypeScript Snippets ----

function showSnippet(index, tabEl) {
    document.querySelectorAll('#panel-ts .snippet-block').forEach(function(b) {
        b.classList.remove('active');
    });
    document.querySelectorAll('#panel-ts .snippet-tab').forEach(function(t) {
        t.classList.remove('active');
    });
    var block = document.getElementById('snippet-' + index);
    if (block) block.classList.add('active');
    if (tabEl) tabEl.classList.add('active');
    if (window.Prism) Prism.highlightAll();
}

function copySnippet(codeId, btn) {
    var el = document.getElementById(codeId);
    if (!el) return;
    var text = el.textContent;
    navigator.clipboard.writeText(text).then(function() {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function() {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
        }, 2000);
    });
}

// ---- Performance Dashboard ----

var chartsInitialized = false;

function initCharts() {
    if (chartsInitialized) return;
    chartsInitialized = true;

    var tickColor = '#9ca3b8';
    var gridColor = 'rgba(255,255,255,0.05)';
    var commonScales = {
        x: { ticks: { color: tickColor, font: { family: 'DM Sans' } }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor, font: { family: 'DM Sans' } }, grid: { color: gridColor } }
    };
    var legendOpts = { labels: { color: tickColor, font: { family: 'DM Sans' } } };

    new Chart(document.getElementById('chart-bar'), {
        type: 'bar',
        data: {
            labels: ['Action', 'Social', 'Puzzle', 'Sports', 'Horror', 'Trivia'],
            datasets: [{
                label: 'Active Players (K)',
                data: [219, 87, 43, 61, 29, 35],
                backgroundColor: [
                    'rgba(0,255,136,0.75)',
                    'rgba(0,212,255,0.75)',
                    'rgba(160,100,255,0.75)',
                    'rgba(0,255,136,0.5)',
                    'rgba(255,100,100,0.75)',
                    'rgba(0,212,255,0.5)'
                ],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: legendOpts },
            scales: commonScales
        }
    });

    var months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    new Chart(document.getElementById('chart-line'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Total Players (K)',
                data: [48, 62, 81, 95, 110, 128, 149, 163, 180, 194, 208, 219],
                borderColor: '#00ff88',
                backgroundColor: 'rgba(0,255,136,0.08)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00ff88',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: legendOpts },
            scales: commonScales
        }
    });
}

// ---- Code Playground ----

function runPlayground() {
    var output = document.getElementById('playground-output');
    var code = document.getElementById('playground-input').value;
    output.innerHTML = '';

    var logs = [];
    var fakeConsole = {
        log: function() {
            var args = Array.prototype.slice.call(arguments);
            logs.push({ type: 'log', text: args.map(String).join(' ') });
        },
        error: function() {
            var args = Array.prototype.slice.call(arguments);
            logs.push({ type: 'error', text: args.map(String).join(' ') });
        },
        warn: function() {
            var args = Array.prototype.slice.call(arguments);
            logs.push({ type: 'info', text: '[warn] ' + args.map(String).join(' ') });
        }
    };

    // Minimal TypeScript-to-JS stripping (demo only)
    var jsCode = code
        .replace(/interface\s+\w+\s*\{[^}]*\}/gs, '')
        .replace(/:\s*[A-Z][A-Za-z<>\[\]|,\s]*(?=[=,;)\n{])/g, '')
        .replace(/const\s+(\w+):\s*\w+(\[\])?/g, 'const $1')
        .replace(/let\s+(\w+):\s*\w+(\[\])?/g, 'let $1')
        .replace(/<[A-Za-z,\s]+>/g, '');

    try {
        var fn = new Function('console', jsCode);
        fn(fakeConsole);
        if (logs.length === 0) {
            output.innerHTML = '<span class="output-line info">// No output</span>';
        } else {
            logs.forEach(function(entry) {
                var line = document.createElement('span');
                line.className = 'output-line ' + entry.type;
                line.textContent = entry.type === 'log' ? entry.text : entry.text;
                output.appendChild(line);
            });
        }
    } catch (err) {
        var line = document.createElement('span');
        line.className = 'output-line error';
        line.textContent = 'Error: ' + err.message;
        output.appendChild(line);
    }
}

function clearPlayground() {
    document.getElementById('playground-output').innerHTML =
        '<span class="output-line info">// Cleared</span>';
}
