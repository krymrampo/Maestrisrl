/**
 * MAESTRI SRL - Authentication System
 * Gestione Area Riservata Clienti
 */

// Configurazione utenti (in produzione, questo sarebbe sul server)
const USERS = [
    {
        username: 'cliente',
        password: 'maestri2024',
        name: 'Cliente Demo',
        company: 'Azienda Demo Srl',
        role: 'cliente',
        documents: ['listino_2024.pdf', 'catalogo_completo.pdf'],
        orders: [
            { id: 'ORD-001', date: '2024-01-15', total: 1250.00, status: 'completato' },
            { id: 'ORD-002', date: '2024-02-20', total: 3400.00, status: 'in corso' }
        ]
    },
    {
        username: 'rivenditore',
        password: 'rivendita2024',
        name: 'Rivenditore Demo',
        company: 'Rivendita Spa',
        role: 'rivenditore',
        documents: ['listino_2024.pdf', 'listino_rivenditori.pdf', 'catalogo_completo.pdf', 'presentazione_prodotti.pdf'],
        orders: [
            { id: 'ORD-R001', date: '2024-01-10', total: 8500.00, status: 'completato' },
            { id: 'ORD-R002', date: '2024-02-05', total: 12300.00, status: 'completato' },
            { id: 'ORD-R003', date: '2024-03-01', total: 5600.00, status: 'in corso' }
        ]
    },
    {
        username: 'admin',
        password: 'admin2024',
        name: 'Amministratore',
        company: 'Maestri Srl',
        role: 'admin',
        documents: ['listino_2024.pdf', 'listino_rivenditori.pdf', 'catalogo_completo.pdf', 'presentazione_prodotti.pdf', 'manuali_tecnici.pdf'],
        orders: []
    }
];

// Documenti disponibili
const DOCUMENTS = {
    'listino_2024.pdf': { name: 'Listino Prezzi 2024', size: '2.4 MB', date: '2024-01-01' },
    'listino_rivenditori.pdf': { name: 'Listino Rivenditori 2024', size: '1.8 MB', date: '2024-01-01' },
    'catalogo_completo.pdf': { name: 'Catalogo Completo Prodotti', size: '15.6 MB', date: '2024-02-15' },
    'presentazione_prodotti.pdf': { name: 'Presentazione Gamma Prodotti', size: '8.2 MB', date: '2024-01-20' },
    'manuali_tecnici.pdf': { name: 'Manuali Tecnici', size: '25.4 MB', date: '2023-12-10' }
};

// Chiave per localStorage
const AUTH_KEY = 'maestri_auth';
const SESSION_KEY = 'maestri_session';

/**
 * Inizializzazione autenticazione
 */
document.addEventListener('DOMContentLoaded', function() {
    initLoginForm();
    initProtectedPages();
    initDashboard();
    updateAuthUI();
});

/**
 * Inizializza il form di login
 */
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember')?.checked || false;

        // Validazione
        if (!username || !password) {
            showAuthError('Inserisci username e password');
            return;
        }

        // Tentativo login
        const result = login(username, password, remember);

        if (result.success) {
            showAuthSuccess('Login effettuato con successo!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showAuthError(result.message);
        }
    });
}

/**
 * Effettua il login
 */
function login(username, password, remember = false) {
    const user = USERS.find(u => u.username === username && u.password === password);

    if (!user) {
        return { success: false, message: 'Username o password non validi' };
    }

    // Crea sessione
    const session = {
        username: user.username,
        name: user.name,
        company: user.company,
        role: user.role,
        loginTime: new Date().toISOString()
    };

    // Salva sessione
    if (remember) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return { success: true, user: session };
}

/**
 * Effettua il logout
 */
function logout() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(SESSION_KEY);

    // Reindirizza alla home
    window.location.href = 'index.html';
}

/**
 * Verifica se l'utente è autenticato
 */
function isAuthenticated() {
    return !!getCurrentUser();
}

/**
 * Ottiene l'utente corrente
 */
function getCurrentUser() {
    const auth = localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(SESSION_KEY);
    return auth ? JSON.parse(auth) : null;
}

/**
 * Ottiene i dati completi dell'utente
 */
function getUserData() {
    const session = getCurrentUser();
    if (!session) return null;

    const user = USERS.find(u => u.username === session.username);
    return user || null;
}

/**
 * Protegge le pagine riservate
 */
function initProtectedPages() {
    const isLoginPage = document.body.classList.contains('login-page');
    const isDashboardPage = document.body.classList.contains('dashboard-page');

    if (isDashboardPage && !isAuthenticated()) {
        // Reindirizza al login se non autenticato
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }

    if (isLoginPage && isAuthenticated()) {
        // Reindirizza alla dashboard se già loggato
        window.location.href = 'dashboard.html';
        return;
    }

    // Gestione redirect dopo login
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    if (isLoginPage && redirect && isAuthenticated()) {
        window.location.href = redirect;
    }
}

/**
 * Inizializza la dashboard
 */
function initDashboard() {
    const dashboard = document.querySelector('.dashboard-content');
    if (!dashboard) return;

    const user = getCurrentUser();
    const userData = getUserData();

    if (!user || !userData) return;

    // Aggiorna nome utente
    const userNameEl = document.querySelector('.dashboard-user h4');
    if (userNameEl) {
        userNameEl.textContent = user.name;
    }

    const userCompanyEl = document.querySelector('.dashboard-user p');
    if (userCompanyEl) {
        userCompanyEl.textContent = user.company;
    }

    // Renderizza documenti
    renderDocuments(userData);

    // Renderizza ordini
    renderOrders(userData);

    // Aggiorna statistiche
    updateStats(userData);
}

/**
 * Renderizza la lista documenti
 */
function renderDocuments(userData) {
    const container = document.getElementById('documents-list');
    if (!container) return;

    if (!userData.documents || userData.documents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <h4 class="empty-title">Nessun documento disponibile</h4>
                <p class="empty-text">Contatta l'amministrazione per maggiori informazioni.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = userData.documents.map(docId => {
        const doc = DOCUMENTS[docId] || { name: docId, size: 'N/D', date: 'N/D' };
        return `
            <div class="document-item">
                <div class="document-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="document-info">
                    <div class="document-title">${doc.name}</div>
                    <div class="document-meta">PDF • ${doc.size} • Aggiornato il ${formatDate(doc.date)}</div>
                </div>
                <div class="document-actions">
                    <a href="assets/documents/${docId}" class="btn btn-sm btn-secondary" download>
                        <i class="fas fa-download"></i> Scarica
                    </a>
                    <a href="assets/documents/${docId}" class="btn btn-sm btn-outline" target="_blank">
                        <i class="fas fa-eye"></i> Visualizza
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renderizza la lista ordini
 */
function renderOrders(userData) {
    const container = document.getElementById('orders-list');
    if (!container) return;

    if (!userData.orders || userData.orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h4 class="empty-title">Nessun ordine effettuato</h4>
                <p class="empty-text">Il tuo storico ordini apparirà qui.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Ordine</th>
                        <th>Data</th>
                        <th>Totale</th>
                        <th>Stato</th>
                        <th>Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    ${userData.orders.map(order => `
                        <tr>
                            <td><strong>${order.id}</strong></td>
                            <td>${formatDate(order.date)}</td>
                            <td>${formatCurrency(order.total)}</td>
                            <td>
                                <span class="badge ${getStatusClass(order.status)}">
                                    ${order.status}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-ghost" onclick="viewOrder('${order.id}')">
                                    <i class="fas fa-eye"></i> Dettagli
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Aggiorna le statistiche dashboard
 */
function updateStats(userData) {
    // Numero documenti
    const docsCount = document.getElementById('stat-documents');
    if (docsCount) {
        docsCount.textContent = userData.documents ? userData.documents.length : 0;
    }

    // Numero ordini
    const ordersCount = document.getElementById('stat-orders');
    if (ordersCount) {
        ordersCount.textContent = userData.orders ? userData.orders.length : 0;
    }

    // Totale speso
    const totalSpent = document.getElementById('stat-total');
    if (totalSpent && userData.orders) {
        const total = userData.orders.reduce((sum, order) => sum + order.total, 0);
        totalSpent.textContent = formatCurrency(total);
    }
}

/**
 * Ottiene la classe CSS per lo stato ordine
 */
function getStatusClass(status) {
    const classes = {
        'completato': 'badge-success',
        'in corso': 'badge-accent',
        'annullato': 'badge-secondary',
        'in attesa': 'badge-outline'
    };
    return classes[status] || 'badge-secondary';
}

/**
 * Visualizza dettaglio ordine
 */
function viewOrder(orderId) {
    const userData = getUserData();
    const order = userData.orders.find(o => o.id === orderId);

    if (!order) return;

    // Popola modal
    const modalBody = document.getElementById('order-detail-body');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Numero Ordine</label>
                    <input type="text" class="form-control" value="${order.id}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Data</label>
                    <input type="text" class="form-control" value="${formatDate(order.date)}" readonly>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Totale</label>
                    <input type="text" class="form-control" value="${formatCurrency(order.total)}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Stato</label>
                    <input type="text" class="form-control" value="${order.status}" readonly>
                </div>
            </div>
        `;
    }

    openModal('order-detail-modal');
}

/**
 * Aggiorna l'UI in base allo stato autenticazione
 */
function updateAuthUI() {
    const user = getCurrentUser();

    // Aggiorna link area riservata nell'header
    const authLinks = document.querySelectorAll('.auth-link');
    authLinks.forEach(link => {
        if (user) {
            link.href = 'dashboard.html';
            link.innerHTML = '<i class="fas fa-user"></i> Area Clienti';
        } else {
            link.href = 'login.html';
            link.innerHTML = '<i class="fas fa-lock"></i> Area Riservata';
        }
    });

    // Aggiorna menu utente se presente
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        if (user) {
            userMenu.classList.remove('hidden');
            userMenu.querySelector('.user-name').textContent = user.name;
        } else {
            userMenu.classList.add('hidden');
        }
    }
}

/**
 * Mostra messaggio di errore
 */
function showAuthError(message) {
    const container = document.getElementById('auth-message');
    if (!container) {
        if (window.MaestriUtils) {
            MaestriUtils.showToast('error', 'Errore', message);
        }
        return;
    }

    container.innerHTML = `
        <div class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        </div>
    `;
}

/**
 * Mostra messaggio di successo
 */
function showAuthSuccess(message) {
    const container = document.getElementById('auth-message');
    if (!container) {
        if (window.MaestriUtils) {
            MaestriUtils.showToast('success', 'Successo', message);
        }
        return;
    }

    container.innerHTML = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            ${message}
        </div>
    `;
}

/**
 * Cambia password
 */
function changePassword(currentPassword, newPassword) {
    const userData = getUserData();

    if (!userData) {
        return { success: false, message: 'Utente non autenticato' };
    }

    if (userData.password !== currentPassword) {
        return { success: false, message: 'Password attuale non corretta' };
    }

    // In un'app reale, qui si farebbe una chiamata API
    userData.password = newPassword;

    return { success: true, message: 'Password aggiornata con successo' };
}

/**
 * Formatta data
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formatta valuta
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

// Esporta funzioni
window.MaestriAuth = {
    login,
    logout,
    isAuthenticated,
    getCurrentUser,
    getUserData,
    changePassword,
    viewOrder
};
