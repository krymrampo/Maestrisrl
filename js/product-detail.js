/**
 * MAESTRI SRL - Product Detail Page
 * Gestisce la pagina dettaglio prodotto singolo
 * URL: prodotto.html?id=GR-001  (macro-prodotto)
 *      prodotto.html?id=GR-001&v=668/LITIO  (scroll a variante specifica)
 */

(function () {
    'use strict';

    /* ─── Helpers ─── */
    const resolveImagePath = (path) =>
        window.resolveAssetPath ? window.resolveAssetPath(path) : path;

    const esc = (v) =>
        String(v || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    const stripHtml = (v) =>
        String(v || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    /* Mapping category-id → page file */
    const CATEGORY_PAGES = {
        grasso: 'grasso.html',
        gasolio: 'gasolio.html',
        olio: 'olio.html',
        urea: 'urea.html',
        antigelo: 'antigelo.html',
        'acqua-lavavetri': 'acqua-lavavetri.html',
        accessori: 'accessori.html'
    };

    const CATEGORY_ICONS = {
        grasso: 'fa-oil-can',
        gasolio: 'fa-gas-pump',
        olio: 'fa-droplet',
        urea: 'fa-tint',
        antigelo: 'fa-snowflake',
        'acqua-lavavetri': 'fa-water',
        accessori: 'fa-cogs'
    };

    /* Spec label formatting (same as catalog.js) */
    const SPEC_LABELS = {
        portata: 'Portata', pressione: 'Pressione',
        alimentazione: 'Alimentazione', materiale: 'Materiale',
        peso: 'Peso', dimensioni: 'Dimensioni',
        temperatura: 'Temperatura', viscosita: 'Viscosità',
        potenza: 'Potenza', portata_max: 'Portata Max',
        pressione_max: 'Pressione Max', alimentazione_v: 'Alimentazione (V)',
        alimentazione_hz: 'Alimentazione (Hz)', capacita: 'Capacità',
        tubo: 'Lunghezza Tubo'
    };

    const fmtSpec = (k) =>
        SPEC_LABELS[k] || k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');

    /* Technical drawings (mirror from catalog.js) */
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

    /* ─── Data loader (same pattern as catalog.js) ─── */
    async function loadData() {
        const inline = window.MAESTRI_PRODOTTI_DATA || window.MAESTRI_PRODUCTS_DATA;
        if (inline?.prodotti) return inline;

        const paths = window.location.pathname.includes('/pages/')
            ? ['../data/prodotti.json', 'data/prodotti.json']
            : ['data/prodotti.json', '../data/prodotti.json'];

        for (const p of paths) {
            try {
                const r = await fetch(p);
                if (r.ok) return await r.json();
            } catch (_) { /* next */ }
        }
        throw new Error('Impossibile caricare i dati prodotto');
    }

    /* ─── URL helpers ─── */
    function getParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            id: params.get('id'),
            variant: params.get('v'),
            sub: params.get('sub')
        };
    }

    /* ─── Render: page header & breadcrumb ─── */
    function renderHeader(product, categories) {
        const cat = categories.find(c => c.id === product.categoria);
        const catName = cat?.nome || product.categoria;
        const catPage = CATEGORY_PAGES[product.categoria] || 'prodotti.html';

        document.getElementById('product-page-title').textContent = product.nome;
        document.getElementById('product-page-subtitle').textContent =
            product.sottocategoria || catName;

        // Update page title
        document.title = `${product.nome} - Maestri Srl`;

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = stripHtml(product.descrizione).slice(0, 160);
        }

        // Breadcrumb with category link
        const bc = document.getElementById('product-breadcrumb');
        bc.innerHTML = `
            <a href="../index.html">Home</a>
            <span class="breadcrumb-separator">/</span>
            <a href="prodotti.html">Prodotti</a>
            <span class="breadcrumb-separator">/</span>
            <a href="${catPage}">${esc(catName)}</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${esc(product.nome)}</span>
        `;
    }

    /* ─── Collect all unique images for a product ─── */
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

    /* ─── Render: product hero ─── */
    function renderHero(product, categories) {
        const cat = categories.find(c => c.id === product.categoria);
        const catName = cat?.nome || product.categoria;
        const catIcon = CATEGORY_ICONS[product.categoria] || 'fa-box';
        const specsEntries = Object.entries(product.specifiche || {})
            .filter(([k]) => k !== 'fonte');
        const subCount = (product.sottoprodotti || []).length;
        const techSheet = product.scheda_tecnica
            ? resolveImagePath(product.scheda_tecnica) : null;

        const allImages = getProductImages(product);
        const hasMultipleImages = allImages.length > 1;

        document.getElementById('product-hero').innerHTML = `
            <div class="pd-hero-grid">
                <!-- Image column -->
                <div class="pd-hero-media">
                    <div class="pd-hero-image pd-hero-image-clickable" id="pd-hero-image-wrap"
                         data-images='${JSON.stringify(allImages.map(i => resolveImagePath(i)))}'>
                        <img src="${resolveImagePath(product.immagine || 'assets/images/products/placeholder.png')}"
                             alt="${esc(product.nome)}"
                             id="pd-main-image">
                        ${hasMultipleImages ? '<span class="pd-image-zoom-hint"><i class="fas fa-search-plus"></i></span>' : ''}
                    </div>
                    ${hasMultipleImages ? `
                        <div class="pd-hero-thumbs">
                            ${allImages.map((img, i) => `
                                <img class="pd-hero-thumb${i === 0 ? ' active' : ''}"
                                     src="${resolveImagePath(img)}"
                                     alt="Variante ${i + 1}"
                                     data-idx="${i}"
                                     loading="lazy">
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="pd-hero-highlights">
                        <div class="pd-highlight-card">
                            <i class="fas ${catIcon}"></i>
                            <div>
                                <span class="label">Categoria</span>
                                <strong>${esc(catName)}</strong>
                            </div>
                        </div>
                        <div class="pd-highlight-card">
                            <i class="fas fa-tag"></i>
                            <div>
                                <span class="label">Codice</span>
                                <strong>${esc(product.codice)}</strong>
                            </div>
                        </div>
                        <div class="pd-highlight-card">
                            <i class="fas fa-layer-group"></i>
                            <div>
                                <span class="label">Varianti</span>
                                <strong>${subCount} modell${subCount === 1 ? 'o' : 'i'}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info column -->
                <div class="pd-hero-info">
                    <div class="pd-badges">
                        <span class="badge badge-primary"><i class="fas ${catIcon}"></i> ${esc(catName)}</span>
                        <span class="badge badge-outline">${esc(product.sottocategoria || 'Catalogo')}</span>
                        ${product.in_evidenza ? '<span class="badge badge-accent"><i class="fas fa-star"></i> In Evidenza</span>' : ''}
                    </div>

                    <h1 class="pd-title">${esc(product.nome)}</h1>

                    <div class="pd-description">
                        ${esc(product.descrizione || 'Nessuna descrizione disponibile.')}
                    </div>

                    ${specsEntries.length ? `
                        <div class="pd-specs">
                            <h3><i class="fas fa-clipboard-list"></i> Specifiche Tecniche</h3>
                            <table class="pd-specs-table">
                                <tbody>
                                    ${specsEntries.map(([k, v]) => `
                                        <tr>
                                            <td>${esc(fmtSpec(k))}</td>
                                            <td><strong>${esc(String(v))}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}

                    <div class="pd-actions">
                        ${techSheet ? `
                            <a href="${techSheet}" class="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-download"></i> Scarica Scheda Tecnica
                            </a>
                        ` : ''}
                        <a href="contatti.html?product=${product.id}&nome=${encodeURIComponent(product.nome || '')}&codice=${encodeURIComponent(product.codice || '')}&cat=${encodeURIComponent(product.categoria || '')}" class="btn btn-outline btn-lg">
                            <i class="fas fa-envelope"></i> Richiedi Informazioni
                        </a>
                        ${subCount ? `
                            <a href="#variants-section" class="btn btn-accent btn-lg pd-scroll-variants">
                                <i class="fas fa-layer-group"></i> Vedi ${subCount} Variant${subCount === 1 ? 'e' : 'i'}
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /* ─── Render: single variant card ─── */
    function renderVariantCard(variant, index, product) {
        const code = esc(variant.codice || '-');
        const detail = esc(variant.dettaglio || 'Dettagli non specificati');
        const imgSrc = variant.immagine
            ? resolveImagePath(variant.immagine)
            : (product.immagine ? resolveImagePath(product.immagine) : resolveImagePath('assets/images/products/placeholder.png'));
        const variantId = `variant-${(variant.codice || index).toString().replace(/[^a-zA-Z0-9]/g, '-')}`;

        return `
            <article class="pd-variant-card" id="${variantId}" data-variant-code="${esc(variant.codice)}">
                <div class="pd-variant-number">${index + 1}</div>
                <div class="pd-variant-image">
                    <img src="${imgSrc}"
                         alt="${code}"
                         loading="lazy">
                </div>
                <div class="pd-variant-body">
                    <div class="pd-variant-header">
                        <span class="pd-variant-code">${code}</span>
                        <span class="pd-variant-badge">Variante ${index + 1}</span>
                    </div>
                    <p class="pd-variant-detail">${detail}</p>
                    <div class="pd-variant-actions">
                        <a href="prodotto.html?id=${product.id}&sub=${encodeURIComponent(variant.codice)}"
                           class="btn btn-sm btn-secondary">
                            <i class="fas fa-eye"></i> Vedi Scheda
                        </a>
                        <a href="contatti.html?product=${product.id}&variant=${encodeURIComponent(variant.codice)}&nome=${encodeURIComponent(product.nome || '')}&codice=${encodeURIComponent(variant.codice || '')}&cat=${encodeURIComponent(product.categoria || '')}"
                           class="btn btn-sm btn-outline">
                            <i class="fas fa-envelope"></i> Richiedi Info
                        </a>
                        <button class="btn btn-sm btn-ghost pd-share-btn"
                                data-url="prodotto.html?id=${product.id}&sub=${encodeURIComponent(variant.codice)}"
                                title="Copia link variante">
                            <i class="fas fa-link"></i> Copia Link
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    /* ─── Render: variants section ─── */
    function renderVariants(product) {
        const subs = (product.sottoprodotti || []).filter(s => s && s.codice);
        if (!subs.length) return;

        const section = document.getElementById('variants-section');
        const grid = document.getElementById('variants-grid');
        const count = document.getElementById('variants-count');

        count.textContent = `${subs.length} variant${subs.length === 1 ? 'e' : 'i'} disponibil${subs.length === 1 ? 'e' : 'i'}`;
        grid.innerHTML = subs.map((v, i) => renderVariantCard(v, i, product)).join('');
        section.style.display = '';
    }

    /* ─── Render: technical drawings ─── */
    function renderDrawings(product) {
        const paths = TECHNICAL_DRAWINGS[product.id];
        if (!paths || !paths.length) return;

        // Exclude variant images
        const variantImages = new Set(
            (product.sottoprodotti || []).map(s => s.immagine).filter(Boolean)
        );
        const filtered = paths.filter(p => !variantImages.has(p));
        if (!filtered.length) return;

        const section = document.getElementById('drawings-section');
        const grid = document.getElementById('drawings-grid');

        grid.innerHTML = filtered.map(path => {
            const resolved = resolveImagePath(path);
            const name = esc(path.split('/').pop() || 'Disegno tecnico');
            if (/\.pdf$/i.test(path)) {
                return `
                    <a href="${resolved}" class="pd-drawing-card" target="_blank" rel="noopener noreferrer">
                        <div class="pd-drawing-icon"><i class="fas fa-file-pdf"></i></div>
                        <span>${name}</span>
                    </a>
                `;
            }
            return `
                <a href="${resolved}" class="pd-drawing-card" target="_blank" rel="noopener noreferrer">
                    <img src="${resolved}" alt="Disegno tecnico ${esc(product.nome)}" loading="lazy">
                    <span>${name}</span>
                </a>
            `;
        }).join('');

        section.style.display = '';
    }

    /* ─── Render: related products ─── */
    function renderRelated(product, allProducts) {
        const related = allProducts
            .filter(p =>
                p.id !== product.id &&
                (p.categoria === product.categoria ||
                 p.sottocategoria === product.sottocategoria ||
                 (Array.isArray(product.anche_in) && product.anche_in.includes(p.categoria)) ||
                 (Array.isArray(p.anche_in) && p.anche_in.includes(product.categoria)))
            )
            .slice(0, 6);

        if (!related.length) return;

        const section = document.getElementById('related-section');
        const grid = document.getElementById('related-grid');

        // Replace static h2 with toggle header
        section.innerHTML = `
            <button class="pd-related-toggle" id="related-toggle" aria-expanded="false">
                <span><i class="fas fa-th-large"></i> Prodotti Correlati <small>(${related.length})</small></span>
                <i class="fas fa-chevron-down pd-related-chevron"></i>
            </button>
            <div class="pd-related-grid pd-related-collapsed" id="related-grid"></div>
        `;

        const newGrid = document.getElementById('related-grid');
        newGrid.innerHTML = related.map(p => {
            const subCount = (p.sottoprodotti || []).filter(s => s?.codice).length;
            return `
                <a href="prodotto.html?id=${p.id}" class="pd-related-card">
                    <div class="pd-related-image">
                        <img src="${resolveImagePath(p.immagine || 'assets/images/products/placeholder.png')}"
                             alt="${esc(p.nome)}" loading="lazy">
                    </div>
                    <div class="pd-related-info">
                        <span class="pd-related-code">${esc(p.codice)}</span>
                        <h4>${esc(p.nome)}</h4>
                        ${subCount ? `<span class="pd-related-variants"><i class="fas fa-layer-group"></i> ${subCount} varianti</span>` : ''}
                    </div>
                </a>
            `;
        }).join('');

        section.style.display = '';
    }

    /* ─── Render: sub-product detail page ─── */
    function renderSubProductPage(product, variant, categories) {
        const cat = categories.find(c => c.id === product.categoria);
        const catName = cat?.nome || product.categoria;
        const catPage = CATEGORY_PAGES[product.categoria] || 'prodotti.html';
        const catIcon = CATEGORY_ICONS[product.categoria] || 'fa-box';
        const variantCode = esc(variant.codice || '-');
        const variantDetail = esc(variant.dettaglio || 'Dettagli non specificati');
        const imgSrc = variant.immagine
            ? resolveImagePath(variant.immagine)
            : (product.immagine ? resolveImagePath(product.immagine) : resolveImagePath('assets/images/products/placeholder.png'));
        const techSheet = product.scheda_tecnica
            ? resolveImagePath(product.scheda_tecnica) : null;

        // Page title
        document.title = `${variant.codice} - ${product.nome} - Maestri Srl`;
        document.getElementById('product-page-title').textContent = variant.codice;
        document.getElementById('product-page-subtitle').textContent = product.nome;

        // Meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = stripHtml(variant.dettaglio || product.descrizione).slice(0, 160);
        }

        // Breadcrumb
        const bc = document.getElementById('product-breadcrumb');
        bc.innerHTML = `
            <a href="../index.html">Home</a>
            <span class="breadcrumb-separator">/</span>
            <a href="prodotti.html">Prodotti</a>
            <span class="breadcrumb-separator">/</span>
            <a href="${catPage}">${esc(catName)}</a>
            <span class="breadcrumb-separator">/</span>
            <a href="prodotto.html?id=${product.id}">${esc(product.nome)}</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${variantCode}</span>
        `;

        // Parse specs from dettaglio text
        const specPairs = [];
        const specPatterns = [
            { label: 'Capacità', regex: /Capacit[àa]:\s*([^\s,–-]+(?:\s*[^\s,–-]+)?)/i },
            { label: 'Peso', regex: /Peso:\s*([^\s,–-]+(?:\s*[^\s,–-]+)?)/i },
            { label: 'Dimensioni', regex: /(?:Dimensioni|Misure)[^:]*:\s*([^\n,]+)/i },
            { label: 'Pressione Max', regex: /(?:Max\s+)?Pressione[^:]*:\s*([^\n,]+)/i },
            { label: 'Temperatura', regex: /(?:Max\s+)?Temperatura[^:]*:\s*([^\n,]+)/i },
            { label: 'Lunghezza', regex: /Lunghezza[^:]*:\s*([^\n,]+)/i },
            { label: 'Portata', regex: /Portata[^:]*:\s*([^\n,]+)/i },
            { label: 'Alimentazione', regex: /Alimentazione[^:]*:\s*([^\n,]+)/i },
            { label: 'Potenza', regex: /Potenza[^:]*:\s*([^\n,]+)/i },
            { label: 'Voltaggio', regex: /(?:Volt(?:aggio)?|Tensione)[^:]*:\s*([^\n,]+)/i }
        ];
        const rawDetail = variant.dettaglio || '';
        specPatterns.forEach(sp => {
            const m = rawDetail.match(sp.regex);
            if (m) specPairs.push({ label: sp.label, value: m[1].trim() });
        });

        // Also include parent product specs
        const parentSpecs = Object.entries(product.specifiche || {})
            .filter(([k]) => k !== 'fonte');

        // Count siblings
        const siblings = (product.sottoprodotti || []).filter(s => s && s.codice);
        const siblingIndex = siblings.findIndex(s => s.codice === variant.codice);

        // Collect images for this sub-product (variant image + parent + other variants)
        const subImages = getProductImages(product);
        // Move variant's own image to front
        const variantImgPath = variant.immagine || product.immagine;
        const orderedImages = [variantImgPath, ...subImages.filter(i => i !== variantImgPath)];
        const hasMultiSub = orderedImages.length > 1;

        // Hero
        document.getElementById('product-hero').innerHTML = `
            <div class="pd-sub-back">
                <a href="prodotto.html?id=${product.id}" class="btn btn-ghost btn-sm">
                    <i class="fas fa-arrow-left"></i> Torna a ${esc(product.nome)}
                </a>
            </div>

            <div class="pd-hero-grid">
                <!-- Image column -->
                <div class="pd-hero-media">
                    <div class="pd-hero-image pd-hero-image-clickable" id="pd-hero-image-wrap"
                         data-images='${JSON.stringify(orderedImages.map(i => resolveImagePath(i)))}'>
                        <img src="${imgSrc}" alt="${variantCode}" id="pd-main-image">
                        ${hasMultiSub ? '<span class="pd-image-zoom-hint"><i class="fas fa-search-plus"></i></span>' : ''}
                    </div>
                    ${hasMultiSub ? `
                        <div class="pd-hero-thumbs">
                            ${orderedImages.map((img, i) => `
                                <img class="pd-hero-thumb${i === 0 ? ' active' : ''}"
                                     src="${resolveImagePath(img)}"
                                     alt="Immagine ${i + 1}"
                                     data-idx="${i}"
                                     loading="lazy">
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="pd-hero-highlights">
                        <div class="pd-highlight-card">
                            <i class="fas ${catIcon}"></i>
                            <div>
                                <span class="label">Categoria</span>
                                <strong>${esc(catName)}</strong>
                            </div>
                        </div>
                        <div class="pd-highlight-card">
                            <i class="fas fa-tag"></i>
                            <div>
                                <span class="label">Codice</span>
                                <strong>${variantCode}</strong>
                            </div>
                        </div>
                        <div class="pd-highlight-card">
                            <i class="fas fa-cube"></i>
                            <div>
                                <span class="label">Prodotto Padre</span>
                                <strong>${esc(product.codice)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Info column -->
                <div class="pd-hero-info">
                    <div class="pd-badges">
                        <span class="badge badge-primary"><i class="fas ${catIcon}"></i> ${esc(catName)}</span>
                        <span class="badge badge-outline">${esc(product.sottocategoria || 'Catalogo')}</span>
                        <span class="badge badge-accent"><i class="fas fa-layer-group"></i> Variante ${siblingIndex + 1} di ${siblings.length}</span>
                    </div>

                    <h1 class="pd-title">${variantCode}</h1>
                    <p class="pd-sub-parent-name">
                        <i class="fas fa-sitemap"></i>
                        Parte di: <a href="prodotto.html?id=${product.id}">${esc(product.nome)}</a>
                    </p>

                    <div class="pd-description">${variantDetail}</div>

                    ${specPairs.length || parentSpecs.length ? `
                        <div class="pd-specs">
                            <h3><i class="fas fa-clipboard-list"></i> Specifiche</h3>
                            <table class="pd-specs-table">
                                <tbody>
                                    ${specPairs.map(s => `
                                        <tr>
                                            <td>${esc(s.label)}</td>
                                            <td><strong>${esc(s.value)}</strong></td>
                                        </tr>
                                    `).join('')}
                                    ${parentSpecs.map(([k, v]) => `
                                        <tr>
                                            <td>${esc(fmtSpec(k))}</td>
                                            <td><strong>${esc(String(v))}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}

                    <div class="pd-actions">
                        ${techSheet ? `
                            <a href="${techSheet}" class="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-download"></i> Scarica Scheda Tecnica
                            </a>
                        ` : ''}
                        <a href="contatti.html?product=${product.id}&variant=${encodeURIComponent(variant.codice)}&nome=${encodeURIComponent(product.nome || '')}&codice=${encodeURIComponent(variant.codice || '')}&cat=${encodeURIComponent(product.categoria || '')}" class="btn btn-outline btn-lg">
                            <i class="fas fa-envelope"></i> Richiedi Informazioni
                        </a>
                        <button class="btn btn-ghost btn-lg pd-share-btn"
                                data-url="prodotto.html?id=${product.id}&sub=${encodeURIComponent(variant.codice)}"
                                title="Copia link variante">
                            <i class="fas fa-link"></i> Copia Link
                        </button>
                    </div>
                </div>
            </div>

            ${siblings.length > 1 ? `
                <div class="pd-sub-siblings">
                    <h3><i class="fas fa-layer-group"></i> Altre Varianti di ${esc(product.nome)}</h3>
                    <div class="pd-sub-siblings-grid">
                        ${siblings.filter(s => s.codice !== variant.codice).map(s => {
                            const sImg = s.immagine
                                ? resolveImagePath(s.immagine)
                                : (product.immagine ? resolveImagePath(product.immagine) : resolveImagePath('assets/images/products/placeholder.png'));
                            return `
                                <a href="prodotto.html?id=${product.id}&sub=${encodeURIComponent(s.codice)}" class="pd-sub-sibling-card">
                                    <img src="${sImg}" alt="${esc(s.codice)}" loading="lazy">
                                    <div class="pd-sub-sibling-info">
                                        <strong>${esc(s.codice)}</strong>
                                        <span>${esc((s.dettaglio || '').slice(0, 80))}${(s.dettaglio || '').length > 80 ? '…' : ''}</span>
                                    </div>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }

    /* ─── Render: error state ─── */
    function renderError(message) {
        document.getElementById('product-page-title').textContent = 'Prodotto non trovato';
        document.getElementById('product-hero').innerHTML = `
            <div class="pd-error">
                <div class="pd-error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h2>Prodotto non trovato</h2>
                <p>${esc(message)}</p>
                <a href="prodotti.html" class="btn btn-primary">
                    <i class="fas fa-arrow-left"></i> Torna al Catalogo
                </a>
            </div>
        `;
    }

    /* ─── Scroll to variant ─── */
    function scrollToVariant(variantCode) {
        if (!variantCode) return;
        const safeId = 'variant-' + variantCode.replace(/[^a-zA-Z0-9]/g, '-');
        const el = document.getElementById(safeId);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('pd-variant-highlight');
                setTimeout(() => el.classList.remove('pd-variant-highlight'), 3000);
            }, 400);
        }
    }

    /* ─── Share / copy link handler ─── */
    function initShareButtons() {
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('.pd-share-btn');
            if (!btn) return;
            e.preventDefault();
            const url = new URL(btn.dataset.url, window.location.href).href;
            navigator.clipboard.writeText(url).then(() => {
                const icon = btn.querySelector('i');
                icon.className = 'fas fa-check';
                btn.classList.add('copied');
                setTimeout(() => {
                    icon.className = 'fas fa-link';
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                prompt('Copia questo link:', url);
            });
        });
    }

    /* ─── Smooth scroll to #variants-section ─── */
    function initScrollLinks() {
        document.addEventListener('click', function (e) {
            const link = e.target.closest('.pd-scroll-variants');
            if (!link) return;
            e.preventDefault();
            const target = document.getElementById('variants-section');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    /* ─── Related products toggle ─── */
    function initRelatedToggle() {
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('.pd-related-toggle');
            if (!btn) return;
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', !expanded);
            const grid = btn.nextElementSibling;
            if (grid) {
                grid.classList.toggle('pd-related-collapsed', expanded);
                grid.classList.toggle('pd-related-expanded', !expanded);
            }
        });
    }

    /* ─── Main init ─── */
    async function init() {
        const { id, variant, sub } = getParams();

        if (!id) {
            renderError('Nessun ID prodotto specificato nell\'URL.');
            return;
        }

        try {
            const data = await loadData();
            const product = (data.prodotti || []).find(p => p.id === id);

            if (!product) {
                renderError(`Nessun prodotto trovato con ID "${id}".`);
                return;
            }

            // Sub-product detail view
            if (sub) {
                const subProduct = (product.sottoprodotti || []).find(
                    s => s && s.codice === sub
                );
                if (!subProduct) {
                    renderError(`Variante "${sub}" non trovata per il prodotto "${product.nome}".`);
                    return;
                }
                renderSubProductPage(product, subProduct, data.categorie || []);
                initHeroGallery();
                renderRelated(product, data.prodotti || []);
                return;
            }

            renderHeader(product, data.categorie || []);
            renderHero(product, data.categorie || []);
            initHeroGallery();
            renderVariants(product);
            renderDrawings(product);
            renderRelated(product, data.prodotti || []);

            // Scroll to specific variant if ?v= is present
            if (variant) {
                scrollToVariant(variant);
            }

        } catch (err) {
            console.error('Errore pagina dettaglio:', err);
            renderError('Si è verificato un errore nel caricamento del prodotto.');
        }
    }

    /* ─── Hero gallery: thumbnails + lightbox ─── */
    function initHeroGallery() {
        const wrap = document.getElementById('pd-hero-image-wrap');
        if (!wrap) return;

        let imagesData;
        try { imagesData = JSON.parse(wrap.dataset.images); } catch(_) { return; }
        if (!imagesData || imagesData.length === 0) return;

        const mainImg = document.getElementById('pd-main-image');
        const thumbs = wrap.parentElement.querySelectorAll('.pd-hero-thumb');

        // Click thumbnail → change main image
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const idx = Number(thumb.dataset.idx);
                mainImg.src = imagesData[idx];
                thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
            });
        });

        // Click main image → open lightbox
        wrap.addEventListener('click', (e) => {
            if (e.target.closest('.pd-hero-thumb')) return;
            const currentSrc = mainImg.src;
            const startIdx = imagesData.findIndex(s => currentSrc.includes(s.split('/').pop())) || 0;
            openLightbox(imagesData, Math.max(0, startIdx));
        });
    }

    /* ─── Lightbox (self-contained) ─── */
    function openLightbox(images, startIdx) {
        // Use global one from catalog.js if available, else own implementation
        if (window.openImageLightbox) {
            window.openImageLightbox(images, startIdx);
            return;
        }

        let lb = document.getElementById('maestri-lightbox');
        if (lb) lb.remove();

        let idx = startIdx || 0;

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
        const lbThumbs = lb.querySelectorAll('.mlb-thumb');
        const counter = lb.querySelector('.mlb-counter');

        function showLb(newIdx) {
            idx = ((newIdx % images.length) + images.length) % images.length;
            mainImg.src = images[idx];
            lbThumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
            if (counter) counter.textContent = `${idx + 1} / ${images.length}`;
            const activeThumb = lbThumbs[idx];
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
        lbThumbs.forEach(t => t.addEventListener('click', () => showLb(Number(t.dataset.idx))));

        function onKey(e) {
            if (e.key === 'Escape') closeLb();
            if (e.key === 'ArrowLeft') showLb(idx - 1);
            if (e.key === 'ArrowRight') showLb(idx + 1);
        }
        document.addEventListener('keydown', onKey);
        const observer = new MutationObserver(() => {
            if (!document.getElementById('maestri-lightbox')) {
                document.removeEventListener('keydown', onKey);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
    }

    /* ─── Boot ─── */
    document.addEventListener('DOMContentLoaded', function () {
        init();
        initShareButtons();
        initScrollLinks();
        initRelatedToggle();
    });

})();
