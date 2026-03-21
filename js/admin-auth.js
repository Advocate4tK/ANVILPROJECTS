const ADMIN_HASH = '7f4a8b2c9e1d6f3a5b8c2e4d7f9a1b3c'; // hashed version stored server-side

function hashPassword(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash.toString(16);
}

const CORRECT_HASH = hashPassword('Referee33**');

function isLoggedIn() {
    return sessionStorage.getItem('adminAuth') === CORRECT_HASH;
}

function checkAdminAccess() {
    if (!isLoggedIn()) {
        window.location.href = 'admin.html';
    }
}

// ── Admin page logic ───────────────────────────────────────────────────────────
const loginSection    = document.getElementById('loginSection');
const adminDashboard  = document.getElementById('adminDashboard');
const loginBtn        = document.getElementById('loginBtn');
const logoutBtn       = document.getElementById('logoutBtn');
const loginError      = document.getElementById('loginError');

function showSessionBadge(visible) {
    const badge = document.getElementById('sessionBadge');
    if (badge) badge.style.display = visible ? 'flex' : 'none';
}

if (loginSection) {
    // Already logged in — show dashboard
    if (isLoggedIn()) {
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        showSessionBadge(true);
    }

    // Login button
    loginBtn && loginBtn.addEventListener('click', function() {
        const input = document.getElementById('adminPassword').value;
        const override = localStorage.getItem('adminPasswordOverride');
        const valid = override ? (input === override) : (hashPassword(input) === CORRECT_HASH);
        if (valid) {
            sessionStorage.setItem('adminAuth', CORRECT_HASH);
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            loginError.style.display = 'none';
            showSessionBadge(true);
        } else {
            loginError.style.display = 'block';
        }
    });

    // Allow Enter key to submit
    document.getElementById('adminPassword') &&
    document.getElementById('adminPassword').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') loginBtn.click();
    });

    // Logout
    logoutBtn && logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('adminAuth');
        adminDashboard.style.display = 'none';
        loginSection.style.display = 'block';
        showSessionBadge(false);
    });
}
