async function loadOrderReports() {
    const tbody = document.getElementById('orders-reports-table-body');
    if (!tbody) return;

    try {
        const res = await authFetch(`${API_CONFIG.REPORT}/reports/orders`);
        if (!res.ok) throw new Error('Không thể tải báo cáo');
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Chưa có báo cáo đơn hàng nào.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(r => `
            <tr>
                <td><strong>#${r.id}</strong></td>
                <td>Đơn #${r.orderId}</td>
                <td><span style="font-weight: 600; color: #2563eb;">$${Number(r.totalRevenue).toFixed(2)}</span></td>
                <td><span style="color: #ef4444;">$${Number(r.totalCost).toFixed(2)}</span></td>
                <td><span style="font-weight: 700; color: #10b981;">+$${Number(r.totalProfit).toFixed(2)}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteOrderReport(${r.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state" style="color: #ef4444;">${err.message}</td></tr>`;
    }
}

async function loadProductReports() {
    const tbody = document.getElementById('products-reports-table-body');
    if (!tbody) return;

    try {
        const res = await authFetch(`${API_CONFIG.REPORT}/reports/products`);
        if (!res.ok) throw new Error('Không thể tải báo cáo sản phẩm');
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có báo cáo sản phẩm nào.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(r => `
            <tr>
                <td><strong>#${r.id}</strong></td>
                <td>SP #${r.productId} ${r.productName ? `(${r.productName})` : ''}</td>
                <td>${r.totalSold}</td>
                <td>$${Number(r.revenue).toFixed(2)}</td>
                <td>$${Number(r.cost).toFixed(2)}</td>
                <td><span style="font-weight: 700; color: #10b981;">+$${Number(r.profit).toFixed(2)}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteProductReport(${r.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color: #ef4444;">${err.message}</td></tr>`;
    }
}

window.deleteOrderReport = async function(id) {
    if (!confirm(`Xóa báo cáo đơn hàng #${id}?`)) return;
    try {
        const res = await authFetch(`${API_CONFIG.REPORT}/reports/orders/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa báo cáo');
        showAlert('success', 'Đã xóa báo cáo #' + id);
        loadOrderReports();
    } catch (err) {
        showAlert('error', err.message);
    }
};

window.deleteProductReport = async function(id) {
    if (!confirm(`Xóa báo cáo sản phẩm #${id}?`)) return;
    try {
        const res = await authFetch(`${API_CONFIG.REPORT}/reports/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa');
        showAlert('success', 'Đã xóa báo cáo #' + id);
        loadProductReports();
    } catch (err) {
        showAlert('error', err.message);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadOrderReports();

    const btnSubOrder = document.getElementById('tab-btn-orders');
    const btnSubProd = document.getElementById('tab-btn-products');
    const panelOrder = document.getElementById('panel-orders-reports');
    const panelProd = document.getElementById('panel-products-reports');

    if (btnSubOrder && btnSubProd) {
        btnSubOrder.addEventListener('click', () => {
            btnSubOrder.className = 'btn btn-primary';
            btnSubProd.className = 'btn btn-outline';
            panelOrder.style.display = 'block';
            panelProd.style.display = 'none';
            loadOrderReports();
        });

        btnSubProd.addEventListener('click', () => {
            btnSubOrder.className = 'btn btn-outline';
            btnSubProd.className = 'btn btn-primary';
            panelOrder.style.display = 'none';
            panelProd.style.display = 'block';
            loadProductReports();
        });
    }

    const btnOpenCreate = document.getElementById('btn-open-create-report');
    if (btnOpenCreate) {
        btnOpenCreate.addEventListener('click', async () => {
            const [resOrders, resProds] = await Promise.all([
                authFetch(`${API_CONFIG.ORDER}/orders`),
                authFetch(`${API_CONFIG.PRODUCT}/products`)
            ]);

            const orders = resOrders.ok ? await resOrders.json() : [];
            const prods = resProds.ok ? await resProds.json() : [];

            const selOrder = document.getElementById('report-order-id');
            if (selOrder) {
                selOrder.innerHTML = orders.map(o => `<option value="${o.id}">Đơn #${o.id} - ${o.customerName} ($${o.totalAmount})</option>`).join('');
            }

            const selProd = document.getElementById('report-product-id');
            if (selProd) {
                selProd.innerHTML = prods.map(p => `<option value="${p.id}">SP #${p.id} - ${p.name} ($${p.price})</option>`).join('');
            }

            openModal('modal-report');
        });
    }

    const formReport = document.getElementById('form-report');
    if (formReport) {
        formReport.addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.getElementById('report-type').value;

            try {
                if (type === 'order') {
                    const orderId = document.getElementById('report-order-id').value;
                    const res = await authFetch(`${API_CONFIG.REPORT}/reports/orders?orderId=${orderId}`, {
                        method: 'POST'
                    });
                    if (!res.ok) throw new Error('Không thể tạo báo cáo đơn hàng');
                    showAlert('success', 'Tạo báo cáo đơn hàng thành công!');
                    loadOrderReports();
                } else {
                    const productId = document.getElementById('report-product-id').value;
                    const totalSold = parseInt(document.getElementById('report-sold').value, 10) || 1;
                    const res = await authFetch(`${API_CONFIG.REPORT}/reports/products?productId=${productId}&totalSold=${totalSold}`, {
                        method: 'POST'
                    });
                    if (!res.ok) throw new Error('Không thể tạo báo cáo sản phẩm');
                    showAlert('success', 'Tạo báo cáo sản phẩm thành công!');
                    loadProductReports();
                }
                closeModal('modal-report');
            } catch (err) {
                showAlert('error', err.message);
            }
        });
    }

    const repTypeSel = document.getElementById('report-type');
    if (repTypeSel) {
        repTypeSel.addEventListener('change', (e) => {
            const isOrder = e.target.value === 'order';
            document.getElementById('group-order-fields').style.display = isOrder ? 'block' : 'none';
            document.getElementById('group-product-fields').style.display = isOrder ? 'none' : 'block';
        });
    }
});
