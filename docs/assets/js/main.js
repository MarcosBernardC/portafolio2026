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

            const renderProject = (project, index, prefix = "02.x") => {
                const url = project.links.https || "";
                const isPrivate = project.visibility === 'PRIVATE';
                const readmeUrl = !isPrivate && url.includes('github.com') 
                    ? url.replace('github.com', 'raw.githubusercontent.com') + '/main/README.md'
                    : null;

                const linkAction = isPrivate 
                    ? `onclick="showNotice('${project.title}', '${project.links.notice || ''}')"` 
                    : (readmeUrl 
                        ? `onclick="showReadme('${project.title}', '${readmeUrl}')" style="cursor: pointer;"` 
                        : `href="${url}" target="_blank"`);

                return `
                    <article class="project-card animate-fade-in ${isPrivate ? 'is-private' : ''}" tabindex="0">
                        <div class="project-header">
                            <span class="project-id">${prefix}.${index + 1}</span>
                            <h3 class="project-title">
                                ${project.title.length > 27 ? project.title.substring(0, 23) + '...' : project.title}
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
                .filter(p => p.status.state === 'ARCHIVE')
                .sort(sortByVisibility);

            const updateSection = (sectionId, gridId, countId, projects, prefix) => {
                const section = document.getElementById(sectionId);
                const grid = document.getElementById(gridId);
                const countSpan = document.getElementById(countId);
                if (!section || !grid) return;

                section.style.display = 'block'; // Always show
                
                if (projects.length > 0) {
                    grid.innerHTML = projects.map((p, i) => renderProject(p, i, prefix)).join('');
                    if (countSpan) countSpan.innerText = `${projects.length} ITEMS`;
                } else {
                    grid.innerHTML = `
                        <div class="empty-state animate-fade-in">
                            &gt; fish: No matches found for current query. Use [ALL] to reset scope.
                        </div>
                    `;
                    if (countSpan) countSpan.innerText = `0 ITEMS`;
                }
                
                // Trigger animation
                section.classList.remove('section-reveal');
                void section.offsetWidth;
                section.classList.add('section-reveal');
            };

            // 1. Determine DOM Order and Prefixes
            const container = document.getElementById('dynamic-sections-container');
            const labsSection = document.getElementById('labs');
            const archiveSection = document.getElementById('archive');
            
            let labsPrefix, archivePrefix;

            if (activeProjects.length === 0 && legacyProjects.length > 0) {
                container.insertBefore(archiveSection, labsSection);
                archivePrefix = "02.1";
                labsPrefix = "02.2";
            } else {
                container.insertBefore(labsSection, archiveSection);
                labsPrefix = "02.1";
                archivePrefix = "02.2";
            }

            // 2. Render sections with calculated prefixes
            updateSection('labs', 'labs-grid', 'labs-count', activeProjects, labsPrefix);
            updateSection('archive', 'archive-grid', 'archive-count', legacyProjects, archivePrefix);

            // 3. Final re-sequencing of header titles
            resequenceSections();

        };

        const resequenceSections = () => {
            // 1. Fixed Main Sections
            const summarySpan = document.querySelector('#summary .section-number');
            const codeSpan = document.querySelector('#code .section-number');
            const stackSpan = document.querySelector('#stack .section-number');
            
            if (summarySpan) summarySpan.innerText = "01";
            if (codeSpan) codeSpan.innerText = "02";
            if (stackSpan) stackSpan.innerText = "03";

            // 2. Sub-sections within CODE
            const subSections = [
                document.getElementById('labs'),
                document.getElementById('archive')
            ].sort((a, b) => {
                return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
            });

            let subIdx = 1;
            subSections.forEach(sec => {
                const span = sec.querySelector('.section-number');
                if (span) {
                    span.innerText = `02.${subIdx}`;
                    subIdx++;
                }
            });
        };

        // 3a. Update Domain Selector (No numbers as requested)
        // Removed dynamic counting of items on buttons

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
        const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';

        if (statusElement) {
            if (isLocal) {
                statusElement.innerText = 'LOCAL_DEV // OFFLINE';
            } else if (projectsData.metadata.last_sync) {
                statusElement.innerText = `SYNC_OK // ${projectsData.metadata.last_sync}`;
            }
        }

    } catch (error) {
        console.error("Critical System Error:", error);
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.innerText = "SYSTEM_OFFLINE";

        const statusElement = document.getElementById('footer-status');
        if (statusElement) statusElement.innerText = "SYSTEM_OFFLINE";
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    updateViewCounter(); // Inicia carga de visitas inmediatamente
    await loadPortfolioData();
    initNavigation();
    cleanupAnimations();
});

const updateViewCounter = () => {
    const counterElement = document.getElementById('footer-visits');
    if (!counterElement) return;

    const COUNTER_NS = 'mb-portfolio-2026-c8a2'; 
    const COUNTER_KEY = 'visits-v2026-rel';
    // Using a black badge as base for LaTeX style
    const BADGE_URL = `https://visitor-badge.laobi.icu/badge?page_id=${COUNTER_NS}.${COUNTER_KEY}&left_text=VISITS&left_color=000000&right_color=000000`;
    
    counterElement.innerHTML = `<img src="${BADGE_URL}" alt="VISITS" class="badge-latex">`;
};

// After entrance animations finish, neutralize them so they don't
// block the focus/opacity system from controlling section visibility.
const cleanupAnimations = () => {
    const animated = document.querySelectorAll('.section-reveal, .animate-reveal, .animate-fade-in');
    animated.forEach(el => {
        el.addEventListener('animationend', () => {
            el.classList.add('anim-done');
        }, { once: true });
    });
};

const initTheme = () => {
    const themeToggle = document.getElementById('theme-toggle');
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    
    // Light between 08:30 and 17:20. Dark otherwise.
    const isLightTime = mins >= (8 * 60 + 30) && mins < (17 * 60 + 20);
    const initialTheme = isLightTime ? 'light' : 'dark';
    
    // Apply theme based on time
    document.documentElement.setAttribute('data-theme', initialTheme);

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
    let current = '';
    
    // Set current date
    const dateElement = logo.querySelector('.logo-date');
    if (dateElement) {
        const updateTime = () => {
            const now = new Date();
            const d = String(now.getDate()).padStart(2, '0');
            const mo = String(now.getMonth() + 1).padStart(2, '0');
            const y = String(now.getFullYear()).slice(-2);
            const h = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const s = String(now.getSeconds()).padStart(2, '0');
            dateElement.innerHTML = `<span class="date-str">${d}.${mo}.${y}</span><span class="time-str">${h}:${min}:${s}</span>`;
        };
        updateTime();
        setInterval(updateTime, 1000);
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

    const handleScroll = () => {
        const scrollPos = window.pageYOffset;

        // Logo toggle logic
        if (scrollPos > 100) {
            logo.classList.add('scrolled');
        } else {
            logo.classList.remove('scrolled');
        }

        // Rigorous Centric Focus Logic
        const mainSections = document.querySelectorAll('.main-container > .section');
        let closestSection = null;
        let minDistance = Infinity;

        mainSections.forEach(section => {
            section.classList.remove('is-focused');
            const rect = section.getBoundingClientRect();
            const viewportCenter = window.innerHeight / 2;
            
            // Logic: Is the viewport center inside the section? (Better for tall mobile sections)
            const isIntersectingCenter = rect.top <= viewportCenter && rect.bottom >= viewportCenter;
            
            const sectionCenter = rect.top + rect.height / 2;
            const distance = Math.abs(viewportCenter - sectionCenter);

            if (isIntersectingCenter) {
                // If it intersects, it's a very strong candidate. 
                // We reduce the distance significantly to prioritize it.
                if (distance / 2 < minDistance) {
                    minDistance = distance / 2;
                    closestSection = section;
                }
            } else if (distance < minDistance) {
                minDistance = distance;
                closestSection = section;
            }
        });

        if (scrollPos < 50) { // More sensitive to top
            mainSections.forEach(s => s.classList.remove('is-focused'));
            const home = document.getElementById('home');
            if (home) {
                home.classList.add('is-focused');
                document.body.setAttribute('data-focus', 'home');
            }
            current = '';
        } else if (closestSection) {

            closestSection.classList.add('is-focused');
            document.body.setAttribute('data-focus', closestSection.id);
            current = closestSection.id === 'home' ? '' : closestSection.id;
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (current !== '' && (href.includes(current) || (href === '#code' && (current === 'labs' || current === 'archive')))) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call to set focus on load

    // Smooth scroll to top
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navLinksContainer = document.getElementById('nav-links');
    
    if (menuToggle && navLinksContainer) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinksContainer.classList.remove('active');
            });
        });
    }
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

// --- Inline resource renderer helpers ---
const RAW_TEXT_EXTENSIONS = [
    '.c', '.h', '.py', '.js', '.ts', '.md', '.txt', '.json', '.toml',
    '.sh', '.fish', '.asm', '.s', '.cfg', '.mk', '.makefile', '.yaml',
    '.yml', '.xml', '.html', '.css', '.tex', '.bib', '.ini', '.conf',
    '.env', '.gitignore', '.dockerfile', '.rs', '.go', '.java', '.cpp',
    '.hpp', '.rb', '.lua', '.zig', '.csv'
];

const isRawGithubUrl = (href) => href && href.includes('raw.githubusercontent.com');

const getFileExtension = (href) => {
    try {
        const pathname = new URL(href).pathname;
        const dot = pathname.lastIndexOf('.');
        return dot !== -1 ? pathname.substring(dot).toLowerCase() : '';
    } catch { return ''; }
};

const getLangFromExt = (ext) => {
    const map = {
        '.c': 'C', '.h': 'C Header', '.py': 'Python', '.js': 'JavaScript',
        '.ts': 'TypeScript', '.json': 'JSON', '.toml': 'TOML', '.sh': 'Shell',
        '.fish': 'Fish', '.asm': 'ASM', '.s': 'ASM', '.tex': 'LaTeX',
        '.yaml': 'YAML', '.yml': 'YAML', '.html': 'HTML', '.css': 'CSS',
        '.lua': 'Lua', '.rs': 'Rust', '.go': 'Go', '.java': 'Java',
        '.cpp': 'C++', '.hpp': 'C++ Header', '.md': 'Markdown'
    };
    return map[ext] || ext.replace('.', '').toUpperCase();
};

const escapeHtml = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderInlineResource = async (href, docsContainer) => {
    const ext = getFileExtension(href);
    const fileName = decodeURIComponent(href.split('/').pop());

    if (ext === '.pdf') {
        docsContainer.innerHTML = `
            <div class="inline-resource-header">
                <span class="resource-type-badge">PDF_VIEWER</span>
                <span class="resource-filename">${escapeHtml(fileName)}</span>
            </div>
            <div class="inline-code-loading">CARGANDO PDF...</div>
        `;
        try {
            const pdfRes = await fetch(href);
            if (!pdfRes.ok) throw new Error('PDF no disponible');
            const pdfBlob = await pdfRes.blob();
            const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));

            docsContainer.innerHTML = `
                <div class="inline-resource-header">
                    <span class="resource-type-badge">PDF_VIEWER</span>
                    <span class="resource-filename">${escapeHtml(fileName)}</span>
                </div>
                <iframe src="${blobUrl}" class="inline-pdf-viewer" title="${escapeHtml(fileName)}"></iframe>
                <div class="inline-resource-footer">
                    <a href="${href}" target="_blank" class="resource-external-link">
                        ABRIR EN NUEVA PESTAÑA <span>→</span>
                    </a>
                </div>
            `;
        } catch {
            docsContainer.innerHTML = `
                <div class="inline-resource-header">
                    <span class="resource-type-badge">PDF_VIEWER</span>
                    <span class="resource-filename">${escapeHtml(fileName)}</span>
                </div>
                <p class="inline-resource-error">ERROR: No se pudo cargar el PDF [${escapeHtml(fileName)}].</p>
                <div class="inline-resource-footer">
                    <a href="${href}" target="_blank" class="resource-external-link">
                        DESCARGAR PDF <span>→</span>
                    </a>
                </div>
            `;
        }
        return;
    }

    if (RAW_TEXT_EXTENSIONS.includes(ext)) {
        docsContainer.innerHTML = `
            <div class="inline-resource-header">
                <span class="resource-type-badge">${getLangFromExt(ext)}</span>
                <span class="resource-filename">${escapeHtml(fileName)}</span>
            </div>
            <div class="inline-code-loading">CARGANDO RECURSO...</div>
        `;
        try {
            const res = await fetch(href);
            if (!res.ok) throw new Error('Recurso no disponible');
            const code = await res.text();

            if (ext === '.md') {
                const baseUrl = href.substring(0, href.lastIndexOf('/') + 1);
                const corrected = code.replace(/!\[(.*?)\]\((?!http)(.*?)\)/g, (m, alt, path) => {
                    return `![${alt}](${baseUrl}${path})`;
                });
                docsContainer.innerHTML = `
                    <div class="inline-resource-header">
                        <span class="resource-type-badge">MARKDOWN</span>
                        <span class="resource-filename">${escapeHtml(fileName)}</span>
                    </div>
                    <div class="inline-md-content">${marked.parse(corrected)}</div>
                    <div class="inline-resource-footer">
                        <a href="${href}" target="_blank" class="resource-external-link">VER RAW <span>→</span></a>
                    </div>
                `;
            } else {
                docsContainer.innerHTML = `
                    <div class="inline-resource-header">
                        <span class="resource-type-badge">${getLangFromExt(ext)}</span>
                        <span class="resource-filename">${escapeHtml(fileName)}</span>
                    </div>
                    <pre class="inline-code-block"><code>${escapeHtml(code)}</code></pre>
                    <div class="inline-resource-footer">
                        <a href="${href}" target="_blank" class="resource-external-link">VER RAW <span>→</span></a>
                    </div>
                `;
            }
        } catch {
            docsContainer.innerHTML += `<p class="inline-resource-error">ERROR: No se pudo cargar el recurso [${escapeHtml(fileName)}].</p>`;
        }
        return;
    }

    // Unknown extension — open externally
    window.open(href, '_blank');
};

const attachInlineLinkHandlers = (docsContainer) => {
    docsContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        if (isRawGithubUrl(href)) {
            const ext = getFileExtension(href);
            if (ext === '.pdf' || RAW_TEXT_EXTENSIONS.includes(ext)) {
                e.preventDefault();
                renderInlineResource(href, docsContainer);
            }
        }
    });
};

const showReadme = async (title, url) => {
    if (document.querySelector('.docs-viewer')) return;

    const repoUrl = url.includes('raw.githubusercontent.com') ? url.replace('raw.githubusercontent.com', 'github.com').replace('/main/README.md', '') : null;
    
    const viewer = document.createElement('div');
    viewer.className = 'docs-viewer';
    viewer.innerHTML = `
        <div class="docs-inner">
            <div class="docs-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="docs-label">DOCS_VIEWER // ${title.toUpperCase()}</span>
                    ${repoUrl ? `<a href="${repoUrl}" target="_blank" style="color: var(--fg); opacity: 0.7; font-size: 0.65rem; text-decoration: none; border: 1px solid var(--border); padding: 2px 8px; font-family: var(--font-mono); transition: opacity 0.3s ease; cursor: pointer;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">VER EN GITHUB ↗</a>` : ''}
                </div>
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

        // Also fix relative links (not images) to point to raw GitHub
        text = text.replace(/(?<!!)\[(.*?)\]\((?!http)(.*?)\)/g, (match, label, path) => {
            return `[${label}](${baseUrl}${path})`;
        });

        let htmlContent = marked.parse(text);
        
        // Remove <p> wrappers from images to allow flex-row alignment
        htmlContent = htmlContent.replace(/<p>\s*((?:<a.*?>)?<img.*?>(\s*<\/a>)?)\s*<\/p>/g, '$1');

        const docsContainer = document.getElementById('docs-content');
        docsContainer.innerHTML = htmlContent;

        // Attach inline resource handlers for raw GitHub links
        attachInlineLinkHandlers(docsContainer);

        // Check if there are images and add repo link
        if (text.includes('![')) {
            const repoUrl = url.replace('raw.githubusercontent.com', 'github.com').replace('/main/README.md', '');
            const linkWrapper = document.createElement('div');
            linkWrapper.className = 'repo-link-wrapper animate-reveal';
            linkWrapper.innerHTML = `
                <a href="${repoUrl}" target="_blank" class="repo-link-btn">
                    VER EN REPOSITORIO ORIGINAL <span>→</span>
                </a>
            `;
            docsContainer.appendChild(linkWrapper);
        }
    } catch (err) {
        document.getElementById('docs-content').innerText = `ERROR: No se pudo obtener la documentación del proyecto [${title}].\n\nVerifica la conexión o accede directamente vía SRC // REPO.`;
    }
};

window.showNotice = showNotice;
window.showReadme = showReadme;