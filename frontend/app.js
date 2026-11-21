/**
 * SOA Microservices Hub - Frontend Application
 * Interacts with 4 microservices:
 * - Auth Service:      http://localhost:8080
 * - Product Service:   http://localhost:8081
 * - Order Service:     http://localhost:8082
 * - Reporting Service: http://localhost:8083
 */

const API_CONFIG = {
    AUTH: 'http://localhost:8080',
    PRODUCT: 'http://localhost:8081',
    ORDER: 'http://localhost:8082',
    REPORT: 'http://localhost:8083'
};

// Global State
let state = {
    token: localStorage.getItem('jwt_token') || '',
    username: localStorage.getItem('jwt_user') || '',
    products: [],
    orders: [],
    ordersReports: [],
    productReports: []
};

// Helper: HTTP request with JWT token
async function fetchWithAuth(url, options = {}) {
    const headers = options.headers || {};
    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    options.headers = headers;

    try {
        const response = await fetch(url, options);
        if (response.status === 401 || response.status === 403) {
            showAlert('error', 'Lỗi xác thực (401/403): Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
        }
        return response;
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
    }
}

// Alert helper
function showAlert(type, message) {
    const el = type === 'error' ? document.getElementById('global-error') : document.getElementById('global-success');
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => {
        el.style.display = 'none';
    }, 4500);
}

// Modal helper
window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
};

// ================= NAVIGATION & TAB SWITCHING =================
function initTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    const panes = document.querySelectorAll('.tab-pane');
    const pageTitle = document.getElementById('page-title');

    const titles = {
        overview: 'Tổng quan Hệ thống Kiến trúc SOA (4 Microservices)',
        auth: 'Auth Service (Lab 2 - Cổng :8080) - Xác Thực JWT',
        products: 'Product Service (Lab 3 - Cổng :8081) - Quản Lý Sản Phẩm',
        orders: 'Order Service (Lab 4 - Cổng :8082) - Quản Lý Đơn Hàng',
        reports: 'Reporting Service (Lab 5 - Cổng :8083) - Báo Cáo Doanh Thu & Lợi Nhuận'
    };

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            panes.forEach(pane => {
                pane.style.display = pane.id === `tab-${tabId}` ? 'block' : 'none';
            });

            if (pageTitle && titles[tabId]) {
                pageTitle.textContent = titles[tabId];
            }

            // Auto-refresh data when switching tabs
            if (tabId === 'products') loadProducts();
            if (tabId === 'orders') loadOrders();
            if (tabId === 'reports') { loadOrdersReports(); loadProductReports(); }
            if (tabId === 'overview') refreshDashboardMetrics();
        });
    });
}

// ================= SERVICE HEALTH CHECK =================
async function checkServiceHealth() {
    const check = async (url) => {
        try {
            const res = await fetch(url, { method: 'GET', mode: 'cors' });
            return res.ok || res.status === 401 || res.status === 403;
        } catch {
            return false;
        }
    };

    const [authOk, prodOk, orderOk, repOk] = await Promise.all([
        check(`${API_CONFIG.AUTH}/api/v1/hello`),
        check(`${API_CONFIG.PRODUCT}/products`),
        check(`${API_CONFIG.ORDER}/orders`),
        check(`${API_CONFIG.REPORT}/reports/orders`)
    ]);

    setDot('dot-auth', authOk);
    setDot('dot-product', prodOk);
    setDot('dot-order', orderOk);
    setDot('dot-report', repOk);

    if (authOk && prodOk && orderOk && repOk) {
        showAlert('success', 'Tất cả 4 Microservices (8080, 8081, 8082, 8083) đang hoạt động bình thường!');
    } else {
        showAlert('error', 'Một số microservice chưa được khởi chạy. Vui lòng kiểm tra console/terminal!');
    }
}

function setDot(elementId, isOnline) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.background = isOnline ? '#10b981' : '#ef4444';
    el.title = isOnline ? 'Online' : 'Offline / Unreachable';
}

// ================= AUTH SERVICE (:8080) =================
function initAuth() {
    const formLogin = document.getElementById('form-login');
    const tokenDisplay = document.getElementById('jwt-token-display');
    const authUsername = document.getElementById('auth-username');
    const btnCopyToken = document.getElementById('btn-copy-token');
    const btnTestAuth = document.getElementById('btn-test-auth');
    const btnLogout = document.getElementById('btn-logout');
    const testResult = document.getElementById('auth-test-result');

    function updateAuthUI() {
        if (state.token) {
            tokenDisplay.value = state.token;
            authUsername.textContent = state.username || 'admin (Đã xác thực)';
        } else {
            tokenDisplay.value = '';
            authUsername.textContent = 'Chưa đăng nhập';
        }
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        try {
            const res = await fetch(`${API_CONFIG.AUTH}/api/v1/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                throw new Error('Đăng nhập thất bại! Kiểm tra username/password.');
            }

            const data = await res.json();
            const token = data.token || data.accessToken || data.jwt;
            state.token = token;
            state.username = username;
            localStorage.setItem('jwt_token', token);
            localStorage.setItem('jwt_user', username);

            updateAuthUI();
            showAlert('success', `Đăng nhập thành công! Token đã được lưu.`);
        } catch (err) {
            showAlert('error', err.message || 'Lỗi kết nối tới Auth Service :8080');
        }
    });

    btnCopyToken.addEventListener('click', () => {
        if (!state.token) {
            showAlert('error', 'Chưa có Token để sao chép!');
            return;
        }
        navigator.clipboard.writeText(state.token);
        showAlert('success', 'Đã chép JWT Token vào clipboard!');
    });

    btnTestAuth.addEventListener('click', async () => {
        if (!state.token) {
            showAlert('error', 'Vui lòng đăng nhập trước khi gọi API bảo vệ!');
            return;
        }
        try {
            const res = await fetchWithAuth(`${API_CONFIG.AUTH}/api/v1/hello`);
            const text = await res.text();
            testResult.style.display = 'block';
            testResult.textContent = `Status: ${res.status}\nBody: ${text}`;
            if (res.ok) {
                showAlert('success', 'Kiểm tra token thành công với endpoint /api/v1/hello!');
            }
        } catch (err) {
            testResult.style.display = 'block';
            testResult.textContent = `Error: ${err.message}`;
            showAlert('error', 'Gọi /api/v1/hello thất bại!');
        }
    });

    btnLogout.addEventListener('click', () => {
        state.token = '';
        state.username = '';
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_user');
        updateAuthUI();
        if (testResult) testResult.style.display = 'none';
        showAlert('success', 'Đã đăng xuất / xóa Token thành công!');
    });

    updateAuthUI();
}

// ================= PRODUCT SERVICE (:8081) =================
async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    try {
        const res = await fetchWithAuth(`${API_CONFIG.PRODUCT}/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        state.products = data;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có sản phẩm nào trong cơ sở dữ liệu.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td><strong>${escapeHtml(p.name)}</strong></td>
                <td><small style="color: #64748b;">${escapeHtml(p.description || '-')}</small></td>
                <td><span style="color: #10b981; font-weight: 600;">$${Number(p.price).toFixed(2)}</span></td>
                <td><span class="badge ${p.quantity > 5 ? 'badge-completed' : (p.quantity > 0 ? 'badge-pending' : 'badge-cancelled')}">${p.quantity} chiếc</span></td>
                <td><small>${formatDate(p.createdAt)}</small></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="openEditProduct(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        refreshDashboardMetrics();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color: #ef4444;">Không thể tải sản phẩm từ :8081 (${err.message}).</td></tr>`;
    }
}

function initProducts() {
    const btnOpenCreate = document.getElementById('btn-open-create-product');
    const btnReload = document.getElementById('btn-reload-products');
    const formProduct = document.getElementById('form-product');
    const searchInput = document.getElementById('search-product');

    btnOpenCreate.addEventListener('click', () => {
        document.getElementById('modal-product-title').textContent = 'Thêm Sản Phẩm Mới';
        document.getElementById('product-id').value = '';
        document.getElementById('product-name').value = '';
        document.getElementById('product-description').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-quantity').value = '';
        openModal('modal-product');
    });

    btnReload.addEventListener('click', loadProducts);

    formProduct.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const payload = {
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            quantity: parseInt(document.getElementById('product-quantity').value, 10)
        };

        try {
            const url = id ? `${API_CONFIG.PRODUCT}/products/${id}` : `${API_CONFIG.PRODUCT}/products`;
            const method = id ? 'PUT' : 'POST';

            const res = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Lỗi lưu sản phẩm');
            }

            closeModal('modal-product');
            showAlert('success', id ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm mới thành công!');
            loadProducts();
        } catch (err) {
            showAlert('error', err.message);
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#products-table-body tr');
        rows.forEach(r => {
            r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    });
}

window.openEditProduct = function(id) {
    const p = state.products.find(item => item.id === id);
    if (!p) return;
    document.getElementById('modal-product-title').textContent = `Chỉnh Sửa Sản Phẩm #${p.id}`;
    document.getElementById('product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-description').value = p.description || '';
    document.getElementById('product-price').value = p.price;
    document.getElementById('product-quantity').value = p.quantity;
    openModal('modal-product');
};

window.deleteProduct = async function(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm #${id}?`)) return;
    try {
        const res = await fetchWithAuth(`${API_CONFIG.PRODUCT}/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa sản phẩm');
        showAlert('success', `Đã xóa sản phẩm #${id}`);
        loadProducts();
    } catch (err) {
        showAlert('error', err.message);
    }
};

// ================= ORDER SERVICE (:8082) =================
async function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    try {
        const res = await fetchWithAuth(`${API_CONFIG.ORDER}/orders`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        state.orders = data;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có đơn hàng nào được tạo.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(o => `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td><strong>${escapeHtml(o.customerName)}</strong></td>
                <td><small style="color: #64748b;">${escapeHtml(o.customerEmail)}</small></td>
                <td><strong style="color: #2563eb;">$${Number(o.totalAmount).toFixed(2)}</strong></td>
                <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
                <td><small>${formatDate(o.createdAt)}</small></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="viewOrderDetails(${o.id})" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-secondary btn-sm" onclick="promptUpdateOrderStatus(${o.id}, '${o.status}')" title="Đổi trạng thái"><i class="fas fa-tasks"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrder(${o.id})" title="Xóa đơn"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        refreshDashboardMetrics();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color: #ef4444;">Không thể tải danh sách đơn hàng từ :8082 (${err.message}).</td></tr>`;
    }
}

function initOrders() {
    const btnOpenCreate = document.getElementById('btn-open-create-order');
    const btnReload = document.getElementById('btn-reload-orders');
    const btnAddItem = document.getElementById('btn-add-order-item');
    const formOrder = document.getElementById('form-order');
    const searchInput = document.getElementById('search-order');

    btnReload.addEventListener('click', loadOrders);

    btnOpenCreate.addEventListener('click', async () => {
        // Ensure fresh products list for selecting
        await loadProducts();
        document.getElementById('order-customer-name').value = '';
        document.getElementById('order-customer-email').value = '';
        const container = document.getElementById('order-items-container');
        container.innerHTML = '';
        addOrderItemRow();
        updateOrderEstimatedTotal();
        openModal('modal-order');
    });

    btnAddItem.addEventListener('click', () => {
        addOrderItemRow();
    });

    formOrder.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rows = document.querySelectorAll('.order-item-row');
        if (rows.length === 0) {
            showAlert('error', 'Vui lòng thêm ít nhất 1 mặt hàng vào đơn!');
            return;
        }

        const items = [];
        for (const row of rows) {
            const select = row.querySelector('.item-product-select');
            const qtyInput = row.querySelector('.item-quantity-input');
            const prodId = parseInt(select.value, 10);
            const qty = parseInt(qtyInput.value, 10);
            if (!prodId || isNaN(qty) || qty <= 0) {
                showAlert('error', 'Vui lòng chọn sản phẩm và số lượng hợp lệ!');
                return;
            }
            items.push({ productId: prodId, quantity: qty });
        }

        const payload = {
            customerName: document.getElementById('order-customer-name').value.trim(),
            customerEmail: document.getElementById('order-customer-email').value.trim(),
            items: items
        };

        try {
            const res = await fetchWithAuth(`${API_CONFIG.ORDER}/orders`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Lỗi tạo đơn hàng');
            }

            closeModal('modal-order');
            showAlert('success', 'Tạo đơn hàng mới thành công!');
            loadOrders();
            loadProducts(); // Stock was decremented
        } catch (err) {
            showAlert('error', err.message);
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#orders-table-body tr');
        rows.forEach(r => {
            r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    });
}

function addOrderItemRow() {
    const container = document.getElementById('order-items-container');
    const row = document.createElement('div');
    row.className = 'order-item-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '2fr 1fr 1fr auto';
    row.style.gap = '8px';
    row.style.alignItems = 'center';

    let productOptions = '<option value="">-- Chọn Sản Phẩm --</option>';
    state.products.forEach(p => {
        productOptions += `<option value="${p.id}" data-price="${p.price}" data-stock="${p.quantity}">${escapeHtml(p.name)} ($${p.price} | Tồn: ${p.quantity})</option>`;
    });

    row.innerHTML = `
        <select class="form-control item-product-select" required>${productOptions}</select>
        <input type="number" min="1" value="1" class="form-control item-quantity-input" placeholder="SL" required>
        <div class="item-subtotal" style="font-weight: 600; text-align: right; color: #10b981;">$0.00</div>
        <button type="button" class="btn btn-outline btn-sm" style="color: #ef4444;" onclick="this.parentElement.remove(); updateOrderEstimatedTotal();">&times;</button>
    `;

    const select = row.querySelector('.item-product-select');
    const qty = row.querySelector('.item-quantity-input');

    const updateSubtotal = () => {
        const selectedOpt = select.options[select.selectedIndex];
        const price = selectedOpt ? parseFloat(selectedOpt.getAttribute('data-price') || 0) : 0;
        const q = parseInt(qty.value, 10) || 0;
        row.querySelector('.item-subtotal').textContent = `$${(price * q).toFixed(2)}`;
        updateOrderEstimatedTotal();
    };

    select.addEventListener('change', updateSubtotal);
    qty.addEventListener('input', updateSubtotal);

    container.appendChild(row);
}

function updateOrderEstimatedTotal() {
    let total = 0;
    const rows = document.querySelectorAll('.order-item-row');
    rows.forEach(row => {
        const select = row.querySelector('.item-product-select');
        const qty = row.querySelector('.item-quantity-input');
        const opt = select.options[select.selectedIndex];
        const price = opt ? parseFloat(opt.getAttribute('data-price') || 0) : 0;
        const q = parseInt(qty.value, 10) || 0;
        total += price * q;
    });
    document.getElementById('order-estimated-total').textContent = `$${total.toFixed(2)}`;
}

window.viewOrderDetails = async function(orderId) {
    try {
        const [resOrder, resItems] = await Promise.all([
            fetchWithAuth(`${API_CONFIG.ORDER}/orders/${orderId}`),
            fetchWithAuth(`${API_CONFIG.ORDER}/order_items?orderId=${orderId}`)
        ]);

        if (!resOrder.ok) throw new Error('Không tìm thấy thông tin đơn hàng');
        const order = await resOrder.json();
        const items = resItems.ok ? await resItems.json() : [];

        document.getElementById('detail-order-id').textContent = order.id;
        document.getElementById('detail-customer-name').textContent = order.customerName;
        document.getElementById('detail-customer-email').textContent = order.customerEmail;
        document.getElementById('detail-order-status').innerHTML = `<span class="badge badge-${order.status.toLowerCase()}">${order.status}</span>`;
        document.getElementById('detail-order-total').textContent = `$${Number(order.totalAmount).toFixed(2)}`;
        document.getElementById('detail-order-created').textContent = formatDate(order.createdAt);

        const tbody = document.getElementById('detail-items-table-body');
        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Đơn hàng chưa có chi tiết mặt hàng.</td></tr>';
        } else {
            tbody.innerHTML = items.map(item => `
                <tr>
                    <td><strong>${escapeHtml(item.productName)}</strong></td>
                    <td><code>#${item.productId}</code></td>
                    <td>$${Number(item.unitPrice).toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td><strong style="color: #2563eb;">$${Number(item.totalPrice).toFixed(2)}</strong></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteOrderItem(${item.id}, ${orderId})" title="Xóa mặt hàng"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }

        const btnAddItem = document.getElementById('btn-add-item-to-existing-order');
        btnAddItem.onclick = () => promptAddOrderItem(orderId);

        openModal('modal-order-detail');
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.promptUpdateOrderStatus = async function(orderId, currentStatus) {
    const newStatus = prompt(`Cập nhật trạng thái đơn hàng #${orderId} (pending, completed, cancelled):`, currentStatus);
    if (!newStatus || newStatus === currentStatus) return;

    try {
        const res = await fetchWithAuth(`${API_CONFIG.ORDER}/orders/${orderId}?status=${encodeURIComponent(newStatus.toLowerCase())}`, {
            method: 'PUT'
        });
        if (!res.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng');
        showAlert('success', `Đã cập nhật trạng thái đơn #${orderId} thành "${newStatus}"`);
        loadOrders();
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.deleteOrder = async function(orderId) {
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${orderId}? Toàn bộ chi tiết mặt hàng sẽ bị xóa theo!`)) return;
    try {
        const res = await fetchWithAuth(`${API_CONFIG.ORDER}/orders/${orderId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa đơn hàng');
        showAlert('success', `Đã xóa thành công đơn hàng #${orderId}`);
        loadOrders();
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.deleteOrderItem = async function(itemId, orderId) {
    if (!confirm(`Xóa mặt hàng #${itemId} khỏi đơn?`)) return;
    try {
        const res = await fetchWithAuth(`${API_CONFIG.ORDER}/order_items/${itemId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa mặt hàng');
        showAlert('success', `Đã xóa mặt hàng #${itemId}`);
        viewOrderDetails(orderId);
        loadOrders();
    } catch (err) {
        showAlert('error', err.message);
    }
};

async function promptAddOrderItem(orderId) {
    await loadProducts();
    const prodPrompt = state.products.map(p => `${p.id}: ${p.name} ($${p.price})`).join('\n');
    const selectedProdIdStr = prompt(`Chọn mã sản phẩm muốn thêm vào đơn #${orderId}:\n${prodPrompt}`);
    if (!selectedProdIdStr) return;
    const prodId = parseInt(selectedProdIdStr, 10);
    const prod = state.products.find(p => p.id === prodId);
    if (!prod) {
        showAlert('error', 'Sản phẩm không hợp lệ!');
        return;
    }

    const qtyStr = prompt(`Nhập số lượng cho "${prod.name}":`, '1');
    if (!qtyStr) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) {
        showAlert('error', 'Số lượng không hợp lệ!');
        return;
    }

    try {
        const payload = {
            orderId: orderId,
            productId: prod.id,
            productName: prod.name,
            quantity: qty,
            unitPrice: prod.price
        };
        const res = await fetchWithAuth(`${API_CONFIG.ORDER}/order_items`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Không thể thêm mặt hàng vào đơn');
        showAlert('success', 'Đã thêm mặt hàng thành công!');
        viewOrderDetails(orderId);
        loadOrders();
    } catch (err) {
        showAlert('error', err.message);
    }
}

// ================= REPORTING SERVICE (:8083) =================
async function loadOrdersReports() {
    const tbody = document.getElementById('orders-reports-table-body');
    try {
        const res = await fetchWithAuth(`${API_CONFIG.REPORT}/reports/orders`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        state.ordersReports = data;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Chưa có báo cáo đơn hàng nào. Hãy bấm "Tạo Báo Cáo Mới".</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(r => `
            <tr>
                <td><strong>#${r.id}</strong></td>
                <td><button class="btn btn-outline btn-sm" onclick="viewOrderDetails(${r.orderId})">Đơn #${r.orderId}</button></td>
                <td><span style="font-weight: 600; color: #2563eb;">$${Number(r.totalRevenue).toFixed(2)}</span></td>
                <td><span style="color: #ef4444;">$${Number(r.totalCost).toFixed(2)}</span></td>
                <td><span style="font-weight: 700; color: #10b981;">+$${Number(r.totalProfit).toFixed(2)}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrderReport(${r.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        refreshDashboardMetrics();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="color: #ef4444;">Không thể tải báo cáo từ :8083 (${err.message}).</td></tr>`;
    }
}

async function loadProductReports() {
    const tbody = document.getElementById('products-reports-table-body');
    try {
        const res = await fetchWithAuth(`${API_CONFIG.REPORT}/reports/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        state.productReports = data;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Chưa có báo cáo sản phẩm nào.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(r => `
            <tr>
                <td><strong>#${r.id}</strong></td>
                <td>BC Đơn #${r.orderReportId}</td>
                <td>SP #${r.productId}</td>
                <td><strong>${r.totalSold}</strong></td>
                <td>$${Number(r.revenue).toFixed(2)}</td>
                <td>$${Number(r.cost).toFixed(2)}</td>
                <td><span style="font-weight: 700; color: #10b981;">+$${Number(r.profit).toFixed(2)}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteProductReport(${r.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color: #ef4444;">Không thể tải báo cáo sản phẩm (${err.message}).</td></tr>`;
    }
}

function initReports() {
    const btnSubOrder = document.getElementById('subtab-btn-orders-report');
    const btnSubProd = document.getElementById('subtab-btn-products-report');
    const panelOrder = document.getElementById('subpanel-orders-reports');
    const panelProd = document.getElementById('subpanel-products-reports');
    const btnOpenCreate = document.getElementById('btn-open-create-report');
    const reportTypeSelect = document.getElementById('report-type');
    const fieldsOrder = document.getElementById('fields-order-report');
    const fieldsProd = document.getElementById('fields-product-report');
    const formReport = document.getElementById('form-create-report');

    btnSubOrder.addEventListener('click', () => {
        btnSubOrder.className = 'btn btn-primary';
        btnSubProd.className = 'btn btn-outline';
        panelOrder.style.display = 'block';
        panelProd.style.display = 'none';
        loadOrdersReports();
    });

    btnSubProd.addEventListener('click', () => {
        btnSubOrder.className = 'btn btn-outline';
        btnSubProd.className = 'btn btn-primary';
        panelOrder.style.display = 'none';
        panelProd.style.display = 'block';
        loadProductReports();
    });

    reportTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'order') {
            fieldsOrder.style.display = 'block';
            fieldsProd.style.display = 'none';
        } else {
            fieldsOrder.style.display = 'none';
            fieldsProd.style.display = 'block';
        }
    });

    btnOpenCreate.addEventListener('click', async () => {
        await Promise.all([loadOrders(), loadProducts(), loadOrdersReports()]);

        // Populate Order select
        const orderSelect = document.getElementById('report-order-id');
        orderSelect.innerHTML = state.orders.map(o => `
            <option value="${o.id}">Đơn #${o.id} - ${escapeHtml(o.customerName)} ($${o.totalAmount} - ${o.status})</option>
        `).join('') || '<option value="">(Chưa có đơn hàng nào)</option>';

        // Populate Order Report select
        const repOrderSelect = document.getElementById('report-product-order-report-id');
        repOrderSelect.innerHTML = state.ordersReports.map(r => `
            <option value="${r.id}">Báo cáo #${r.id} (Đơn #${r.orderId})</option>
        `).join('') || '<option value="">(Chưa có báo cáo đơn hàng)</option>';

        // Populate Product select
        const prodSelect = document.getElementById('report-product-id');
        prodSelect.innerHTML = state.products.map(p => `
            <option value="${p.id}">#${p.id} - ${escapeHtml(p.name)} ($${p.price})</option>
        `).join('') || '<option value="">(Chưa có sản phẩm)</option>';

        openModal('modal-report');
    });

    formReport.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = reportTypeSelect.value;

        try {
            if (type === 'order') {
                const orderId = document.getElementById('report-order-id').value;
                if (!orderId) throw new Error('Vui lòng chọn đơn hàng!');

                const res = await fetchWithAuth(`${API_CONFIG.REPORT}/reports/orders?orderId=${orderId}`, {
                    method: 'POST'
                });
                if (!res.ok) throw new Error('Không thể tạo báo cáo đơn hàng');
                showAlert('success', `Đã tạo báo cáo cho đơn hàng #${orderId}`);
                loadOrdersReports();
            } else {
                const orderReportId = document.getElementById('report-product-order-report-id').value;
                const productId = document.getElementById('report-product-id').value;
                const totalSold = parseInt(document.getElementById('report-product-sold').value, 10);

                if (!orderReportId || !productId) throw new Error('Vui lòng điền đủ thông tin báo cáo sản phẩm!');

                const res = await fetchWithAuth(`${API_CONFIG.REPORT}/reports/products?orderReportId=${orderReportId}&productId=${productId}&totalSold=${totalSold}`, {
                    method: 'POST'
                });
                if (!res.ok) throw new Error('Không thể tạo báo cáo sản phẩm');
                showAlert('success', `Đã tạo báo cáo sản phẩm #${productId}`);
                loadProductReports();
            }
            closeModal('modal-report');
        } catch (err) {
            showAlert('error', err.message);
        }
    });
}

window.deleteOrderReport = async function(id) {
    if (!confirm(`Xóa báo cáo đơn hàng #${id}?`)) return;
    try {
        const res = await fetchWithAuth(`${API_CONFIG.REPORT}/reports/orders/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa báo cáo đơn hàng');
        showAlert('success', `Đã xóa báo cáo đơn hàng #${id}`);
        loadOrdersReports();
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.deleteProductReport = async function(id) {
    if (!confirm(`Xóa báo cáo sản phẩm #${id}?`)) return;
    try {
        const res = await fetchWithAuth(`${API_CONFIG.REPORT}/reports/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa báo cáo sản phẩm');
        showAlert('success', `Đã xóa báo cáo sản phẩm #${id}`);
        loadProductReports();
    } catch (err) {
        showAlert('error', err.message);
    }
};

// ================= OVERVIEW METRICS =================
function refreshDashboardMetrics() {
    const prodCountEl = document.getElementById('stat-products-count');
    const orderCountEl = document.getElementById('stat-orders-count');
    const revEl = document.getElementById('stat-revenue');
    const profitEl = document.getElementById('stat-profit');

    if (prodCountEl) prodCountEl.textContent = state.products.length;
    if (orderCountEl) orderCountEl.textContent = state.orders.length;

    let totalRev = 0;
    let totalProfit = 0;
    state.ordersReports.forEach(r => {
        totalRev += parseFloat(r.totalRevenue || 0);
        totalProfit += parseFloat(r.totalProfit || 0);
    });

    if (revEl) revEl.textContent = `$${totalRev.toFixed(2)}`;
    if (profitEl) profitEl.textContent = `$${totalProfit.toFixed(2)}`;
}

// Utilities
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAuth();
    initProducts();
    initOrders();
    initReports();

    document.getElementById('btn-check-health').addEventListener('click', checkServiceHealth);

    // Initial load
    checkServiceHealth();
    loadProducts();
    loadOrders();
    loadOrdersReports();
    loadProductReports();
});
