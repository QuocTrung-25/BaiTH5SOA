document.addEventListener('DOMContentLoaded', () => {
    // API Endpoints
    const AUTH_URL = 'http://localhost:8080/api/v1/auth/login';
    const AUTH_FALLBACK_URL = 'http://localhost:8080/auth';
    const PRODUCT_URL = 'http://localhost:8081/products';
    const ORDERS_URL = '/orders';
    const ORDER_ITEMS_URL = '/order_items';

    // State
    let authToken = localStorage.getItem('order_jwt_token') || '';
    let currentUsername = localStorage.getItem('order_username') || '';
    let cachedProducts = [];
    let currentNewOrderItems = [];
    let activeViewingOrderId = null;

    // Elements
    const userDisplay = document.getElementById('user-display');
    const btnLoginModal = document.getElementById('btn-login-modal');
    const btnLogout = document.getElementById('btn-logout');
    const globalAlert = document.getElementById('global-alert');

    // Navigation
    const navOrders = document.getElementById('nav-orders');
    const navItems = document.getElementById('nav-items');
    const viewOrders = document.getElementById('view-orders');
    const viewItems = document.getElementById('view-items');
    const pageTitle = document.getElementById('page-title');

    // Init UI State
    updateAuthUI();

    // Event Listeners for Nav
    navOrders.addEventListener('click', () => {
        navOrders.classList.add('active');
        navItems.classList.remove('active');
        viewOrders.style.display = 'block';
        viewItems.style.display = 'none';
        pageTitle.textContent = 'Quản lý Đơn hàng (Orders)';
        loadOrders();
    });

    navItems.addEventListener('click', () => {
        navItems.classList.add('active');
        navOrders.classList.remove('active');
        viewOrders.style.display = 'none';
        viewItems.style.display = 'block';
        pageTitle.textContent = 'Chi tiết tất cả mặt hàng (Order Items)';
        loadAllOrderItems();
    });

    // Modals
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            closeModal(modalId);
        });
    });

    function openModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    }

    function closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }

    // Auth Handlers
    btnLoginModal.addEventListener('click', () => openModal('modal-login'));
    btnLogout.addEventListener('click', () => {
        authToken = '';
        currentUsername = '';
        localStorage.removeItem('order_jwt_token');
        localStorage.removeItem('order_username');
        updateAuthUI();
        showAlert('Đã đăng xuất thành công.', 'success');
        loadOrders();
    });

    document.getElementById('btn-submit-login').addEventListener('click', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('login-username').value.trim();
        const passwordInput = document.getElementById('login-password').value.trim();
        const rawTokenInput = document.getElementById('login-raw-token').value.trim();
        const loginAlert = document.getElementById('login-alert');

        loginAlert.style.display = 'none';

        if (rawTokenInput) {
            authToken = rawTokenInput;
            currentUsername = usernameInput || 'Custom JWT';
            localStorage.setItem('order_jwt_token', authToken);
            localStorage.setItem('order_username', currentUsername);
            closeModal('modal-login');
            updateAuthUI();
            showAlert('Đã lưu JWT Token thành công!', 'success');
            loadOrders();
            loadProductsCatalog();
            return;
        }

        try {
            let res = await fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password: passwordInput })
            });

            if (!res.ok) {
                // Try fallback auth endpoint
                res = await fetch(AUTH_FALLBACK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userName: usernameInput, password: passwordInput })
                });
            }

            if (!res.ok) {
                throw new Error('Sai tài khoản hoặc mật khẩu (hoặc Auth Service chưa chạy)');
            }

            const data = await res.json();
            authToken = data.token;
            currentUsername = usernameInput;
            localStorage.setItem('order_jwt_token', authToken);
            localStorage.setItem('order_username', currentUsername);

            closeModal('modal-login');
            updateAuthUI();
            showAlert('Đăng nhập thành công! Chào mừng ' + currentUsername, 'success');
            loadOrders();
            loadProductsCatalog();
        } catch (err) {
            loginAlert.textContent = err.message;
            loginAlert.style.display = 'block';
        }
    });

    function updateAuthUI() {
        if (authToken) {
            userDisplay.textContent = currentUsername || 'Đã xác thực';
            btnLoginModal.style.display = 'none';
            btnLogout.style.display = 'inline-flex';
        } else {
            userDisplay.textContent = 'Chưa đăng nhập';
            btnLoginModal.style.display = 'inline-flex';
            btnLogout.style.display = 'none';
        }
    }

    function getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        return headers;
    }

    function showAlert(msg, type = 'danger') {
        globalAlert.className = `alert alert-${type}`;
        globalAlert.textContent = msg;
        globalAlert.style.display = 'block';
        setTimeout(() => {
            globalAlert.style.display = 'none';
        }, 5000);
    }

    function formatCurrency(num) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleString('vi-VN');
        } catch (e) {
            return dateStr;
        }
    }

    // --- Product Service Integration ---
    async function loadProductsCatalog() {
        try {
            const res = await fetch(PRODUCT_URL, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                cachedProducts = await res.json();
                populateProductSelects();
            }
        } catch (e) {
            console.warn('Could not fetch products catalog from :8081', e);
        }
    }

    function populateProductSelects() {
        const selects = [
            document.getElementById('select-product'),
            document.getElementById('detail-select-product')
        ];

        selects.forEach(select => {
            if (!select) return;
            select.innerHTML = '<option value="">-- Chọn sản phẩm từ Product Service --</option>';
            cachedProducts.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.name} - ${formatCurrency(p.price)} (Tồn: ${p.quantity})`;
                select.appendChild(opt);
            });
        });
    }

    // --- Load Orders ---
    async function loadOrders() {
        const tbody = document.getElementById('orders-tbody');
        try {
            const res = await fetch(ORDERS_URL, {
                headers: getAuthHeaders()
            });

            if (res.status === 401) {
                tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Vui lòng <strong>đăng nhập tài khoản</strong> để xem danh sách đơn hàng.</td></tr>`;
                return;
            }

            if (!res.ok) {
                throw new Error('Không thể tải danh sách đơn hàng (HTTP ' + res.status + ')');
            }

            const orders = await res.json();
            renderOrders(orders);
            updateOrderStats(orders);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color: var(--danger);">${err.message}</td></tr>`;
        }
    }

    function renderOrders(orders) {
        const tbody = document.getElementById('orders-tbody');
        if (!orders || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Chưa có đơn hàng nào trong hệ thống.</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const itemsCount = (o.items && o.items.length) || 0;
            const badgeClass = `badge badge-${(o.status || 'pending').toLowerCase()}`;
            return `
                <tr>
                    <td><strong>#${o.id}</strong></td>
                    <td>${escapeHtml(o.customer_name || o.customerName || '')}</td>
                    <td>${escapeHtml(o.customer_email || o.customerEmail || '')}</td>
                    <td><span class="badge" style="background: #f1f5f9; color: #475569;">${itemsCount} SP</span></td>
                    <td style="font-weight: 600; color: var(--primary);">${formatCurrency(o.total_amount || o.totalAmount)}</td>
                    <td>
                        <select class="form-control btn-sm" style="width: auto; font-size: 12px;" onchange="window.updateOrderStatus(${o.id}, this.value)">
                            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                            <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
                            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                        </select>
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted);">${formatDate(o.created_at || o.createdAt)}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-outline btn-sm" onclick="window.viewOrderDetails(${o.id})">🔍 Xem</button>
                        <button class="btn btn-danger btn-sm" onclick="window.deleteOrder(${o.id})">🗑 Xóa</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updateOrderStats(orders) {
        let total = orders.length;
        let pending = 0;
        let completed = 0;
        let revenue = 0;

        orders.forEach(o => {
            const st = (o.status || '').toLowerCase();
            if (st === 'pending') pending++;
            if (st === 'completed') {
                completed++;
                revenue += Number(o.total_amount || o.totalAmount || 0);
            }
        });

        document.getElementById('stat-total-orders').textContent = total;
        document.getElementById('stat-pending-orders').textContent = pending;
        document.getElementById('stat-completed-orders').textContent = completed;
        document.getElementById('stat-total-revenue').textContent = formatCurrency(revenue);
    }

    // --- Create Order Flow ---
    const btnOpenCreateOrder = document.getElementById('btn-open-create-order');
    btnOpenCreateOrder.addEventListener('click', () => {
        if (!authToken) {
            showAlert('Vui lòng đăng nhập trước khi tạo đơn hàng!');
            openModal('modal-login');
            return;
        }
        currentNewOrderItems = [];
        renderCreateItemsTable();
        loadProductsCatalog();
        openModal('modal-create-order');
    });

    const selectProduct = document.getElementById('select-product');
    const inputProductQuantity = document.getElementById('input-product-quantity');
    const productStockHint = document.getElementById('product-stock-hint');

    selectProduct.addEventListener('change', () => {
        const prodId = parseInt(selectProduct.value);
        const prod = cachedProducts.find(p => p.id === prodId);
        if (prod) {
            productStockHint.textContent = `Tồn kho hiện có: ${prod.quantity} chiếc | Giá: ${formatCurrency(prod.price)}`;
        } else {
            productStockHint.textContent = '';
        }
    });

    document.getElementById('btn-add-item-to-table').addEventListener('click', () => {
        const prodId = parseInt(selectProduct.value);
        const qty = parseInt(inputProductQuantity.value);

        if (!prodId) {
            alert('Vui lòng chọn sản phẩm!');
            return;
        }
        if (!qty || qty <= 0) {
            alert('Số lượng phải lớn hơn 0!');
            return;
        }

        const prod = cachedProducts.find(p => p.id === prodId);
        if (prod && qty > prod.quantity) {
            alert(`Sản phẩm '${prod.name}' chỉ còn ${prod.quantity} chiếc trong kho!`);
            return;
        }

        // Check if item already in table
        const existing = currentNewOrderItems.find(i => i.productId === prodId);
        if (existing) {
            existing.quantity += qty;
        } else {
            currentNewOrderItems.push({
                productId: prodId,
                name: prod ? prod.name : `SP #${prodId}`,
                price: prod ? prod.price : 0,
                quantity: qty
            });
        }

        renderCreateItemsTable();
    });

    function renderCreateItemsTable() {
        const tbody = document.getElementById('create-items-tbody');
        const totalElem = document.getElementById('create-total-amount');

        if (currentNewOrderItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="padding: 16px;">Chưa chọn mặt hàng nào. Có thể tạo đơn rỗng hoặc thêm sản phẩm.</td></tr>`;
            totalElem.textContent = '0 ₫';
            return;
        }

        let sum = 0;
        tbody.innerHTML = currentNewOrderItems.map((item, idx) => {
            const subtotal = item.price * item.quantity;
            sum += subtotal;
            return `
                <tr>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(subtotal)}</td>
                    <td style="text-align: right;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="window.removeCreateItem(${idx})">✖</button>
                    </td>
                </tr>
            `;
        }).join('');

        totalElem.textContent = formatCurrency(sum);
    }

    window.removeCreateItem = function(idx) {
        currentNewOrderItems.splice(idx, 1);
        renderCreateItemsTable();
    };

    document.getElementById('btn-submit-create-order').addEventListener('click', async () => {
        const name = document.getElementById('create-customer-name').value.trim();
        const email = document.getElementById('create-customer-email').value.trim();
        const status = document.getElementById('create-order-status').value;
        const alertBox = document.getElementById('create-order-alert');

        alertBox.style.display = 'none';

        if (!name || !email) {
            alertBox.textContent = 'Vui lòng nhập họ tên và email khách hàng.';
            alertBox.style.display = 'block';
            return;
        }

        const payload = {
            customer_name: name,
            customer_email: email,
            status: status,
            items: currentNewOrderItems.map(i => ({
                product_id: i.productId,
                quantity: i.quantity
            }))
        };

        try {
            const res = await fetch(ORDERS_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Lỗi khi tạo đơn hàng');
            }

            closeModal('modal-create-order');
            showAlert(`Đã tạo thành công đơn hàng #${data.id}!`, 'success');
            document.getElementById('form-create-order').reset();
            currentNewOrderItems = [];
            loadOrders();
            loadProductsCatalog();
        } catch (err) {
            alertBox.textContent = err.message;
            alertBox.style.display = 'block';
        }
    });

    // --- Order Details Modal ---
    window.viewOrderDetails = async function(orderId) {
        activeViewingOrderId = orderId;
        openModal('modal-order-details');

        document.getElementById('detail-order-id').textContent = orderId;
        const alertBox = document.getElementById('detail-order-alert');
        alertBox.style.display = 'none';

        await refreshOrderDetailsView();
    };

    async function refreshOrderDetailsView() {
        if (!activeViewingOrderId) return;
        try {
            const res = await fetch(`${ORDERS_URL}/${activeViewingOrderId}`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Không thể tải chi tiết đơn hàng');

            const order = await res.json();
            document.getElementById('detail-customer-name').textContent = order.customer_name || order.customerName || '';
            document.getElementById('detail-customer-email').textContent = order.customer_email || order.customerEmail || '';
            document.getElementById('detail-status-badge').innerHTML = `<span class="badge badge-${(order.status || '').toLowerCase()}">${order.status}</span>`;
            document.getElementById('detail-total-amount').textContent = formatCurrency(order.total_amount || order.totalAmount);
            document.getElementById('detail-created-at').textContent = formatDate(order.created_at || order.createdAt);

            const tbody = document.getElementById('detail-items-tbody');
            if (!order.items || order.items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Đơn hàng này chưa có mặt hàng nào.</td></tr>`;
            } else {
                tbody.innerHTML = order.items.map(item => `
                    <tr>
                        <td>#${item.product_id || item.productId}</td>
                        <td><strong>${escapeHtml(item.product_name || item.productName || '')}</strong></td>
                        <td>${formatCurrency(item.unit_price || item.unitPrice)}</td>
                        <td>
                            <input type="number" min="1" value="${item.quantity}" style="width: 60px; padding: 4px;"
                                   onchange="window.updateItemQuantity(${item.id}, this.value)">
                        </td>
                        <td style="font-weight: 600;">${formatCurrency(item.total_price || item.totalPrice)}</td>
                        <td style="text-align: right;">
                            <button class="btn btn-danger btn-sm" onclick="window.deleteItemFromOrder(${item.id})">🗑 Xóa</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            document.getElementById('detail-items-tbody').innerHTML = `<tr><td colspan="6" class="empty-state" style="color: var(--danger);">${e.message}</td></tr>`;
        }
    }

    // Add Item directly to open order
    document.getElementById('btn-add-item-to-order').addEventListener('click', async () => {
        if (!activeViewingOrderId) return;
        const select = document.getElementById('detail-select-product');
        const inputQty = document.getElementById('detail-input-quantity');
        const alertBox = document.getElementById('detail-order-alert');

        const prodId = parseInt(select.value);
        const qty = parseInt(inputQty.value);

        if (!prodId || !qty || qty <= 0) {
            alert('Vui lòng chọn sản phẩm và nhập số lượng hợp lệ!');
            return;
        }

        try {
            const res = await fetch(ORDER_ITEMS_URL, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    order_id: activeViewingOrderId,
                    product_id: prodId,
                    quantity: qty
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi thêm mặt hàng');

            showAlert('Thêm mặt hàng thành công!', 'success');
            await refreshOrderDetailsView();
            loadOrders();
            loadProductsCatalog();
        } catch (err) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = err.message;
            alertBox.style.display = 'block';
        }
    });

    window.updateItemQuantity = async function(itemId, newQty) {
        const qty = parseInt(newQty);
        if (!qty || qty <= 0) {
            alert('Số lượng phải lớn hơn 0!');
            await refreshOrderDetailsView();
            return;
        }

        try {
            const res = await fetch(`${ORDER_ITEMS_URL}/${itemId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ quantity: qty })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi cập nhật số lượng');

            await refreshOrderDetailsView();
            loadOrders();
            loadProductsCatalog();
        } catch (err) {
            alert(err.message);
            await refreshOrderDetailsView();
        }
    };

    window.deleteItemFromOrder = async function(itemId) {
        if (!confirm('Bạn có chắc muốn xóa mặt hàng này khỏi đơn hàng?')) return;

        try {
            const res = await fetch(`${ORDER_ITEMS_URL}/${itemId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!res.ok) throw new Error('Lỗi khi xóa mặt hàng');

            showAlert('Đã xóa mặt hàng!', 'success');
            await refreshOrderDetailsView();
            loadOrders();
            loadProductsCatalog();
        } catch (err) {
            alert(err.message);
        }
    };

    // --- Order Status & Delete ---
    window.updateOrderStatus = async function(orderId, newStatus) {
        try {
            const res = await fetch(`${ORDERS_URL}/${orderId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Lỗi khi cập nhật trạng thái');

            showAlert(`Đã chuyển đơn hàng #${orderId} sang trạng thái: ${newStatus}`, 'success');
            loadOrders();
        } catch (err) {
            showAlert(err.message, 'danger');
            loadOrders();
        }
    };

    window.deleteOrder = async function(orderId) {
        if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${orderId}? Thao tác này không thể hoàn tác.`)) return;

        try {
            const res = await fetch(`${ORDERS_URL}/${orderId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!res.ok) throw new Error('Không thể xóa đơn hàng');

            showAlert(`Đã xóa thành công đơn hàng #${orderId}`, 'success');
            loadOrders();
            loadProductsCatalog();
        } catch (err) {
            showAlert(err.message, 'danger');
        }
    };

    // --- Load All Order Items View ---
    async function loadAllOrderItems() {
        const tbody = document.getElementById('items-tbody');
        try {
            const res = await fetch(ORDER_ITEMS_URL, {
                headers: getAuthHeaders()
            });

            if (res.status === 401) {
                tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Vui lòng <strong>đăng nhập</strong> để xem danh sách mặt hàng.</td></tr>`;
                return;
            }

            if (!res.ok) throw new Error('Lỗi khi tải chi tiết mặt hàng');

            const items = await res.json();
            if (!items || items.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="empty-state">Chưa có chi tiết mặt hàng nào.</td></tr>`;
                return;
            }

            tbody.innerHTML = items.map(item => `
                <tr>
                    <td>#${item.id}</td>
                    <td><a href="javascript:void(0)" onclick="window.viewOrderDetails(${item.order_id || item.orderId})">#${item.order_id || item.orderId}</a></td>
                    <td>#${item.product_id || item.productId}</td>
                    <td><strong>${escapeHtml(item.product_name || item.productName || '')}</strong></td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unit_price || item.unitPrice)}</td>
                    <td style="font-weight: 600; color: var(--primary);">${formatCurrency(item.total_price || item.totalPrice)}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-danger btn-sm" onclick="window.deleteItemFromOrder(${item.id})">🗑 Xóa</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color: var(--danger);">${err.message}</td></tr>`;
        }
    }

    // Refresh & Search Handlers
    document.getElementById('btn-refresh-orders')?.addEventListener('click', loadOrders);
    document.getElementById('btn-refresh-items')?.addEventListener('click', loadAllOrderItems);

    document.getElementById('order-search')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#orders-tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    });

    document.getElementById('item-search')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#items-tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    });

    function escapeHtml(str) {
        return (str || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    // Initial Data Fetch
    loadOrders();
    loadProductsCatalog();
});
