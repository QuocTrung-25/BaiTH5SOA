async function loadReports() {
    const orderTbody = document.getElementById('order-reports-tbody');
    const prodTbody = document.getElementById('product-reports-tbody');

    try {
        const res = await fetch(`${API_CONFIG.REPORT}/orders`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Không thể tải báo cáo đơn hàng');
        const orderReports = await res.json();

        let totalRev = 0, totalCost = 0, totalProfit = 0;

        orderTbody.innerHTML = orderReports.length ? orderReports.map(r => {
            const rev = Number(r.totalRevenue ?? r.total_revenue ?? 0);
            const cost = Number(r.totalCost ?? r.total_cost ?? 0);
            const prof = Number(r.totalProfit ?? r.total_profit ?? (rev - cost));
            totalRev += rev;
            totalCost += cost;
            totalProfit += prof;

            const profitClass = prof >= 0 ? 'profit-positive' : 'profit-negative';

            return `
                <tr>
                    <td>${r.id}</td>
                    <td>#${r.orderId ?? r.order_id}</td>
                    <td>${formatVND(rev)}</td>
                    <td>${formatVND(cost)}</td>
                    <td class="${profitClass}">${formatVND(prof)}</td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="5">Chưa có báo cáo đơn hàng.</td></tr>';

        document.getElementById('rep-revenue').textContent = formatVND(totalRev);
        document.getElementById('rep-cost').textContent = formatVND(totalCost);
        document.getElementById('rep-profit').textContent = formatVND(totalProfit);
    } catch (err) {
        orderTbody.innerHTML = `<tr><td colspan="5" style="color:red;">${err.message}</td></tr>`;
    }

    try {
        const res = await fetch(`${API_CONFIG.REPORT}/products`, { headers: authHeaders() });
        if (!res.ok) throw new Error('Không thể tải báo cáo sản phẩm');
        const prodReports = await res.json();

        prodTbody.innerHTML = prodReports.length ? prodReports.map(p => {
            const prof = Number(p.profit ?? 0);
            const profitClass = prof >= 0 ? 'profit-positive' : 'profit-negative';
            return `
                <tr>
                    <td>${p.id}</td>
                    <td>#${p.orderReportId ?? p.order_report_id ?? '-'}</td>
                    <td>#${p.productId ?? p.product_id}</td>
                    <td>${p.productName ?? p.product_name ?? '-'}</td>
                    <td>${p.totalSold ?? p.total_sold ?? 0}</td>
                    <td>${formatVND(p.revenue ?? 0)}</td>
                    <td>${formatVND(p.cost ?? 0)}</td>
                    <td class="${profitClass}">${formatVND(prof)}</td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="8">Chưa có báo cáo sản phẩm.</td></tr>';
    } catch (err) {
        prodTbody.innerHTML = `<tr><td colspan="8" style="color:red;">${err.message}</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', loadReports);