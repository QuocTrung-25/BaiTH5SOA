async function loadProductOptions() {
    const select = document.getElementById('order-product-select');
    try {
        const res = await fetch(API_CONFIG.PRODUCT, { headers: authHeaders() });
        const products = await res.json();
        select.innerHTML = products.map(p => 
            `<option value="${p.id}">${p.name} (${formatVND(p.price)} - Kho: ${p.quantity ?? 0})</option>`
        ).join('');
    } catch {
        select.innerHTML = '<option value="">Không tải được sản phẩm</option>';
    }
}

async function loadOrders() {
    const tbody = document.getElementById('orders-tbody');
    try {
        const res = await fetch(API_CONFIG.ORDER, { headers: authHeaders() });
        if (!res.ok) throw new Error('Không thể tải danh sách đơn hàng');
        const orders = await res.json();

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Chưa có đơn hàng nào.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const st = (o.status || 'pending').toLowerCase();
            return `
                <tr>
                    <td>#${o.id}</td>
                    <td><strong>${o.customerName || o.customer_name || '-'}</strong></td>
                    <td>${o.customerEmail || o.customer_email || '-'}</td>
                    <td><strong>${formatVND(o.totalAmount || o.total_amount || 0)}</strong></td>
                    <td><span class="badge badge-${st}">${st.toUpperCase()}</span></td>
                    <td>${(o.createdAt || o.created_at) ? new Date(o.createdAt || o.created_at).toLocaleString('vi-VN') : '-'}</td>
                    <td>
                        <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
                            <option value="pending" ${st === 'pending' ? 'selected' : ''}>PENDING</option>
                            <option value="completed" ${st === 'completed' ? 'selected' : ''}>COMPLETED</option>
                            <option value="cancelled" ${st === 'cancelled' ? 'selected' : ''}>CANCELLED</option>
                        </select>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;">${err.message}</td></tr>`;
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const res = await fetch(`${API_CONFIG.ORDER}/${orderId}/status`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Cập nhật trạng thái thất bại');
        showAlert(`Đã chuyển đơn #${orderId} sang ${status.toUpperCase()}`);
        loadOrders();
    } catch (err) {
        showAlert(err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductOptions();
    loadOrders();

    document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            customerName: document.getElementById('order-customer').value,
            customerEmail: document.getElementById('order-email').value,
            items: [{
                productId: parseInt(document.getElementById('order-product-select').value, 10),
                quantity: parseInt(document.getElementById('order-quantity').value, 10)
            }]
        };

        try {
            const res = await fetch(API_CONFIG.ORDER, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Tạo đơn hàng thất bại (kiểm tra tồn kho hoặc token)');
            showAlert('Tạo đơn hàng thành công!');
            e.target.reset();
            loadOrders();
            loadProductOptions();
        } catch (err) {
            showAlert(err.message, 'error');
        }
    });
});