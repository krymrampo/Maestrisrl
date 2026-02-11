/**
 * MAESTRI SRL - Catalog Management
 * Gestione prodotti e cataloghi
 */

// Stato del catalogo
let productsData = [];
let categoriesData = [];
let currentCategory = null;
let currentFilter = 'all';
let currentComponentFilter = 'all';
let searchQuery = '';
const resolveImagePath = (path) =>
    (window.resolveAssetPath ? window.resolveAssetPath(path) : path);
const COMPONENT_FILTERS = [
    { id: 'pompe', label: 'Pompe', icon: 'fa-water', pattern: /\bpomp/i },
    { id: 'elettropompe', label: 'Elettropompe', icon: 'fa-bolt', pattern: /elettropomp/i },
    { id: 'pistole', label: 'Pistole', icon: 'fa-hand-pointer', pattern: /pistol|spout/i },
    { id: 'siringhe', label: 'Siringhe/Ingrassatori', icon: 'fa-syringe', pattern: /siringh|ingrassat|aeropulsometr/i },
    { id: 'contalitri', label: 'Contalitri', icon: 'fa-gauge-high', pattern: /contalitri|misurator/i },
    { id: 'tubi', label: 'Tubi', icon: 'fa-wave-square', pattern: /\btub[io]\b|manichett|spiralat/i },
    { id: 'serbatoi', label: 'Serbatoi/Tank', icon: 'fa-database', pattern: /serbato|tank|cisterna|fust/i },
    { id: 'filtri', label: 'Filtri/Valvole', icon: 'fa-filter', pattern: /filtr|valvol|by[- ]?pass/i },
    { id: 'accessori', label: 'Accessori', icon: 'fa-screwdriver-wrench', pattern: /accessori|raccord|adattator|ricambi/i }
];
const TECHNICAL_DRAWINGS = {
    'LV-001': ['assets/uploads/2019/05/misure-AIR110-ADB.jpg'],
    'LV-002': ['assets/uploads/2019/05/misure-AIR170-ADB.jpg'],
    'LV-003': ['assets/uploads/2019/05/misure-AIR20.jpg'],
    'LV-004': ['assets/uploads/2019/05/misureair55.jpg'],
    'UR-005': ['assets/uploads/2017/02/dimensioni-930.jpg'],
    'UR-006': [
        'assets/uploads/2017/04/utman.jpg',
        'assets/uploads/2017/04/utaut.jpg',
        'assets/uploads/2017/04/utpro.jpg'
    ],
    'UR-007': ['assets/uploads/2017/04/BLUETMIS.jpg'],
    'UR-008': ['assets/uploads/2017/04/BLUETMIS220.jpg'],
    'UR-009': ['assets/uploads/2017/04/BLUETMIS220.jpg'],
    'UR-010': ['assets/uploads/2017/04/BLUETMIs430.jpg'],
    'UR-011': ['assets/uploads/2017/04/BLUETMIs430.jpg'],
    'UR-014': ['assets/uploads/2022/05/misure.png'],
    'UR-022': ['assets/uploads/2023/03/UREA-FILTER-A.png'],
    'UR-026': ['assets/uploads/2024/11/SommersaUrea.jpg']
};

/**
 * Inizializzazione catalogo
 */
document.addEventListener('DOMContentLoaded', function() {
    initCatalog();
    initProductSearch();
    initCategorySidebar();
});

/**
 * Inizializza il catalogo
 */
async function initCatalog() {
    const catalogContainer = document.getElementById('products-grid');
    if (!catalogContainer) return;

    try {
        showLoading(true);

        const data = await loadProductsData();
        productsData = data.prodotti || [];
        categoriesData = data.categorie || [];

        // Determina categoria corrente
        const categoryId = catalogContainer.dataset.category || 'all';
        currentCategory = categoryId;

        // Inizializza i filtri quando i dati sono disponibili
        initProductFilters();

        // Renderizza prodotti
        renderProducts();

        // Aggiorna conteggio
        updateProductCount();

    } catch (error) {
        console.error('Errore catalogo:', error);
        catalogContainer.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4 class="empty-title">Errore caricamento prodotti</h4>
                <p class="empty-text">Riprova più tardi o contatta l'assistenza.</p>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

/**
 * Carica dataset prodotti (fallback anche per apertura file://)
 */
async function loadProductsData() {
    const inlineProducts =
        window.MAESTRI_PRODOTTI_DATA ||
        window.MAESTRI_PRODUCTS_DATA;

    if (inlineProducts?.prodotti) {
        return inlineProducts;
    }

    const dataPaths = window.location.pathname.includes('/pages/')
        ? ['../data/prodotti.json', 'data/prodotti.json']
        : ['data/prodotti.json', '../data/prodotti.json'];

    for (const path of dataPaths) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                return await response.json();
            }
        } catch (_) {
            // Prova percorso successivo
        }
    }

    throw new Error('Errore caricamento prodotti');
}

/**
 * Raccoglie tutte le immagini uniche per un prodotto
 */
function getProductImages(product) {
    const seen = new Set();
    const images = [];
    const add = (path) => {
        if (!path || seen.has(path)) return;
        seen.add(path);
        images.push(path);
    };
    add(product.immagine);
    (product.sottoprodotti || []).forEach(s => add(s.immagine));
    return images;
}

/**
 * Renderizza i prodotti
 */
function renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    // Filtra prodotti
    let filtered = productsData;

    // Filtro per categoria (supporta anche_in per multi-categoria)
    if (currentCategory && currentCategory !== 'all') {
        filtered = filtered.filter(p =>
            p.categoria === currentCategory ||
            (Array.isArray(p.anche_in) && p.anche_in.includes(currentCategory))
        );
    }

    // Filtro per sottocategoria
    if (currentFilter !== 'all') {
        filtered = filtered.filter(p => p.sottocategoria === currentFilter);
    }

    // Filtro per componente
    if (currentComponentFilter !== 'all') {
        filtered = filtered.filter(p => matchesComponentFilter(p, currentComponentFilter));
    }

    // Filtro ricerca
    if (searchQuery) {
        const query = normalizeText(searchQuery);
        filtered = filtered.filter(p =>
            normalizeText(p.nome).includes(query) ||
            normalizeText(p.codice).includes(query) ||
            normalizeText(p.descrizione).includes(query)
        );
    }

    // Renderizza
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h4 class="empty-title">Nessun prodotto trovato</h4>
                <p class="empty-text">Prova a modificare i filtri di ricerca.</p>
                <button class="btn btn-primary mt-2" onclick="resetFilters()">
                    <i class="fas fa-undo"></i> Reset filtri
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(product => {
        const productName = escapeHtml(product.nome || 'Prodotto');
        const productCode = escapeHtml(product.codice || '-');
        const subcategory = escapeHtml(product.sottocategoria || 'Catalogo');
        const excerpt = escapeHtml(getExcerpt(product.descrizione, 150));
        const tags = getComponentTags(product).slice(0, 3);
        const technicalSheet = product.scheda_tecnica
            ? resolveImagePath(product.scheda_tecnica)
            : null;
        const subCount = (product.sottoprodotti || []).filter(s => s && s.codice).length;
        const images = getProductImages(product);
        const hasMultiple = images.length > 1;

        return `
            <article class="product-card" data-id="${product.id}">
                <div class="product-image${hasMultiple ? ' product-image-gallery' : ''}"
                     ${hasMultiple ? `data-images='${JSON.stringify(images.map(i => resolveImagePath(i)))}'` : ''}>
                    ${images.map((img, idx) => `
                        <img src="${resolveImagePath(img)}"
                             alt="${productName}"
                             class="product-gallery-img${idx === 0 ? ' active' : ''}"
                             loading="lazy">
                    `).join('')}
                    ${hasMultiple ? `
                        <div class="product-gallery-dots">
                            ${images.map((_, idx) => `<span class="product-gallery-dot${idx === 0 ? ' active' : ''}" data-idx="${idx}"></span>`).join('')}
                        </div>
                        <span class="product-gallery-counter">${images.length} <i class="fas fa-images"></i></span>
                    ` : ''}
                </div>
                <div class="product-info">
                    <div class="product-meta-top">
                        <div class="product-code">${productCode}</div>
                        <span class="badge badge-outline product-subcategory">${subcategory}</span>
                    </div>
                    <h4 class="product-name">${productName}</h4>
                    <p class="product-excerpt">${excerpt}</p>
                    ${tags.length ? `
                        <div class="product-card-tags">
                            ${tags.map(tag => `<span class="product-tag">${escapeHtml(tag.label)}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${subCount ? `
                        <div class="product-card-variants">
                            <i class="fas fa-layer-group"></i> ${subCount} variant${subCount === 1 ? 'e' : 'i'}
                        </div>
                    ` : ''}
                    <div class="product-actions">
                        <a href="prodotto.html?id=${product.id}" class="btn btn-sm btn-secondary">
                            <i class="fas fa-eye"></i> Dettagli${subCount ? ' Varianti' : ''}
                        </a>
                        ${technicalSheet ? `
                            <a href="${technicalSheet}"
                               class="btn btn-sm btn-outline"
                               target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-download"></i> PDF
                            </a>
                        ` : `
                            <a href="contatti.html?product=${product.id}&nome=${encodeURIComponent(product.nome || '')}&codice=${encodeURIComponent(product.codice || '')}&cat=${encodeURIComponent(product.categoria || '')}"
                               class="btn btn-sm btn-outline">
                                <i class="fas fa-envelope"></i> Info
                            </a>
                        `}
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Inizializza gallery hover
    initCardGalleries();
    updateProductCount(filtered.length);
}

/**
 * Visualizza dettaglio prodotto
 */
function viewProductDetail(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById('product-detail-body');
    if (!modalBody) return;

    const specsEntries = Object.entries(product.specifiche || {});
    const categoryName = getCategoryLabel(product.categoria);
    const detailTags = getComponentTags(product);
    const subproducts = getSubproducts(product);
    const technicalDrawings = getTechnicalDrawings(product);

    modalBody.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-media">
                <div class="product-detail-image">
                    <img src="${resolveImagePath(product.immagine || 'assets/images/products/placeholder.png')}"
                         alt="${escapeHtml(product.nome || 'Prodotto')}">
                </div>
                <div class="product-detail-highlights">
                    <div class="product-detail-highlight">
                        <span class="label">Codice</span>
                        <strong>${escapeHtml(product.codice || '-')}</strong>
                    </div>
                    <div class="product-detail-highlight">
                        <span class="label">Categoria</span>
                        <strong>${escapeHtml(categoryName)}</strong>
                    </div>
                    <div class="product-detail-highlight">
                        <span class="label">Linea</span>
                        <strong>${escapeHtml(product.sottocategoria || 'Catalogo')}</strong>
                    </div>
                </div>
            </div>
            <div class="product-detail-info">
                <div class="product-detail-badges">
                    <span class="badge badge-primary">${escapeHtml(categoryName)}</span>
                    ${product.in_evidenza ? '<span class="badge badge-accent">In Evidenza</span>' : ''}
                </div>
                <h3>${escapeHtml(product.nome || 'Prodotto')}</h3>
                <p class="product-detail-description">${escapeHtml(product.descrizione || 'Nessuna descrizione disponibile.')}</p>

                ${subproducts.length ? `
                    <div class="product-detail-subproducts">
                        <h4>Tipologie / Sotto-prodotti</h4>
                        <div class="product-subproduct-list">
                            ${subproducts.map(subproduct => renderSubproductCard(subproduct)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${detailTags.length ? `
                    <div class="product-detail-components">
                        <h4>Componenti principali</h4>
                        <div class="product-detail-chip-list">
                            ${detailTags.map(tag => `
                                <span class="product-detail-chip">
                                    <i class="fas ${tag.icon}"></i> ${escapeHtml(tag.label)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="product-detail-specs">
                    <h4>Specifiche Tecniche</h4>
                    <table>
                        <tbody>
                            ${specsEntries.length ? specsEntries.map(([key, value]) => `
                                <tr>
                                    <td>${escapeHtml(formatSpecLabel(key))}</td>
                                    <td><strong>${escapeHtml(String(value))}</strong></td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="2" class="product-detail-empty">Specifiche non disponibili</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                ${technicalDrawings.length ? `
                    <div class="product-detail-drawings">
                        <h4>Disegno Tecnico</h4>
                        <div class="product-detail-drawing-grid">
                            ${technicalDrawings.map(path => renderTechnicalDrawing(path, product.nome || 'Prodotto')).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="product-detail-actions">
                    ${product.scheda_tecnica ? `
                        <a href="${resolveImagePath(product.scheda_tecnica)}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-download"></i> Scarica Scheda Tecnica
                        </a>
                    ` : ''}
                    <a href="contatti.html?product=${product.id}&nome=${encodeURIComponent(product.nome || '')}&codice=${encodeURIComponent(product.codice || '')}&cat=${encodeURIComponent(product.categoria || '')}" class="btn btn-outline">
                        <i class="fas fa-envelope"></i> Richiedi Info
                    </a>
                </div>
            </div>
        </div>
    `;

    openModal('product-modal');
}

/**
 * Formatta label specifiche
 */
function formatSpecLabel(key) {
    const labels = {
        'portata': 'Portata',
        'pressione': 'Pressione',
        'alimentazione': 'Alimentazione',
        'materiale': 'Materiale',
        'peso': 'Peso',
        'dimensioni': 'Dimensioni',
        'temperatura': 'Temperatura',
        'viscosita': 'Viscosità',
        'potenza': 'Potenza',
        'portata_max': 'Portata Max',
        'pressione_max': 'Pressione Max',
        'alimentazione_v': 'Alimentazione (V)',
        'alimentazione_hz': 'Alimentazione (Hz)',
        'capacita': 'Capacità',
        'tubo': 'Lunghezza Tubo'
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

function normalizeText(value) {
    return String(value || '').toLowerCase();
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getExcerpt(value, maxLength = 140) {
    const clean = stripHtml(value);
    if (clean.length <= maxLength) return clean;
    return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function getCategoryLabel(categoryId) {
    const found = categoriesData.find(category => category.id === categoryId);
    return found?.nome || categoryId || 'Catalogo';
}

function getFilterSourceText(product) {
    return normalizeText([
        product.nome,
        product.descrizione,
        product.sottocategoria,
        product.categoria,
        product.codice
    ].join(' '));
}

function matchesComponentFilter(product, componentId) {
    if (!componentId || componentId === 'all') return true;
    const component = COMPONENT_FILTERS.find(item => item.id === componentId);
    if (!component) return false;
    return component.pattern.test(getFilterSourceText(product));
}

function getComponentTags(product) {
    return COMPONENT_FILTERS.filter(component => matchesComponentFilter(product, component.id));
}

function getTechnicalDrawings(product) {
    const variantImages = new Set(
        getSubproducts(product)
            .map(item => item.immagine)
            .filter(Boolean)
    );

    return (TECHNICAL_DRAWINGS[product.id] || [])
        .filter(Boolean)
        .filter(path => !variantImages.has(path));
}

function renderTechnicalDrawing(path, productName) {
    const resolvedPath = resolveImagePath(path);
    const fileName = escapeHtml(path.split('/').pop() || 'disegno-tecnico');
    const altText = escapeHtml(`Disegno tecnico ${productName}`);
    if (/\.(pdf)$/i.test(path)) {
        return `
            <a href="${resolvedPath}" class="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-file-pdf"></i> ${fileName}
            </a>
        `;
    }

    return `
        <a class="technical-drawing-card" href="${resolvedPath}" target="_blank" rel="noopener noreferrer">
            <img src="${resolvedPath}" alt="${altText}" loading="lazy">
            <span class="technical-drawing-caption">${fileName}</span>
        </a>
    `;
}

function getSubproducts(product) {
    return Array.isArray(product.sottoprodotti)
        ? product.sottoprodotti.filter(item => item && item.codice)
        : [];
}

function renderSubproductCard(subproduct) {
    const code = escapeHtml(subproduct.codice || '-');
    const detail = escapeHtml(subproduct.dettaglio || 'Dettagli non specificati');
    const imagePath = subproduct.immagine ? resolveImagePath(subproduct.immagine) : null;
    const imageMarkup = imagePath
        ? `<a class="product-subproduct-thumb" href="${imagePath}" target="_blank" rel="noopener noreferrer">
                <img src="${imagePath}" alt="${code}" loading="lazy">
           </a>`
        : '';

    return `
        <article class="product-subproduct-item">
            ${imageMarkup}
            <div class="product-subproduct-body">
                <div class="product-subproduct-code">${code}</div>
                <p class="product-subproduct-detail">${detail}</p>
            </div>
        </article>
    `;
}

/**
 * Inizializza ricerca prodotti
 */
function initProductSearch() {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchQuery = this.value.trim();
            renderProducts();
        }, 300);
    });
}

/**
 * Inizializza filtri prodotti
 */
function initProductFilters() {
    const filterContainer = document.getElementById('product-filters');
    if (!filterContainer) return;

    const categoryProducts = productsData.filter(p =>
        !currentCategory || currentCategory === 'all'
            ? true
            : p.categoria === currentCategory ||
              (Array.isArray(p.anche_in) && p.anche_in.includes(currentCategory))
    );

    const subcategories = [...new Set(
        categoryProducts
            .map(p => p.sottocategoria)
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'it'));

    const availableComponents = COMPONENT_FILTERS.filter(component =>
        categoryProducts.some(product => matchesComponentFilter(product, component.id))
    );

    if (subcategories.length === 0 && availableComponents.length === 0) {
        filterContainer.style.display = 'none';
        return;
    }

    filterContainer.style.display = '';
    filterContainer.innerHTML = `
        <div class="filter-panel">
            <div class="filter-panel-header">
                <div>
                    <h4 class="filter-panel-title">Filtri di ricerca</h4>
                    <p class="filter-panel-subtitle">Seleziona famiglia prodotto e componenti tecnici</p>
                </div>
                <button class="filter-panel-reset" type="button" id="reset-filters-btn">
                    <i class="fas fa-rotate-left"></i> Reset
                </button>
            </div>

            ${subcategories.length ? `
                <div class="filter-group">
                    <h5 class="filter-group-title">Famiglie prodotto</h5>
                    <div class="filter-chips" data-group="subcategory">
                        <button class="filter-chip active" data-filter-group="subcategory" data-filter="all">Tutte</button>
                        ${subcategories.map(sub => `
                            <button class="filter-chip" data-filter-group="subcategory" data-filter="${escapeHtml(sub)}">${escapeHtml(sub)}</button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${availableComponents.length ? `
                <div class="filter-group">
                    <h5 class="filter-group-title">Componenti</h5>
                    <div class="filter-chips" data-group="component">
                        <button class="filter-chip active" data-filter-group="component" data-filter="all">Tutti</button>
                        ${availableComponents.map(component => `
                            <button class="filter-chip filter-chip-component" data-filter-group="component" data-filter="${component.id}">
                                <i class="fas ${component.icon}"></i> ${component.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // Event listeners
    filterContainer.querySelectorAll('.filter-chip[data-filter-group]').forEach(chip => {
        chip.addEventListener('click', function() {
            const group = this.dataset.filterGroup;
            const value = this.dataset.filter;
            if (!group || !value) return;

            filterContainer
                .querySelectorAll(`.filter-chip[data-filter-group="${group}"]`)
                .forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            if (group === 'subcategory') {
                currentFilter = value;
            }
            if (group === 'component') {
                currentComponentFilter = value;
            }
            renderProducts();
        });
    });

    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

/**
 * Inizializza sidebar categorie
 */
function initCategorySidebar() {
    const sidebar = document.getElementById('category-sidebar');
    if (!sidebar) return;

    const categoryLinks = sidebar.querySelectorAll('.sidebar-menu a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Aggiorna active state
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Mobile: chiudi sidebar
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Mobile toggle
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
}

/**
 * Reset filtri
 */
function resetFilters() {
    searchQuery = '';
    currentFilter = 'all';
    currentComponentFilter = 'all';

    const searchInput = document.getElementById('product-search');
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.filter === 'all');
    });

    renderProducts();
}

/**
 * Aggiorna conteggio prodotti
 */
function updateProductCount(count) {
    const countEl = document.getElementById('product-count');
    if (countEl) {
        const total = count !== undefined ? count : productsData.length;
        countEl.textContent = `${total} prodott${total === 1 ? 'o' : 'i'} trovat${total === 1 ? 'o' : 'i'}`;
    }
}

/**
 * Mostra/nascondi loading
 */
function showLoading(show) {
    const overlay = document.querySelector('.catalog-loading');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Carica prodotti correlati
 */
function loadRelatedProducts(productId, limit = 4) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return [];

    return productsData
        .filter(p =>
            p.id !== productId &&
            (p.categoria === product.categoria ||
             p.sottocategoria === product.sottocategoria ||
             (Array.isArray(product.anche_in) && product.anche_in.includes(p.categoria)) ||
             (Array.isArray(p.anche_in) && p.anche_in.includes(product.categoria)))
        )
        .slice(0, limit);
}

/**
 * Ottiene prodotti per categoria
 */
function getProductsByCategory(category, limit = null) {
    let filtered = productsData.filter(p => p.categoria === category);
    if (limit) filtered = filtered.slice(0, limit);
    return filtered;
}

/**
 * Ottiene prodotti in evidenza
 */
function getFeaturedProducts(limit = 6) {
    return productsData
        .filter(p => p.in_evidenza)
        .slice(0, limit);
}

/**
 * Renderizza card prodotto (versione compatta)
 */
function renderProductCard(product, compact = false) {
    if (compact) {
        return `
            <div class="product-card compact">
                <div class="product-image" style="height: 150px;">
                    <img src="${resolveImagePath(product.immagine || 'assets/images/products/placeholder.png')}"
                         alt="${product.nome}" loading="lazy">
                </div>
                <div class="product-info" style="padding: 1rem;">
                    <div class="product-code" style="font-size: 0.7rem;">${product.codice}</div>
                    <h4 class="product-name" style="font-size: 0.95rem;">${product.nome}</h4>
                    <a href="pages/prodotto.html?id=${product.id}" class="card-link">
                        Dettagli <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    }

    return `
        <div class="product-card">
            <div class="product-image">
                <img src="${resolveImagePath(product.immagine || 'assets/images/products/placeholder.png')}"
                     alt="${product.nome}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-code">${product.codice}</div>
                <h4 class="product-name">${product.nome}</h4>
                <div class="product-actions">
                    <a href="pages/prodotto.html?id=${product.id}" class="btn btn-sm btn-secondary">
                        <i class="fas fa-eye"></i> Dettagli
                    </a>
                </div>
            </div>
        </div>
    `;
}

/* ─── Card Gallery: hover cycling ─── */
function initCardGalleries() {
    document.querySelectorAll('.product-image-gallery').forEach(container => {
        const imgs = container.querySelectorAll('.product-gallery-img');
        const dots = container.querySelectorAll('.product-gallery-dot');
        if (imgs.length <= 1) return;

        let current = 0;
        let timer = null;

        function showImage(idx) {
            imgs.forEach((img, i) => img.classList.toggle('active', i === idx));
            dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
            current = idx;
        }

        function startCycle() {
            if (timer) return;
            timer = setInterval(() => {
                showImage((current + 1) % imgs.length);
            }, 1400);
        }

        function stopCycle() {
            clearInterval(timer);
            timer = null;
            showImage(0);
        }

        container.addEventListener('mouseenter', startCycle);
        container.addEventListener('mouseleave', stopCycle);

        // Dot click → jump to that image
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showImage(Number(dot.dataset.idx));
            });
        });

        // Click on gallery → open lightbox
        container.addEventListener('click', (e) => {
            if (e.target.closest('.product-gallery-dot')) return;
            if (e.target.closest('a')) return;
            e.preventDefault();
            e.stopPropagation();
            const allSrcs = Array.from(imgs).map(img => img.src);
            openImageLightbox(allSrcs, current);
        });
    });
}

/* ─── Lightbox globale per immagini prodotto ─── */
function openImageLightbox(images, startIdx = 0) {
    // Rimuovi eventuale lightbox precedente
    let lb = document.getElementById('maestri-lightbox');
    if (lb) lb.remove();

    let idx = startIdx;

    lb = document.createElement('div');
    lb.id = 'maestri-lightbox';
    lb.className = 'mlb-overlay';
    lb.innerHTML = `
        <div class="mlb-backdrop"></div>
        <button class="mlb-close" aria-label="Chiudi"><i class="fas fa-times"></i></button>
        ${images.length > 1 ? `
            <button class="mlb-arrow mlb-prev" aria-label="Precedente"><i class="fas fa-chevron-left"></i></button>
            <button class="mlb-arrow mlb-next" aria-label="Successiva"><i class="fas fa-chevron-right"></i></button>
        ` : ''}
        <div class="mlb-stage">
            <img class="mlb-image" src="${images[idx]}" alt="Immagine prodotto">
        </div>
        ${images.length > 1 ? `
            <div class="mlb-thumbs">
                ${images.map((src, i) => `
                    <img class="mlb-thumb${i === idx ? ' active' : ''}" src="${src}" data-idx="${i}" alt="">
                `).join('')}
            </div>
            <div class="mlb-counter">${idx + 1} / ${images.length}</div>
        ` : ''}
    `;

    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => lb.classList.add('mlb-visible'));

    const mainImg = lb.querySelector('.mlb-image');
    const thumbs = lb.querySelectorAll('.mlb-thumb');
    const counter = lb.querySelector('.mlb-counter');

    function showLb(newIdx) {
        idx = ((newIdx % images.length) + images.length) % images.length;
        mainImg.src = images[idx];
        thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
        if (counter) counter.textContent = `${idx + 1} / ${images.length}`;
        // Scroll thumb into view
        const activeThumb = thumbs[idx];
        if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    function closeLb() {
        lb.classList.remove('mlb-visible');
        document.body.style.overflow = '';
        setTimeout(() => lb.remove(), 300);
    }

    lb.querySelector('.mlb-backdrop').addEventListener('click', closeLb);
    lb.querySelector('.mlb-close').addEventListener('click', closeLb);
    const prevBtn = lb.querySelector('.mlb-prev');
    const nextBtn = lb.querySelector('.mlb-next');
    if (prevBtn) prevBtn.addEventListener('click', () => showLb(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showLb(idx + 1));
    thumbs.forEach(t => t.addEventListener('click', () => showLb(Number(t.dataset.idx))));

    // Keyboard navigation
    function onKey(e) {
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') showLb(idx - 1);
        if (e.key === 'ArrowRight') showLb(idx + 1);
    }
    document.addEventListener('keydown', onKey);
    // Clean up on remove
    const observer = new MutationObserver(() => {
        if (!document.getElementById('maestri-lightbox')) {
            document.removeEventListener('keydown', onKey);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true });
}

// Rendi accessibile globalmente per product-detail.js
window.openImageLightbox = openImageLightbox;
window.getProductImages = getProductImages;

// Esporta funzioni
window.MaestriCatalog = {
    renderProducts,
    viewProductDetail,
    resetFilters,
    loadRelatedProducts,
    getProductsByCategory,
    getFeaturedProducts,
    renderProductCard,
    openImageLightbox,
    getProductImages,
    productsData,
    categoriesData
};
