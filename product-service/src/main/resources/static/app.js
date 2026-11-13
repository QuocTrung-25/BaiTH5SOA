const AUTH_URL = "http://localhost:8080/api/v1/auth/login";
const PRODUCTS_URL = "/products";
const TOKEN_KEY = "product-service-token";

const elements = {
    loginOverlay: document.querySelector("#login-overlay"),
    loginForm: document.querySelector("#login-form"),
    loginError: document.querySelector("#login-error"),
    loginButton: document.querySelector("#login-button"),
    username: document.querySelector("#username"),
    password: document.querySelector("#password"),
    logoutButton: document.querySelector("#logout-button"),
    accountName: document.querySelector("#account-name"),
    avatar: document.querySelector("#avatar"),
    rows: document.querySelector("#product-rows"),
    search: document.querySelector("#search-input"),
    resultCount: document.querySelector("#result-count"),
    tableMessage: document.querySelector("#table-message"),
    totalCount: document.querySelector("#total-count"),
    inStockCount: document.querySelector("#in-stock-count"),
    lowStockCount: document.querySelector("#low-stock-count"),
    inventoryValue: document.querySelector("#inventory-value"),
    productOverlay: document.querySelector("#product-overlay"),
    productForm: document.querySelector("#product-form"),
    productError: document.querySelector("#product-error"),
    productDialogTitle: document.querySelector("#product-dialog-title"),
    saveProductButton: document.querySelector("#save-product-button"),
    name: document.querySelector("#product-name"),
    description: document.querySelector("#product-description"),
    price: document.querySelector("#product-price"),
    quantity: document.querySelector("#product-quantity")
};

let products = [];
let editingProductId = null;

function setAuthenticated(username) {
    elements.loginOverlay.hidden = true;
    elements.logoutButton.hidden = false;
    elements.accountName.textContent = username;
    elements.avatar.textContent = username.charAt(0).toUpperCase();
}

function signOut(message = "") {
    sessionStorage.removeItem(TOKEN_KEY);
    products = [];
    renderProducts();
    elements.loginOverlay.hidden = false;
    elements.logoutButton.hidden = true;
    elements.accountName.textContent = "Chưa đăng nhập";
    elements.avatar.textContent = "?";
    elements.loginError.textContent = message;
}

function base64Encode(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
}

async function login(event) {
    event.preventDefault();
    elements.loginError.textContent = "";
    elements.loginButton.disabled = true;
    elements.loginButton.textContent = "Đang đăng nhập...";
    try {
        const response = await fetch(AUTH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: elements.username.value.trim(),
                password: base64Encode(elements.password.value)
            })
        });
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
            }
            throw new Error(`Không thể đăng nhập (HTTP ${response.status}).`);
        }
        const result = await response.json();
        if (!result.token) {
            throw new Error("Máy chủ không trả về token đăng nhập.");
        }
        sessionStorage.setItem(TOKEN_KEY, result.token);
        setAuthenticated(elements.username.value.trim());
        elements.password.value = "";
        await loadProducts();
    } catch (error) {
        elements.loginError.textContent = error.message.includes("Failed to fetch")
            ? "Không gọi được API đăng nhập. Hãy chạy hoặc khởi động lại ứng dụng JWT ở cổng 8080, rồi mở giao diện tại http://localhost:8081/."
            : error.message;
    } finally {
        elements.loginButton.disabled = false;
        elements.loginButton.textContent = "Đăng nhập";
    }
}

async function apiRequest(path, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body) headers.set("Content-Type", "application/json");
    const response = await fetch(path, { ...options, headers });
    if (response.status === 401) {
        signOut("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        throw new Error("Phiên đăng nhập đã hết hạn.");
    }
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    }
    return response.status === 204 ? null : response.json();
}

async function loadProducts() {
    if (!sessionStorage.getItem(TOKEN_KEY)) return;
    elements.tableMessage.textContent = "";
    try {
        products = await apiRequest(PRODUCTS_URL);
        renderProducts();
    } catch (error) {
        if (sessionStorage.getItem(TOKEN_KEY)) {
            elements.tableMessage.textContent = error.message;
        }
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(value);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function renderProducts() {
    const query = elements.search.value.trim().toLocaleLowerCase("vi");
    const filteredProducts = products.filter(product =>
        product.name.toLocaleLowerCase("vi").includes(query)
    );
    const inStock = products.filter(product => product.quantity > 0).length;
    const lowStock = products.filter(product => product.quantity > 0 && product.quantity < 5).length;
    const inventoryValue = products.reduce(
        (total, product) => total + Number(product.price) * product.quantity, 0
    );

    elements.totalCount.textContent = products.length;
    elements.inStockCount.textContent = inStock;
    elements.lowStockCount.textContent = lowStock;
    elements.inventoryValue.textContent = formatCurrency(inventoryValue);
    elements.resultCount.textContent = `${filteredProducts.length} sản phẩm`;

    if (!filteredProducts.length) {
        const message = products.length ? "Không tìm thấy sản phẩm phù hợp." : "Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên.";
        elements.rows.innerHTML = `<tr><td class="empty-cell" colspan="6">${message}</td></tr>`;
        return;
    }

    elements.rows.innerHTML = filteredProducts.map(product => {
        const quantity = Number(product.quantity);
        const stockClass = quantity === 0 ? "stock-out" : quantity < 5 ? "stock-low" : "stock-in";
        const stockLabel = quantity === 0 ? "Hết hàng" : quantity < 5 ? "Sắp hết" : "Còn hàng";
        const description = product.description || "—";
        return `
            <tr>
                <td><div class="product-name"><span class="product-initial">${escapeHtml(product.name.trim().charAt(0) || "?")}</span><span>${escapeHtml(product.name)}</span></div></td>
                <td class="description-cell" title="${escapeHtml(description)}">${escapeHtml(description)}</td>
                <td class="price-cell">${formatCurrency(product.price)}</td>
                <td class="quantity-cell">${quantity}</td>
                <td><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
                <td><div class="row-actions">
                    <button class="icon-button" type="button" data-edit="${product.id}" aria-label="Sửa ${escapeHtml(product.name)}" title="Chỉnh sửa">✎</button>
                    <button class="icon-button delete-button" type="button" data-delete="${product.id}" aria-label="Xóa ${escapeHtml(product.name)}" title="Xóa">×</button>
                </div></td>
            </tr>`;
    }).join("");
}

function openProductDialog(product = null) {
    editingProductId = product?.id ?? null;
    elements.productForm.reset();
    elements.productError.textContent = "";
    elements.productDialogTitle.textContent = product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm";
    elements.saveProductButton.textContent = product ? "Lưu thay đổi" : "Lưu sản phẩm";
    if (product) {
        elements.name.value = product.name;
        elements.description.value = product.description || "";
        elements.price.value = product.price;
        elements.quantity.value = product.quantity;
    }
    elements.productOverlay.hidden = false;
    elements.name.focus();
}

function closeProductDialog() {
    elements.productOverlay.hidden = true;
    editingProductId = null;
}

async function saveProduct(event) {
    event.preventDefault();
    elements.productError.textContent = "";
    elements.saveProductButton.disabled = true;
    const product = {
        name: elements.name.value.trim(),
        description: elements.description.value.trim(),
        price: Number(elements.price.value),
        quantity: Number(elements.quantity.value)
    };
    try {
        const path = editingProductId === null ? PRODUCTS_URL : `${PRODUCTS_URL}/${editingProductId}`;
        await apiRequest(path, {
            method: editingProductId === null ? "POST" : "PUT",
            body: JSON.stringify(product)
        });
        closeProductDialog();
        await loadProducts();
    } catch (error) {
        elements.productError.textContent = error.message;
    } finally {
        elements.saveProductButton.disabled = false;
    }
}

async function deleteProduct(id) {
    const product = products.find(item => item.id === id);
    if (!product || !window.confirm(`Bạn có chắc muốn xóa "${product.name}" không?`)) return;
    try {
        await apiRequest(`${PRODUCTS_URL}/${id}`, { method: "DELETE" });
        await loadProducts();
    } catch (error) {
        elements.tableMessage.textContent = error.message;
    }
}

elements.loginForm.addEventListener("submit", login);
elements.logoutButton.addEventListener("click", () => signOut());
elements.search.addEventListener("input", renderProducts);
elements.productForm.addEventListener("submit", saveProduct);
document.querySelector("#add-button").addEventListener("click", () => openProductDialog());
document.querySelector("#refresh-button").addEventListener("click", loadProducts);
document.querySelector("#close-dialog-button").addEventListener("click", closeProductDialog);
document.querySelector("#cancel-dialog-button").addEventListener("click", closeProductDialog);
elements.rows.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");
    if (editButton) {
        const product = products.find(item => item.id === Number(editButton.dataset.edit));
        if (product) openProductDialog(product);
    }
    if (deleteButton) deleteProduct(Number(deleteButton.dataset.delete));
});
elements.productOverlay.addEventListener("click", event => {
    if (event.target === elements.productOverlay) closeProductDialog();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !elements.productOverlay.hidden) closeProductDialog();
});

const savedToken = sessionStorage.getItem(TOKEN_KEY);
if (savedToken) {
    setAuthenticated("admin");
    loadProducts();
} else {
    signOut();
}
