document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [resProd, resOrder, resRep] = await Promise.all([
            authFetch(`${API_CONFIG.PRODUCT}/products`),
            authFetch(`${API_CONFIG.ORDER}/orders`),
            authFetch(`${API_CONFIG.REPORT}/reports/orders`)
        ]);

        if (resProd.ok) {
            const products = await resProd.json();
            const el = document.getElementById('stat-products-count');
            if (el) el.textContent = products.length;
        }

        if (resOrder.ok) {
            const orders = await resOrder.json();
            const el = document.getElementById('stat-orders-count');
            if (el) el.textContent = orders.length;
        }

        if (resRep.ok) {
            const reports = await resRep.json();
            let totalRev = 0;
            let totalProfit = 0;
            reports.forEach(r => {
                totalRev += parseFloat(r.totalRevenue || 0);
                totalProfit += parseFloat(r.totalProfit || 0);
            });
            const revEl = document.getElementById('stat-revenue');
            const profitEl = document.getElementById('stat-profit');
            if (revEl) revEl.textContent = `$${totalRev.toFixed(2)}`;
            if (profitEl) profitEl.textContent = `$${totalProfit.toFixed(2)}`;
        }
    } catch (e) {
        console.warn('Overview fetch error:', e);
    }
});
