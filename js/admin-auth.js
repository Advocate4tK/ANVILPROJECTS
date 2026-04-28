// ── Supabase Auth — username-based login ────────────────────────────────────

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

// Resolve username → email via assignor_profiles (anon SELECT)
async function _resolveUsernameToEmail(username) {
    const { data, error } = await supabaseClient.client
        .from('assignor_profiles')
        .select('email')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();
    if (error || !data) return null;
    return data.email;
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
    }

    // Login
    async function doLogin() {
        const username = (document.getElementById('adminUsername') || {}).value || '';
        const password = (document.getElementById('adminPassword') || {}).value || '';
        if (!username || !password) {
            loginError.textContent = 'Enter your username and password.';
            loginError.style.display = 'block';
            return;
        }
        const email = await _resolveUsernameToEmail(username);
        if (!email) {
            loginError.textContent = 'Username not found.';
            loginError.style.display = 'block';
            return;
        }
        try {
            const { data, error } = await supabaseClient.client.auth.signInWithPassword({ email, password });
            if (error || !data.session) {
                loginError.textContent = 'Incorrect username or password.';
                loginError.style.display = 'block';
                return;
            }

            // Check if account is suspended
            const { data: profile } = await supabaseClient.client
                .from('assignor_profiles')
                .select('suspended')
                .eq('id', data.user.id)
                .maybeSingle();
            if (profile?.suspended) {
                await supabaseClient.client.auth.signOut();
                loginError.textContent = 'This account has been suspended. Contact your administrator.';
                loginError.style.display = 'block';
                return;
            }

            loginError.style.display  = 'none';
            loginSection.style.display  = 'none';
            adminDashboard.style.display = 'block';
        } catch (e) {
            loginError.textContent = 'Login failed. Try again.';
            loginError.style.display = 'block';
        }
    }

    loginBtn && loginBtn.addEventListener('click', doLogin);

    // Enter key on either field
    ['adminUsername', 'adminPassword'].forEach(id => {
        const el = document.getElementById(id);
        el && el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    });

    // Forgot password — type username, resolves to email, sends reset link
    const forgotLink = document.getElementById('forgotLink');
    const forgotMsg  = document.getElementById('forgotMsg');
    forgotLink && forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = (document.getElementById('adminUsername') || {}).value || '';
        if (!username) {
            loginError.textContent = 'Enter your username first.';
            loginError.style.display = 'block';
            return;
        }
        const email = await _resolveUsernameToEmail(username);
        if (!email) {
            loginError.textContent = 'Username not found.';
            loginError.style.display = 'block';
            return;
        }
        const { error } = await supabaseClient.client.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://referee-tool.com/reset-password.html'
        });
        forgotMsg.style.display = 'block';
        forgotMsg.textContent = error ? 'Error: ' + error.message : 'Recovery email sent — check your inbox.';
    });

    // Logout
    logoutBtn && logoutBtn.addEventListener('click', async function() {
        await supabaseClient.client.auth.signOut();
        adminDashboard.style.display = 'none';
        loginSection.style.display  = 'block';
        showSessionBadge(false);
    });
}
