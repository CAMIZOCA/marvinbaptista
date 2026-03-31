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
        liveUrl: "https://opticaandina.com.ec/"
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
