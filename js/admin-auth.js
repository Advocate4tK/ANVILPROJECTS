// ── Supabase Auth — replaces generic password check ───────────────────────────

// Synchronous session check using Supabase's localStorage token
// Key format: sb-{projectRef}-auth-token
function _getSupabaseSession() {
    try {
        const url   = (typeof CONFIG !== 'undefined') ? CONFIG.SUPABASE_URL : '';
        const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (!match) return null;
        const key  = `sb-${match[1]}-auth-token`;
        const raw  = localStorage.getItem(key);
        if (!raw) return null;
        const data = JSON.parse(raw);
        const exp  = data?.expires_at || 0;
        // expires_at is in seconds
        if (exp && exp < Math.floor(Date.now() / 1000)) return null;
        return data;
    } catch (e) {
        return null;
    }
}

function isLoggedIn() {
    return _getSupabaseSession() !== null;
}

function checkAdminAccess() {
    if (!isLoggedIn()) {
        window.location.href = 'admin.html';
    }
}

// Returns the current user's Supabase auth.uid() — use for assignor_id writes
function currentUserId() {
    const s = _getSupabaseSession();
    return s?.user?.id || null;
}

// ── Admin page logic (only runs when loginSection exists) ─────────────────────
const loginSection   = document.getElementById('loginSection');
const adminDashboard = document.getElementById('adminDashboard');
const loginBtn       = document.getElementById('loginBtn');
const logoutBtn      = document.getElementById('logoutBtn');
const loginError     = document.getElementById('loginError');

function showSessionBadge(visible) {
    const badge = document.getElementById('sessionBadge');
    if (badge) badge.style.display = visible ? 'flex' : 'none';
}

if (loginSection) {
    // Already have a valid session — skip the form
    if (isLoggedIn()) {
        loginSection.style.display  = 'none';
        adminDashboard.style.display = 'block';
        showSessionBadge(true);
    }

    // Login
    async function doLogin() {
        const email    = (document.getElementById('adminEmail')    || {}).value || '';
        const password = (document.getElementById('adminPassword') || {}).value || '';
        if (!email || !password) {
            loginError.textContent = 'Enter your email and password.';
            loginError.style.display = 'block';
            return;
        }
        try {
            const { data, error } = await supabaseClient.client.auth.signInWithPassword({ email, password });
            if (error || !data.session) {
                loginError.textContent = 'Invalid email or password.';
                loginError.style.display = 'block';
                return;
            }
            loginError.style.display  = 'none';
            loginSection.style.display  = 'none';
            adminDashboard.style.display = 'block';
            showSessionBadge(true);
        } catch (e) {
            loginError.textContent = 'Login failed. Try again.';
            loginError.style.display = 'block';
        }
    }

    loginBtn && loginBtn.addEventListener('click', doLogin);

    // Enter key on either field
    ['adminEmail', 'adminPassword'].forEach(id => {
        const el = document.getElementById(id);
        el && el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    });

    // Logout
    logoutBtn && logoutBtn.addEventListener('click', async function() {
        await supabaseClient.client.auth.signOut();
        adminDashboard.style.display = 'none';
        loginSection.style.display  = 'block';
        showSessionBadge(false);
    });
}
