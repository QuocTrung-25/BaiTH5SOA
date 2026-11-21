async function checkServicePing(url, dotId) {
    const dot = document.getElementById(dotId);
    if (!dot) return;
    try {
        const res = await fetch(url, { headers: authHeaders() });
        dot.className = res.status < 500 ? 'status-dot online' : 'status-dot offline';
    } catch {
        dot.className = 'status-dot offline';
    }
}

async function checkHealth() {
    await Promise.all([
        checkServicePing(`${API_CONFIG.AUTH}/health`, 'dot-auth'),
        checkServicePing(API_CONFIG.PRODUCT, 'dot-product'),
        checkServicePing(API_CONFIG.ORDER, 'dot-order'),
        checkServicePing(`${API_CONFIG.REPORT}/orders`, 'dot-report')
    ]);
    showAlert('Đã kiểm tra trạng thái các cổng dịch vụ SOA!');
}

async function loadOverviewStats() {
    try {
        const prodRes = await fetch(API_CONFIG.PRODUCT, { headers: authHeaders() });
        if (prodRes.ok) {
            const products = await prodRes.json();
            document.getElementById('stat-products-count').textContent = products.length;
        }
    } catch (e) { console.warn('Product service offline'); }

    try {
        const ordRes = await fetch(API_CONFIG.ORDER, { headers: authHeaders() });
        if (ordRes.ok) {
            const orders = await ordRes.json();
            document.getElementById('stat-orders-count').textContent = orders.length;
        }
    } catch (e) { console.warn('Order service offline'); }

    try {
        const repRes = await fetch(`${API_CONFIG.REPORT}/orders`, { headers: authHeaders() });
        if (repRes.ok) {
            const reports = await repRes.json();
            const revenue = reports.reduce((sum, r) => sum + Number(r.totalRevenue || r.total_revenue || 0), 0);
            const profit = reports.reduce((sum, r) => sum + Number(r.totalProfit || r.total_profit || 0), 0);
            document.getElementById('stat-revenue').textContent = formatVND(revenue);
            document.getElementById('stat-profit').textContent = formatVND(profit);
        }
    } catch (e) { console.warn('Reporting service offline'); }
}

document.addEventListener('DOMContentLoaded', () => {
    checkHealth();
    loadOverviewStats();
});