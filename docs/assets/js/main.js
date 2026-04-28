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
        if (osElement && profileData.technical_stack.infrastructure.length > 0) {
            osElement.innerText = `${profileData.technical_stack.infrastructure[0]} / ${profileData.technical_stack.infrastructure[1]}`.toUpperCase();
        }

        // 2. Sync Bio (Executive Summary)
        if (bioElement) {
            bioElement.innerText = profileData.profile.tagline;
        }

        // 3. Inject Projects Function
        const renderProjects = (filterDomain = 'ALL') => {
            const labsGrid = document.getElementById('labs-grid');
            const archiveGrid = document.getElementById('archive-grid');

            const filteredProjects = filterDomain === 'ALL' 
                ? projectsData.projects 
                : projectsData.projects.filter(p => p.domain === filterDomain);

            const renderProject = (project) => {
                const isPrivate = !project.github_url;
                const linkAction = isPrivate 
                    ? `onclick="showNotice('${project.id}')"` 
                    : `href="${project.github_url}" target="_blank"`;

                return `
                    <article class="project-card animate-fade-in">
                        <div class="project-header">
                            <span class="project-id">${project.id}.</span>
                            <h3 class="project-title">${project.title}</h3>
                            <div class="project-cat">
                                <span>${project.category}</span>
                                <span class="status-badge">${project.status_label}</span>
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

            if (labsGrid) {
                const activeProjects = filteredProjects.filter(p => p.status === 'active');
                labsGrid.innerHTML = activeProjects.map(renderProject).join('');
            }

            if (archiveGrid) {
                const legacyProjects = filteredProjects.filter(p => p.status === 'legacy');
                archiveGrid.innerHTML = legacyProjects.map(renderProject).join('');
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
        const envStack = document.getElementById('stack-env');

        if (coreStack) coreStack.innerText = profileData.technical_stack.languages.join(' / ').toUpperCase();
        if (envStack) envStack.innerText = profileData.technical_stack.infrastructure.join(' / ').toUpperCase();

    } catch (error) {
        console.error("Critical System Error:", error);
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.innerText = "SYSTEM_OFFLINE";
    }
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
            if (link.getAttribute('href').includes(current) && current !== '') {
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

document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioData();
    initNavigation();
});