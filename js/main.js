/**
 * MAESTRI SRL - Main JavaScript
 * UI Interactions and Common Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();
    initHeaderScroll();
    initSmoothScroll();
    initBackToTop();
    initDropdowns();
    initCookieBanner();
    initLazyLoading();
    initWhatsAppFloat();
    initFormValidation();
    initAccordions();
    initTabs();
    initToasts();
});

/**
 * Mobile Menu Toggle — Sidebar laterale
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    if (!menuToggle || !nav) return;

    // Crea overlay
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('nav-overlay');
        document.body.appendChild(overlay);
    }

    // Crea brand dentro sidebar
    if (!nav.querySelector('.sidebar-brand')) {
        const brand = document.createElement('div');
        brand.classList.add('sidebar-brand');
        const logoImg = document.querySelector('.logo img');
        if (logoImg) {
            brand.innerHTML = `<img src="${logoImg.src}" alt="Maestri Srl"><span class="sidebar-brand-text">MAESTRI</span>`;
        } else {
            brand.innerHTML = `<span class="sidebar-brand-text">MAESTRI</span>`;
        }
        nav.insertBefore(brand, nav.firstChild);
    }

    // Crea pulsante chiusura
    if (!nav.querySelector('.sidebar-close')) {
        const closeBtn = document.createElement('button');
        closeBtn.classList.add('sidebar-close');
        closeBtn.setAttribute('aria-label', 'Chiudi menu');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        nav.insertBefore(closeBtn, nav.firstChild);

        closeBtn.addEventListener('click', closeSidebar);
    }

    // Crea link Area Riservata in fondo alla sidebar
    if (!nav.querySelector('.sidebar-auth')) {
        const authLink = document.querySelector('.header .auth-link');
        if (authLink) {
            const sidebarAuth = document.createElement('a');
            sidebarAuth.classList.add('sidebar-auth');
            sidebarAuth.href = authLink.href;
            sidebarAuth.innerHTML = '<i class="fas fa-lock"></i> Area Riservata';
            nav.appendChild(sidebarAuth);
        }
    }

    function openSidebar() {
        nav.classList.add('active');
        overlay.classList.add('active');
        menuToggle.classList.add('active');
        document.body.classList.add('menu-open');

        // Animate hamburger to X
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    }

    function closeSidebar() {
        nav.classList.remove('active');
        overlay.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.classList.remove('menu-open');

        // Reset hamburger
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
    }

    menuToggle.addEventListener('click', function() {
        if (nav.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    // Chiudi cliccando sull'overlay
    overlay.addEventListener('click', closeSidebar);

    // Chiudi con tasto Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav.classList.contains('active')) {
            closeSidebar();
        }
    });

    // Chiudi quando si clicca un link (navigazione)
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });
}

/**
 * Header scroll effect
 */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide/show header on scroll (optional)
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    });
}

/**
 * Smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Back to top button
 */
function initBackToTop() {
    const backToTop = document.querySelector('.back-to-top');
    if (!backToTop) return;

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Dropdown menu handling (mobile)
 */
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');

        if (toggle) {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });
}

/**
 * Cookie banner
 */
function initCookieBanner() {
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;

    // Check if user already accepted
    if (!localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            banner.classList.add('visible');
        }, 1000);
    }

    const acceptBtn = banner.querySelector('.cookie-accept');
    const declineBtn = banner.querySelector('.cookie-decline');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            banner.classList.remove('visible');
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'false');
            banner.classList.remove('visible');
        });
    }
}

/**
 * Lazy loading images
 */
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for older browsers
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
        });
    }
}

/**
 * WhatsApp float button
 */
function initWhatsAppFloat() {
    const whatsappBtn = document.querySelector('.whatsapp-float');
    if (!whatsappBtn) return;

    // Predefined message
    const message = encodeURIComponent('Ciao, vorrei maggiori informazioni sui vostri prodotti.');
    whatsappBtn.href = `https://wa.me/393498393463?text=${message}`;
}

/**
 * Form validation
 */
function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');

    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                const formGroup = field.closest('.form-group');

                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');

                    if (formGroup) {
                        let errorMsg = formGroup.querySelector('.error-message');
                        if (!errorMsg) {
                            errorMsg = document.createElement('span');
                            errorMsg.className = 'error-message';
                            errorMsg.style.color = 'var(--error)';
                            errorMsg.style.fontSize = '0.85rem';
                            errorMsg.style.marginTop = '0.25rem';
                            errorMsg.style.display = 'block';
                            formGroup.appendChild(errorMsg);
                        }
                        errorMsg.textContent = 'Questo campo è obbligatorio';
                    }
                } else {
                    field.classList.remove('error');
                    const formGroup = field.closest('.form-group');
                    if (formGroup) {
                        const errorMsg = formGroup.querySelector('.error-message');
                        if (errorMsg) errorMsg.remove();
                    }
                }
            });

            // Email validation
            const emailFields = form.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (field.value && !emailRegex.test(field.value)) {
                    isValid = false;
                    field.classList.add('error');
                    showToast('error', 'Errore', 'Inserisci un indirizzo email valido');
                }
            });

            if (!isValid) {
                e.preventDefault();
            }
        });
    });
}

/**
 * Accordion functionality
 */
function initAccordions() {
    const accordions = document.querySelectorAll('.accordion');

    accordions.forEach(accordion => {
        const items = accordion.querySelectorAll('.accordion-item');

        items.forEach(item => {
            const header = item.querySelector('.accordion-header');

            header.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all items (optional - for single-open behavior)
                // items.forEach(i => i.classList.remove('active'));

                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                } else {
                    item.classList.add('active');
                }
            });
        });
    });
}

/**
 * Tabs functionality
 */
function initTabs() {
    const tabContainers = document.querySelectorAll('.tabs');

    tabContainers.forEach(container => {
        const buttons = container.querySelectorAll('.tab-btn');
        const panels = container.querySelectorAll('.tab-panel');

        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Remove active from all
                buttons.forEach(b => b.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));

                // Add active to current
                btn.classList.add('active');
                if (panels[index]) {
                    panels[index].classList.add('active');
                }
            });
        });
    });
}

/**
 * Toast notifications
 */
function initToasts() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

/**
 * Show toast notification
 * @param {string} type - success, error, warning, info
 * @param {string} title
 * @param {string} message
 */
function showToast(type, title, message) {
    const container = document.querySelector('.toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    toast.innerHTML = `
        <i class="fas fa-${iconMap[type]} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Modal functionality
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking overlay
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

/**
 * Search functionality
 */
function initSearch(inputSelector, itemsSelector, searchKey) {
    const searchInput = document.querySelector(inputSelector);
    const items = document.querySelectorAll(itemsSelector);

    if (!searchInput || !items.length) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();

        items.forEach(item => {
            const text = searchKey ?
                item.querySelector(searchKey)?.textContent.toLowerCase() :
                item.textContent.toLowerCase();

            if (text.includes(query)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

/**
 * Filter functionality
 */
function initFilter(filterSelector, itemsSelector, filterKey) {
    const filters = document.querySelectorAll(filterSelector);
    const items = document.querySelectorAll(itemsSelector);

    if (!filters.length || !items.length) return;

    filters.forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.dataset.filter;

            // Update active state
            filters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');

            // Filter items
            items.forEach(item => {
                if (category === 'all' || item.dataset.category === category) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Loading overlay
 */
function showLoading(message = 'Caricamento...') {
    let overlay = document.querySelector('.loading-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    overlay.querySelector('.loading-text').textContent = message;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(date, options = {}) {
    const d = new Date(date);
    const defaultOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    };

    return d.toLocaleDateString('it-IT', { ...defaultOptions, ...options });
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Resolve asset path for root pages and /pages/* routes.
 */
function resolveAssetPath(assetPath) {
    if (!assetPath || typeof assetPath !== 'string') return assetPath;

    const path = assetPath.trim();

    // Already absolute URL/data/blob
    if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }

    // Already explicitly relative from /pages/*
    if (path.startsWith('../') || path.startsWith('./')) {
        return path;
    }

    // Keep absolute-from-root paths unchanged
    if (path.startsWith('/')) {
        return path;
    }

    const isPagesRoute = window.location.pathname.includes('/pages/');
    if (isPagesRoute && path.startsWith('assets/')) {
        return `../${path}`;
    }

    return path;
}

// Export functions for use in other scripts
window.MaestriUtils = {
    showToast,
    openModal,
    closeModal,
    showLoading,
    hideLoading,
    formatCurrency,
    formatDate,
    debounce,
    throttle,
    resolveAssetPath,
    initSearch,
    initFilter
};

// Global alias for inline templates/pages
window.resolveAssetPath = resolveAssetPath;
