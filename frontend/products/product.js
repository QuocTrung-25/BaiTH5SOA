async function loadProducts() {
    const tbody = document.getElementById('products-tbody');
    try {
        const res = await fetch(API_CONFIG.PRODUCT, { headers: authHeaders() });
        if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
        const products = await res.json();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Chưa có sản phẩm nào.</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => {
            const stock = p.quantity ?? 0;
            const stockClass = stock < 5 ? 'stock-low' : 'stock-ok';
            return `
                <tr>
                    <td>${p.id}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${p.description || '-'}</td>
                    <td>${formatVND(p.price)}</td>
                    <td class="${stockClass}">${stock}</td>
                    <td>
                        <button class="btn btn-outline btn-sm" onclick='editProduct(${JSON.stringify(p)})'>Sửa</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Xóa</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">${err.message}</td></tr>`;
    }
}

function editProduct(p) {
    document.getElementById('product-form-title').textContent = `Cập nhật Sản phẩm #${p.id}`;
    document.getElementById('product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-price').value = p.price;
    document.getElementById('product-stock').value = p.quantity ?? 0;
    document.getElementById('product-desc').value = p.description || '';
}

function resetProductForm() {
    document.getElementById('product-form-title').textContent = 'Thêm Sản phẩm mới';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
}

async function deleteProduct(id) {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
        const res = await fetch(`${API_CONFIG.PRODUCT}/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
        });
        if (!res.ok) throw new Error('Xóa sản phẩm thất bại');
        showAlert('Đã xóa sản phẩm!');
        loadProducts();
    } catch (err) {
        showAlert(err.message, 'error');
    }
}
async function updateOrderStatus(orderId, status) {
    try {
        const res = await fetch(`${API_CONFIG.ORDER}/${orderId}`, {
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
    loadProducts();
    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const payload = {
            name: document.getElementById('product-name').value,
            price: parseFloat(document.getElementById('product-price').value),
            quantity: parseInt(document.getElementById('product-stock').value, 10),
            description: document.getElementById('product-desc').value
        };

        const url = id ? `${API_CONFIG.PRODUCT}/${id}` : API_CONFIG.PRODUCT;
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: authHeaders(),
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Lưu sản phẩm thất bại');
            showAlert(id ? 'Cập nhật thành công!' : 'Thêm sản phẩm thành công!');
            resetProductForm();
            loadProducts();
        } catch (err) {
            showAlert(err.message, 'error');
        }
    });
});