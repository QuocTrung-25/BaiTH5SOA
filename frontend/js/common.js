const API_CONFIG = {
    AUTH: 'http://localhost:8080',
    PRODUCT: 'http://localhost:8081',
    ORDER: 'http://localhost:8082',
    REPORT: 'http://localhost:8083'
};
localStorage.setItem('token', data.token);
localStorage.setItem('jwt_token', data.token);
localStorage.setItem('accessToken', data.token);
localStorage.setItem('userName', data.userName || username);
localStorage.setItem('username', data.userName || username);
function getToken() {
    return localStorage.getItem('jwt_token') || '';
}

function getUser() {
    return localStorage.getItem('jwt_user') || 'Chưa đăng nhập';
}

function setToken(token, username) {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('jwt_user', username);
}

function clearToken() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user');
}

async function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            showAlert('error', 'Yêu cầu token hợp lệ hoặc token đã hết hạn (401).');
        }
        return response;
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
    }
}

function showAlert(type, message) {
    const el = document.getElementById(type === 'error' ? 'alert-error' : 'alert-success');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
}

async function checkHealth() {
    const ping = async (url) => {
        try {
            const res = await fetch(url, { method: 'GET', mode: 'cors' });
            return res.ok || res.status === 401 || res.status === 403;
        } catch {
            return false;
        }
    };

    const [authOk, prodOk, orderOk, repOk] = await Promise.all([
        ping(`${API_CONFIG.AUTH}/api/v1/hello`),
        ping(`${API_CONFIG.PRODUCT}/products`),
        ping(`${API_CONFIG.ORDER}/orders`),
        ping(`${API_CONFIG.REPORT}/reports/orders`)
    ]);

    setDot('dot-auth', authOk);
    setDot('dot-product', prodOk);
    setDot('dot-order', orderOk);
    setDot('dot-report', repOk);
}

function setDot(id, ok) {
    const el = document.getElementById(id);
    if (el) {
        el.style.background = ok ? '#10b981' : '#ef4444';
        el.title = ok ? 'Đang hoạt động' : 'Không kết nối';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userBadge = document.getElementById('user-badge-name');
    if (userBadge) {
        userBadge.textContent = getUser();
    }
    checkHealth();
});
