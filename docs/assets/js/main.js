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
        if (osElement) osElement.innerText = profileData.profile.tagline.split(' ')[0].toUpperCase(); // Just a fallback or use infrastructure
        
        // Better OS/Stack display:
        if (osElement && projectsData.metadata.operational_stack) {
            const env = projectsData.metadata.operational_stack.env;
            if (env && env.length >= 2) {
                osElement.innerText = `${env[0]} / ${env[1]}`.toUpperCase();
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
                const isPrivate = !project.github_url;
                const linkAction = isPrivate 
                    ? `onclick="showNotice('${project.id}')"` 
                    : `href="${project.github_url}" target="_blank"`;

                return `
                    <article class="project-card animate-fade-in">
                        <div class="project-header">
                            <span class="project-id">${String(index + 1).padStart(2, '0')}.</span>
                            <h3 class="project-title">${project.title}</h3>
                            <div class="project-cat">
                                <span>${project.category}</span>
                                <span class="status-badge">${project.status.label}</span>
                                <span class="project-date">DATE: ${project.environment.last_update}</span>
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

            const activeProjects = filteredProjects.filter(p => p.status.state === 'active');
            const legacyProjects = filteredProjects.filter(p => p.status.state === 'legacy');

            const labsSection = document.getElementById('labs');
            const archiveSection = document.getElementById('archive');

            if (labsSection) {
                if (activeProjects.length > 0) {
                    labsSection.style.display = 'block';
                    labsSection.classList.remove('section-reveal');
                    void labsSection.offsetWidth; 
                    labsSection.classList.add('section-reveal');
                    labsGrid.innerHTML = activeProjects.map(renderProject).join('');
                } else {
                    labsSection.style.display = 'none';
                }
            }

            if (archiveSection) {
                if (legacyProjects.length > 0) {
                    archiveSection.style.display = 'block';
                    archiveSection.classList.remove('section-reveal');
                    void archiveSection.offsetWidth;
                    archiveSection.classList.add('section-reveal');
                    archiveGrid.innerHTML = legacyProjects.map(renderProject).join('');
                } else {
                    archiveSection.style.display = 'none';
                }
            }

            // Update section counts dynamically and elegantly
            const activeHeader = document.querySelector('#labs .section-title');
            const archiveHeader = document.querySelector('#archive .section-title');
            
            if (activeHeader) {
                activeHeader.innerHTML = `ACTIVE LABS <span class="section-count">${activeProjects.length} ITEMS</span>`;
            }
            if (archiveHeader) {
                archiveHeader.innerHTML = `LEGACY ARCHIVE <span class="section-count">${legacyProjects.length} ITEMS</span>`;
            }
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

    } catch (error) {
        console.error("Critical System Error:", error);
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.innerText = "SYSTEM_OFFLINE";
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loadPortfolioData();
    initNavigation();
});

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

const showNotice = (id) => {
    if (id === '06') {
        const message = "Repositorio de arquitectura privada. Este proyecto funciona como el motor de gestión local bajo Fedora 43 y no está sujeto a distribución pública para preservar la seguridad de los metadatos de producción.";
        
        // Create notice element
        const notice = document.createElement('div');
        notice.className = 'security-notice animate-fade-in';
        notice.innerHTML = `
            <div class="notice-inner">
                <span class="notice-label">SECURITY_PROTOCOL_ALERT</span>
                <p class="notice-text">${message}</p>
                <button class="notice-close" onclick="this.parentElement.parentElement.remove()">ACKNOWLEDGE / CLOSE</button>
            </div>
        `;
        document.body.appendChild(notice);
    }
};

window.showNotice = showNotice; // Make it global for onclick