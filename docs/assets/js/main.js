const WEB_PROJECT_FALLBACK_IMAGE = "assets/img/web/placeholder-web-project.svg";

const webProjects = [
    {
        title: "IonPacific Corporate Site",
        description: "Custom WordPress solution with advanced integrations.",
        tags: ["WordPress", "PHP", "Custom Theme"],
        image: "assets/img/web/ionpacific.jpg",
        liveUrl: "https://ionpacific.com/",
        repoUrl: ""
    },
    {
        title: "Telesing Platform",
        description: "Enterprise communication platform.",
        tags: ["WordPress", "API Integration"],
        image: "assets/img/web/telesing.jpg",
        liveUrl: "https://www.telesign.com/",
        repoUrl: ""
    },
    {
        title: "Mitto Solutions",
        description: "Custom web application.",
        tags: ["React", "Node.js"],
        image: "assets/img/web/mitto.jpg",
        liveUrl: "",
        repoUrl: ""
    },
    {
        title: "Data Aggregation System",
        description: "Job posting aggregation platform (Neuvoo.ca).",
        tags: ["Node.js", "ElasticSearch", "RabbitMQ"],
        image: "assets/img/web/data-aggregation.jpg",
        liveUrl: "",
        repoUrl: ""
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
