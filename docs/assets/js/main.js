const loadPortfolioData = async () => {
    try {
        // Fetch both profile and projects in parallel
        const [profileRes, projectsRes] = await Promise.all([
            fetch('./data/profile.json'),
            fetch('./data/projects.json')
        ]);

        if (!profileRes.ok || !projectsRes.ok) {
            throw new Error("Error loading data files.");
        }

        const profileData = await profileRes.json();
        const projectsData = await projectsRes.json();

        // 1. Sync Profile Identity (Hero Section)
        const nameElement = document.getElementById('main-title');
        const locationElement = document.getElementById('hero-location');
        const osElement = document.getElementById('hero-os');
        const bioElement = document.getElementById('bio-text');

        if (nameElement) nameElement.innerText = profileData.profile.name.toUpperCase();
        if (locationElement) locationElement.innerText = profileData.profile.location.toUpperCase();
        
        // Better OS/Stack display from projects data:
        if (osElement && projectsData.metadata.operational_stack) {
            const env = projectsData.metadata.operational_stack.env;
            if (env && env.length >= 2) {
                osElement.innerText = `${env[0]} / ${env[2] || env[1]}`.toUpperCase();
            }
        }

        // 2. Sync Bio (Executive Summary)
        if (bioElement) {
            bioElement.innerText = profileData.profile.tagline;
        }

        const pillarsGrid = document.getElementById('pillars-grid');
        if (pillarsGrid && profileData.profile.pillars) {
            pillarsGrid.innerHTML = profileData.profile.pillars.map(pillar => `
                <div class="pillar-item">
                    <h3 class="pillar-title">${pillar.title}</h3>
                    <p class="pillar-desc">${pillar.desc}</p>
                </div>
            `).join('');
        }

        // 3. Inject Projects Function
        const renderProjects = (filterDomain = 'ALL') => {
            const labsGrid = document.getElementById('labs-grid');
            const archiveGrid = document.getElementById('archive-grid');

            const filteredProjects = filterDomain === 'ALL' 
                ? projectsData.projects 
                : projectsData.projects.filter(p => p.domain.includes(filterDomain));

            const renderProject = (project, index) => {
                const url = project.links.https || "";
                const isPrivate = project.visibility === 'PRIVATE';
                const linkAction = isPrivate 
                    ? `onclick="showNotice('${project.title}', '${project.links.notice || ''}')"` 
                    : `href="${url}" target="_blank"`;
                
                const readmeUrl = !isPrivate && url.includes('github.com') 
                    ? url.replace('github.com', 'raw.githubusercontent.com') + '/main/README.md'
                    : null;

                return `
                    <article class="project-card animate-fade-in ${isPrivate ? 'is-private' : ''}">
                        <div class="project-header">
                            <span class="project-id">${String(index + 1).padStart(2, '0')}.</span>
                            <h3 class="project-title">
                                ${project.title}
                                ${readmeUrl ? `<span class="readme-trigger" onclick="showReadme('${project.title}', '${readmeUrl}')">[i]</span>` : ''}
                            </h3>
                            <div class="project-cat">
                                <span>${project.category}</span>
                                <span class="status-badge">${project.status.label}</span>
                                <span class="project-date">DATE: ${project.environment.last_update.split(' // ')[0]}</span>
                            </div>
                        </div>
                        <p class="project-desc">${project.description}</p>
                        <div class="project-footer">
                            <div class="project-stack">
                                <span class="stack-label">STACK: [</span>
                                <span class="stack-values">${project.stack.join(' // ')}</span>
                                <span class="stack-label">]</span>
                            </div>
                            <a ${linkAction} class="project-link-btn ${isPrivate ? 'private' : ''}">
                                ${isPrivate ? 'PRIV // ARCH' : 'SRC // REPO'} <span>→</span>
                            </a>
                        </div>
                    </article>
                `;
            };

            const sortByVisibility = (a, b) => {
                if (a.visibility === 'PUBLIC' && b.visibility === 'PRIVATE') return -1;
                if (a.visibility === 'PRIVATE' && b.visibility === 'PUBLIC') return 1;
                return 0;
            };

            const activeProjects = filteredProjects
                .filter(p => p.status.state === 'ACTIVE LABS')
                .sort(sortByVisibility);

            const legacyProjects = filteredProjects
                .filter(p => p.status.state === 'LEGACY ARCHIVE')
                .sort(sortByVisibility);

            const updateSection = (sectionId, gridId, projects) => {
                const section = document.getElementById(sectionId);
                const grid = document.getElementById(gridId);
                if (!section || !grid) return;

                if (projects.length > 0) {
                    section.style.display = 'block';
                    grid.innerHTML = projects.map(renderProject).join('');
                    
                    // Update or inject count
                    let countSpan = section.querySelector('.section-count');
                    if (!countSpan) {
                        const title = section.querySelector('.section-title');
                        if (title) {
                            title.innerHTML += ` <span class="section-count"></span>`;
                            countSpan = section.querySelector('.section-count');
                        }
                    }
                    if (countSpan) countSpan.innerText = `${projects.length} ITEMS`;
                    
                    // Trigger animation
                    section.classList.remove('section-reveal');
                    void section.offsetWidth;
                    section.classList.add('section-reveal');
                } else {
                    section.style.display = 'none';
                }
            };

            updateSection('labs', 'labs-grid', activeProjects);
            updateSection('archive', 'archive-grid', legacyProjects);
        };

        // Initial render
        renderProjects();

        // 4. Domain Selector Logic
        const domainButtons = document.querySelectorAll('.domain-btn');
        domainButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                domainButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderProjects(btn.dataset.domain);
            });
        });

        // 5. Update Operational Stack
        const coreStack = document.getElementById('stack-core');
        const edaStack = document.getElementById('stack-eda');
        const envStack = document.getElementById('stack-env');
        const docsStack = document.getElementById('stack-docs');

        const stack = projectsData.metadata.operational_stack;
        if (stack) {
            if (coreStack) coreStack.innerText = stack.core.join(' / ').toUpperCase();
            if (edaStack) edaStack.innerText = stack.eda_cad.join(' / ').toUpperCase();
            if (envStack) envStack.innerText = stack.env.join(' / ').toUpperCase();
            if (docsStack) docsStack.innerText = stack.docs.join(' / ').toUpperCase();
        }

        // 6. Sync Footer Status
        const statusElement = document.getElementById('footer-status');
        if (statusElement && projectsData.metadata.last_sync) {
            statusElement.innerText = `SYNC_OK // ${projectsData.metadata.last_sync}`;
        }

    } catch (error) {
        console.error("Critical System Error:", error);
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.innerText = "SYSTEM_OFFLINE";
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await loadPortfolioData();
    initNavigation();
});

const initTheme = () => {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('portfolio-theme') || 'light';
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('portfolio-theme', newTheme);
    });
};

const initNavigation = () => {
    const logo = document.getElementById('main-logo');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Set current date
    const dateElement = logo.querySelector('.logo-date');
    if (dateElement) {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = String(now.getFullYear()).slice(-2);
        dateElement.innerText = `${d}.${m}.${y}`;
    }

    // Explicitly handle nav links for smooth scroll and debugging
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPos = window.pageYOffset;

        // Logo toggle logic
        if (scrollPos > 100) {
            logo.classList.add('scrolled');
        } else {
            logo.classList.remove('scrolled');
        }

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollPos >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        if (scrollPos < 300) current = '';

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (current !== '' && (href.includes(current) || (href === '#code' && (current === 'labs' || current === 'archive')))) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scroll to top
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
};

const showNotice = (title, customNotice) => {
    if (document.querySelector('.security-notice')) return;

    const defaultMessage = `Repositorio de arquitectura privada o restringida. El proyecto [${title}] se encuentra bajo protocolos de seguridad interna y no está disponible para acceso público directo.`;
    const message = customNotice && customNotice !== 'undefined' ? customNotice : defaultMessage;
    
    const notice = document.createElement('div');
    notice.className = 'security-notice';
    notice.innerHTML = `
        <div class="notice-inner">
            <span class="notice-label">SECURITY_PROTOCOL_ALERT</span>
            <p class="notice-text">${message}</p>
            <button class="notice-close" id="close-notice-btn">ACKNOWLEDGE / CLOSE</button>
        </div>
    `;
    
    document.body.appendChild(notice);
    
    // Ensure the browser has painted the initial state
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            notice.classList.add('active');
        });
    });

    const closeBtn = notice.querySelector('#close-notice-btn');
    closeBtn.addEventListener('click', () => {
        notice.classList.remove('active');
        setTimeout(() => {
            notice.remove();
        }, 400); // Match CSS transition time
    });
};

const showReadme = async (title, url) => {
    if (document.querySelector('.docs-viewer')) return;

    const viewer = document.createElement('div');
    viewer.className = 'docs-viewer';
    viewer.innerHTML = `
        <div class="docs-inner">
            <div class="docs-header">
                <span class="docs-label">DOCS_VIEWER // ${title.toUpperCase()}</span>
                <button class="docs-close" id="close-docs-btn">EXIT (ESC)</button>
            </div>
            <div class="docs-body scroll-custom">
                <div id="docs-content">CARGANDO RECURSO...</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(viewer);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            viewer.classList.add('active');
        });
    });

    const closeBtn = viewer.querySelector('#close-docs-btn');
    const closeDocs = () => {
        viewer.classList.remove('active');
        setTimeout(() => viewer.remove(), 400);
    };

    closeBtn.addEventListener('click', closeDocs);
    window.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeDocs(); }, { once: true });

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Recurso no disponible");
        let text = await response.text();

        // Basic GitHub relative path correction for images
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
        text = text.replace(/!\[(.*?)\]\((?!http)(.*?)\)/g, (match, alt, path) => {
            return `![${alt}](${baseUrl}${path})`;
        });

        const htmlContent = marked.parse(text);
        document.getElementById('docs-content').innerHTML = htmlContent;
    } catch (err) {
        document.getElementById('docs-content').innerText = `ERROR: No se pudo obtener la documentación del proyecto [${title}].\n\nVerifica la conexión o accede directamente vía SRC // REPO.`;
    }
};

window.showNotice = showNotice;
window.showReadme = showReadme;