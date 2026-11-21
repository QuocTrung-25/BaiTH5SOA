let productsList = [];

async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    try {
        const res = await authFetch(`${API_CONFIG.PRODUCT}/products`);
        if (!res.ok) throw new Error('Không thể tải sản phẩm');
        const data = await res.json();
        productsList = data;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Chưa có sản phẩm nào.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td><strong>${p.name}</strong></td>
                <td><small style="color: #64748b;">${p.description || '-'}</small></td>
                <td><span style="color: #10b981; font-weight: 600;">$${Number(p.price).toFixed(2)}</span></td>
                <td><span class="badge ${p.quantity > 5 ? 'badge-completed' : 'badge-pending'}">${p.quantity} chiếc</span></td>
                <td><small>${p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '-'}</small></td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color: #ef4444;">${err.message}</td></tr>`;
    }
}

window.editProduct = function(id) {
    const p = productsList.find(x => x.id === id);
    if (!p) return;
    document.getElementById('modal-product-title').textContent = 'Chỉnh Sửa Sản Phẩm #' + p.id;
    document.getElementById('product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-description').value = p.description || '';
    document.getElementById('product-price').value = p.price;
    document.getElementById('product-quantity').value = p.quantity;
    openModal('modal-product');
};

window.deleteProduct = async function(id) {
    if (!confirm(`Xóa sản phẩm #${id}?`)) return;
    try {
        const res = await authFetch(`${API_CONFIG.PRODUCT}/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Không thể xóa sản phẩm');
        showAlert('success', 'Đã xóa sản phẩm #' + id);
        loadProducts();
    } catch (err) {
        showAlert('error', err.message);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    const btnOpenCreate = document.getElementById('btn-open-create-product');
    if (btnOpenCreate) {
        btnOpenCreate.addEventListener('click', () => {
            document.getElementById('modal-product-title').textContent = 'Thêm Sản Phẩm Mới';
            document.getElementById('product-id').value = '';
            document.getElementById('product-name').value = '';
            document.getElementById('product-description').value = '';
            document.getElementById('product-price').value = '';
            document.getElementById('product-quantity').value = '';
            openModal('modal-product');
        });
    }

    const formProduct = document.getElementById('form-product');
    if (formProduct) {
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
                const res = await authFetch(url, {
                    method,
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Lỗi lưu sản phẩm');
                closeModal('modal-product');
                showAlert('success', id ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
                loadProducts();
            } catch (err) {
                showAlert('error', err.message);
            }
        });
    }

    const searchInput = document.getElementById('search-product');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('#products-table-body tr').forEach(r => {
                r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
            });
        });
    }
});
