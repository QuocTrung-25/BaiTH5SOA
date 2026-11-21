let availableProducts = [];

async function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    try {
        const res = await authFetch(`${API_CONFIG.ORDER}/orders`);
        if (!res.ok) throw new Error('Không thể tải đơn hàng');
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có đơn hàng nào.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(o => `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td><strong>${o.customerName}</strong></td>
                <td><small style="color: #64748b;">${o.customerEmail}</small></td>
                <td><strong style="color: #2563eb;">$${Number(o.totalAmount).toFixed(2)}</strong></td>
                <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
                <td><small>${o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '-'}</small></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="viewOrder(${o.id})" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-secondary btn-sm" onclick="changeStatus(${o.id}, '${o.status}')" title="Đổi trạng thái"><i class="fas fa-tasks"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrder(${o.id})" title="Xóa"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color: #ef4444;">${err.message}</td></tr>`;
    }
}

window.viewOrder = async function(id) {
    try {
        const [resO, resI] = await Promise.all([
            authFetch(`${API_CONFIG.ORDER}/orders/${id}`),
            authFetch(`${API_CONFIG.ORDER}/order_items?orderId=${id}`)
        ]);

        if (!resO.ok) throw new Error('Không tìm thấy đơn hàng');
        const order = await resO.json();
        const items = resI.ok ? await resI.json() : [];

        document.getElementById('detail-order-id').textContent = order.id;
        document.getElementById('detail-customer-name').textContent = order.customerName;
        document.getElementById('detail-customer-email').textContent = order.customerEmail;
        document.getElementById('detail-order-status').innerHTML = `<span class="badge badge-${order.status.toLowerCase()}">${order.status}</span>`;
        document.getElementById('detail-order-total').textContent = `$${Number(order.totalAmount).toFixed(2)}`;

        const tbody = document.getElementById('detail-items-table-body');
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Chưa có mặt hàng.</td></tr>';
        } else {
            tbody.innerHTML = items.map(it => `
                <tr>
                    <td><strong>${it.productName}</strong></td>
                    <td>$${Number(it.unitPrice).toFixed(2)}</td>
                    <td>${it.quantity}</td>
                    <td><strong>$${Number(it.totalPrice).toFixed(2)}</strong></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteOrderItem(${it.id}, ${id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }

        openModal('modal-order-detail');
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.changeStatus = async function(id, current) {
    const s = prompt(`Cập nhật trạng thái đơn #${id} (pending, completed, cancelled):`, current);
    if (!s || s === current) return;
    try {
        const res = await authFetch(`${API_CONFIG.ORDER}/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: s.toLowerCase() })
        });
        if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
        showAlert('success', 'Đã cập nhật trạng thái đơn #' + id);
        loadOrders();
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.deleteOrder = async function(id) {
    if (!confirm(`Xóa đơn hàng #${id}?`)) return;
    try {
        const res = await authFetch(`${API_CONFIG.ORDER}/orders/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa đơn hàng');
        showAlert('success', 'Đã xóa đơn hàng #' + id);
        loadOrders();
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.deleteOrderItem = async function(itemId, orderId) {
    if (!confirm(`Xóa mặt hàng #${itemId}?`)) return;
    try {
        const res = await authFetch(`${API_CONFIG.ORDER}/order_items/${itemId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa mặt hàng');
        showAlert('success', 'Đã xóa mặt hàng #' + itemId);
        viewOrder(orderId);
        loadOrders();
    } catch (err) {
        showAlert('error', err.message);
    }
};

function addOrderItemRow() {
    const container = document.getElementById('order-items-container');
    const row = document.createElement('div');
    row.className = 'order-item-row';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '2fr 1fr 1fr auto';
    row.style.gap = '8px';
    row.style.alignItems = 'center';

    let options = '<option value="">-- Chọn Sản Phẩm --</option>';
    availableProducts.forEach(p => {
        options += `<option value="${p.id}" data-price="${p.price}">#${p.id} - ${p.name} ($${p.price} | Tồn: ${p.quantity})</option>`;
    });

    row.innerHTML = `
        <select class="form-control item-select" required>${options}</select>
        <input type="number" min="1" value="1" class="form-control item-qty" required>
        <div class="item-subtotal" style="font-weight: 600; text-align: right; color: #10b981;">$0.00</div>
        <button type="button" class="btn btn-outline btn-sm" style="color: #ef4444;" onclick="this.parentElement.remove(); updateEstimate();">&times;</button>
    `;

    const sel = row.querySelector('.item-select');
    const qty = row.querySelector('.item-qty');
    const updateRow = () => {
        const opt = sel.options[sel.selectedIndex];
        const pr = opt ? parseFloat(opt.getAttribute('data-price') || 0) : 0;
        const q = parseInt(qty.value, 10) || 0;
        row.querySelector('.item-subtotal').textContent = `$${(pr * q).toFixed(2)}`;
        updateEstimate();
    };

    sel.addEventListener('change', updateRow);
    qty.addEventListener('input', updateRow);

    container.appendChild(row);
}

function updateEstimate() {
    let total = 0;
    document.querySelectorAll('.order-item-row').forEach(row => {
        const sel = row.querySelector('.item-select');
        const qty = row.querySelector('.item-qty');
        const opt = sel.options[sel.selectedIndex];
        const pr = opt ? parseFloat(opt.getAttribute('data-price') || 0) : 0;
        const q = parseInt(qty.value, 10) || 0;
        total += pr * q;
    });
    const est = document.getElementById('order-estimated-total');
    if (est) est.textContent = `$${total.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();

    const btnOpenCreate = document.getElementById('btn-open-create-order');
    if (btnOpenCreate) {
        btnOpenCreate.addEventListener('click', async () => {
            const resP = await authFetch(`${API_CONFIG.PRODUCT}/products`);
            availableProducts = resP.ok ? await resP.json() : [];

            document.getElementById('order-customer-name').value = '';
            document.getElementById('order-customer-email').value = '';
            document.getElementById('order-items-container').innerHTML = '';
            addOrderItemRow();
            updateEstimate();
            openModal('modal-order');
        });
    }

    const btnAddItem = document.getElementById('btn-add-order-item');
    if (btnAddItem) {
        btnAddItem.addEventListener('click', addOrderItemRow);
    }

    const formOrder = document.getElementById('form-order');
    if (formOrder) {
        formOrder.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rows = document.querySelectorAll('.order-item-row');
            const items = [];
            for (const r of rows) {
                const pId = parseInt(r.querySelector('.item-select').value, 10);
                const q = parseInt(r.querySelector('.item-qty').value, 10);
                if (pId && q > 0) items.push({ productId: pId, quantity: q });
            }

            if (items.length === 0) {
                showAlert('error', 'Vui lòng chọn ít nhất 1 sản phẩm');
                return;
            }

            const payload = {
                customerName: document.getElementById('order-customer-name').value.trim(),
                customerEmail: document.getElementById('order-customer-email').value.trim(),
                items
            };

            try {
                const res = await authFetch(`${API_CONFIG.ORDER}/orders`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Lỗi tạo đơn hàng');
                }
                closeModal('modal-order');
                showAlert('success', 'Tạo đơn hàng thành công!');
                loadOrders();
            } catch (err) {
                showAlert('error', err.message);
            }
        });
    }
});
