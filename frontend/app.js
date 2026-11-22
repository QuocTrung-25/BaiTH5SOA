const API = {
    AUTH: 'http://localhost:8080',
    PRODUCT: 'http://localhost:8081/products',
    ORDER: 'http://localhost:8082/orders',
    REPORT_ORDER: 'http://localhost:8083/reports/orders',
    REPORT_PRODUCT: 'http://localhost:8083/reports/products'
};

// Alias tương thích cho các script trang con
const API_CONFIG = {
    AUTH: 'http://localhost:8080',
    PRODUCT: 'http://localhost:8081/products',
    ORDER: 'http://localhost:8082/orders',
    REPORT: 'http://localhost:8083/reports'
};

const vnd = (n) => Number(n || 0).toLocaleString('vi-VN') + ' ₫';
const formatVND = vnd;

const getToken = () => localStorage.getItem('soa_token') || localStorage.getItem('jwt_token') || '';
const getUser = () => localStorage.getItem('soa_username') || localStorage.getItem('jwt_user') || '';

function saveAuthSession(token, userName) {
    localStorage.setItem('soa_token', token);
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('soa_username', userName);
    localStorage.setItem('jwt_user', userName);
}

function clearAuthSession() {
    ['soa_token', 'jwt_token', 'token', 'accessToken', 'soa_username', 'jwt_user', 'userName', 'username']
        .forEach(k => localStorage.removeItem(k));
}

function headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
}
const authHeaders = headers;

function notify(msg, isError = false) {
    const err = document.getElementById('alert-error');
    const ok = document.getElementById('alert-success');
    if (err) err.style.display = 'none';
    if (ok) ok.style.display = 'none';
    const el = isError === true || isError === 'error' ? err : ok;
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}
const showAlert = notify;

async function apiFetch(url, options = {}) {
    const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    if (res.status === 204) return null;
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
    if (!res.ok) throw new Error((data && data.message) || `Lỗi HTTP ${res.status}`);
    return data;
}

// --- 1. TỔNG QUAN (index.html) ---
async function initOverview() {
    const check = async (url, id) => {
        const dot = document.getElementById(id);
        if (!dot) return;
        try {
            const r = await fetch(url, { headers: headers() });
            dot.className = r.status < 500 ? 'status-dot online' : 'status-dot offline';
        } catch {
            dot.className = 'status-dot offline';
        }
    };
    await Promise.all([
        check(`${API.AUTH}/hello`, 'dot-auth'),
        check(API.PRODUCT, 'dot-product'),
        check(API.ORDER, 'dot-order'),
        check(API.REPORT_ORDER, 'dot-report')
    ]);

    try {
        const products = await apiFetch(API.PRODUCT);
        document.getElementById('stat-products-count').textContent = products.length;
    } catch {}

    try {
        const orders = await apiFetch(API.ORDER);
        document.getElementById('stat-orders-count').textContent = orders.length;
    } catch {}

    try {
        const reps = await apiFetch(API.REPORT_ORDER);
        const rev = reps.reduce((s, r) => s + Number(r.totalRevenue ?? r.total_revenue ?? 0), 0);
        const prof = reps.reduce((s, r) => s + Number(r.totalProfit ?? r.total_profit ?? 0), 0);
        document.getElementById('stat-revenue').textContent = vnd(rev);
        document.getElementById('stat-profit').textContent = vnd(prof);
    } catch {}
}

window.checkHealth = () => initOverview().then(() => notify('Đã kiểm tra trạng thái các cổng dịch vụ SOA!'));

// --- 2. AUTH (login/auth.html) ---
function initAuth() {
    const box = document.getElementById('current-token');
    if (box) box.value = getToken() || 'Chưa có token.';

    const form = document.getElementById('login-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const userName = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value.trim();
                const data = await apiFetch(`${API.AUTH}/api/v1/login`, {
                    method: 'POST',
                    body: JSON.stringify({ userName, password })
                });
                saveAuthSession(data.token, data.userName || userName);
                if (box) box.value = data.token;
                updateBadge();
                notify(data.message || 'Đăng nhập thành công!');
            } catch (err) {
                notify(err.message, true);
            }
        };
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const userName = document.getElementById('reg-username').value.trim();
                const password = document.getElementById('reg-password').value.trim();
                const data = await apiFetch(`${API.AUTH}/api/v1/register`, {
                    method: 'POST',
                    body: JSON.stringify({ userName, password })
                });
                notify(data.message || 'Đăng ký tài khoản thành công!');
                regForm.reset();
            } catch (err) {
                notify(err.message, true);
            }
        };
    }
}

window.logout = () => {
    clearAuthSession();
    const box = document.getElementById('current-token');
    if (box) box.value = 'Đã đăng xuất.';
    updateBadge();
    notify('Đã đăng xuất!');
};

window.testHelloToken = async () => {
    try {
        const data = await apiFetch(`${API.AUTH}/hello`);
        notify(`Token hợp lệ! Xin chào: ${data.userName}`);
    } catch (err) {
        notify(err.message, true);
    }
};

// --- 3. PRODUCTS (products/products.html) ---
async function initProducts() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    window.loadProducts = async () => {
        try {
            const list = await apiFetch(API.PRODUCT);
            tbody.innerHTML = list.length ? list.map(p => {
                const stock = p.quantity ?? 0;
                const stockClass = stock < 5 ? 'stock-low' : 'stock-ok';
                return `
                    <tr>
                        <td>${p.id}</td>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.description || '-'}</td>
                        <td>${vnd(p.price)}</td>
                        <td class="${stockClass}">${stock}</td>
                        <td>
                            <button class="btn btn-outline btn-sm" onclick='fillProduct(${JSON.stringify(p)})'>Sửa</button>
                            <button class="btn btn-danger btn-sm" onclick="removeProduct(${p.id})">Xóa</button>
                        </td>
                    </tr>
                `;
            }).join('') : '<tr><td colspan="6">Chưa có sản phẩm.</td></tr>';
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="6" style="color:red">${err.message}</td></tr>`;
        }
    };

    window.fillProduct = (p) => {
        const title = document.getElementById('product-form-title');
        if (title) title.textContent = `Cập nhật Sản phẩm #${p.id}`;
        document.getElementById('product-id').value = p.id;
        document.getElementById('product-name').value = p.name;
        document.getElementById('product-price').value = p.price;
        document.getElementById('product-stock').value = p.quantity ?? 0;
        document.getElementById('product-desc').value = p.description || '';
    };
    window.editProduct = window.fillProduct;

    window.resetProductForm = () => {
        const title = document.getElementById('product-form-title');
        if (title) title.textContent = 'Thêm Sản phẩm mới';
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
    };

    window.removeProduct = async (id) => {
        if (!confirm('Xóa sản phẩm này?')) return;
        try {
            await apiFetch(`${API.PRODUCT}/${id}`, { method: 'DELETE' });
            notify('Đã xóa sản phẩm!');
            loadProducts();
        } catch (err) { notify(err.message, true); }
    };
    window.deleteProduct = window.removeProduct;

    document.getElementById('product-form').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const body = JSON.stringify({
            name: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            quantity: parseInt(document.getElementById('product-stock').value, 10),
            description: document.getElementById('product-desc').value.trim()
        });
        try {
            await apiFetch(id ? `${API.PRODUCT}/${id}` : API.PRODUCT, { method: id ? 'PUT' : 'POST', body });
            notify(id ? 'Đã cập nhật sản phẩm!' : 'Đã thêm sản phẩm!');
            resetProductForm();
            loadProducts();
        } catch (err) { notify(err.message, true); }
    };

    loadProducts();
}

// --- 4. ORDERS (order/order.html) ---
async function initOrders() {
    const tbody = document.getElementById('orders-tbody');
    const select = document.getElementById('order-product-select');
    if (!tbody) return;

    const loadSelect = async () => {
        try {
            const list = await apiFetch(API.PRODUCT);
            select.innerHTML = list.map(p => `<option value="${p.id}">${p.name} (${vnd(p.price)} - Kho: ${p.quantity})</option>`).join('');
        } catch { select.innerHTML = '<option value="">Lỗi tải sản phẩm</option>'; }
    };

    window.loadOrders = async () => {
        try {
            const list = await apiFetch(API.ORDER);
            tbody.innerHTML = list.length ? list.map(o => {
                const st = (o.status || 'pending').toLowerCase();
                return `
                    <tr>
                        <td>#${o.id}</td>
                        <td><strong>${o.customerName || o.customer_name || '-'}</strong></td>
                        <td>${o.customerEmail || o.customer_email || '-'}</td>
                        <td><strong>${vnd(o.totalAmount || o.total_amount || 0)}</strong></td>
                        <td><span class="badge badge-${st}">${st.toUpperCase()}</span></td>
                        <td>${(o.createdAt || o.created_at) ? new Date(o.createdAt || o.created_at).toLocaleString('vi-VN') : '-'}</td>
                        <td>
                            <select class="status-select" onchange="changeOrderStatus(${o.id}, this.value)">
                                <option value="pending" ${st === 'pending' ? 'selected' : ''}>PENDING</option>
                                <option value="completed" ${st === 'completed' ? 'selected' : ''}>COMPLETED</option>
                                <option value="cancelled" ${st === 'cancelled' ? 'selected' : ''}>CANCELLED</option>
                            </select>
                            <button class="btn btn-danger btn-sm" onclick="removeOrder(${o.id})">Xóa</button>
                        </td>
                    </tr>
                `;
            }).join('') : '<tr><td colspan="7">Chưa có đơn hàng.</td></tr>';
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="color:red">${err.message}</td></tr>`;
        }
    };

    window.changeOrderStatus = async (id, status) => {
        try {
            await apiFetch(`${API.ORDER}/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
            notify(`Đơn #${id} -> ${status.toUpperCase()}`);
            loadOrders();
        } catch (err) { notify(err.message, true); }
    };
    window.updateOrderStatus = window.changeOrderStatus;

    window.removeOrder = async (id) => {
        if (!confirm('Xóa đơn hàng này?')) return;
        try {
            await apiFetch(`${API.ORDER}/${id}`, { method: 'DELETE' });
            notify('Đã xóa đơn hàng!');
            loadOrders();
        } catch (err) { notify(err.message, true); }
    };

    document.getElementById('order-form').onsubmit = async (e) => {
        e.preventDefault();
        const body = JSON.stringify({
            customerName: document.getElementById('order-customer').value.trim(),
            customerEmail: document.getElementById('order-email').value.trim(),
            items: [{
                productId: parseInt(select.value, 10),
                quantity: parseInt(document.getElementById('order-quantity').value, 10)
            }]
        });
        try {
            await apiFetch(API.ORDER, { method: 'POST', body });
            notify('Tạo đơn hàng thành công!');
            e.target.reset();
            loadOrders();
            loadSelect();
        } catch (err) { notify(err.message, true); }
    };

    loadSelect();
    loadOrders();
}

// --- 5. REPORTS (report/reports.html) ---
async function initReports() {
    const oBody = document.getElementById('order-reports-tbody');
    const pBody = document.getElementById('product-reports-tbody');
    if (!oBody) return;

    window.loadReports = async () => {
        try {
            const reps = await apiFetch(API.REPORT_ORDER);
            let rev = 0, cost = 0, prof = 0;
            oBody.innerHTML = reps.length ? reps.map(r => {
                const rRev = Number(r.totalRevenue ?? r.total_revenue ?? 0);
                const rCost = Number(r.totalCost ?? r.total_cost ?? 0);
                const rProf = Number(r.totalProfit ?? r.total_profit ?? 0);
                rev += rRev; cost += rCost; prof += rProf;
                return `
                    <tr>
                        <td>${r.id}</td>
                        <td>#${r.orderId ?? r.order_id}</td>
                        <td>${vnd(rRev)}</td>
                        <td>${vnd(rCost)}</td>
                        <td style="color:#10b981;font-weight:700">${vnd(rProf)}</td>
                        <td><button class="btn btn-danger btn-sm" onclick="removeOrderReport(${r.id})">Xóa</button></td>
                    </tr>
                `;
            }).join('') : '<tr><td colspan="6">Chưa có báo cáo đơn hàng.</td></tr>';

            document.getElementById('rep-revenue').textContent = vnd(rev);
            document.getElementById('rep-cost').textContent = vnd(cost);
            document.getElementById('rep-profit').textContent = vnd(prof);
        } catch (err) {
            oBody.innerHTML = `<tr><td colspan="6" style="color:red">${err.message}</td></tr>`;
        }

        try {
            const pReps = await apiFetch(API.REPORT_PRODUCT);
            pBody.innerHTML = pReps.length ? pReps.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td>#${p.orderReportId ?? p.order_report_id ?? '-'}</td>
                    <td>#${p.productId ?? p.product_id}</td>
                    <td>${p.productName ?? p.product_name ?? '-'}</td>
                    <td>${p.totalSold ?? p.total_sold ?? 0}</td>
                    <td>${vnd(p.revenue)}</td>
                    <td style="color:#10b981;font-weight:700">${vnd(p.profit)}</td>
                </tr>
            `).join('') : '<tr><td colspan="7">Chưa có báo cáo sản phẩm.</td></tr>';
        } catch (err) {
            pBody.innerHTML = `<tr><td colspan="7" style="color:red">${err.message}</td></tr>`;
        }
    };

    window.createManualReport = async () => {
        const orderId = document.getElementById('report-order-id').value;
        if (!orderId) return notify('Nhập Order ID cần tạo báo cáo!', true);
        try {
            await apiFetch(`${API.REPORT_ORDER}?orderId=${orderId}`, {
                method: 'POST',
                body: JSON.stringify({ orderId: Number(orderId) })
            });
            notify(`Đã tạo/cập nhật báo cáo cho đơn #${orderId}!`);
            loadReports();
        } catch (err) { notify(err.message, true); }
    };

    window.removeOrderReport = async (id) => {
        if (!confirm('Xóa báo cáo này?')) return;
        try {
            await apiFetch(`${API.REPORT_ORDER}/${id}`, { method: 'DELETE' });
            notify('Đã xóa báo cáo!');
            loadReports();
        } catch (err) { notify(err.message, true); }
    };

    loadReports();
}

function updateBadge() {
    const b = document.getElementById('user-badge-name');
    if (b) b.textContent = getUser() ? `${getUser()} (JWT)` : 'Chưa đăng nhập';
}

document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
    if (document.getElementById('stat-products-count')) initOverview();
    if (document.getElementById('login-form')) initAuth();
    if (document.getElementById('products-tbody')) initProducts();
    if (document.getElementById('orders-tbody')) initOrders();
    if (document.getElementById('order-reports-tbody')) initReports();
});