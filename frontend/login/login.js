document.addEventListener('DOMContentLoaded', () => {
    const tokenBox = document.getElementById('current-token');
    if (tokenBox) tokenBox.value = getToken() || 'Chưa có token.';

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userName = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch(`${API_CONFIG.AUTH}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Đăng nhập thất bại');

            const token = data.token;
            localStorage.setItem('soa_token', token);
            localStorage.setItem('soa_username', data.userName || userName);
            tokenBox.value = token;
            updateUserBadge();
            showAlert(data.message || 'Đăng nhập thành công!');
        } catch (err) {
            showAlert(err.message, 'error');
        }
    });

    // Kiểm tra token bằng endpoint /hello của AuthController
    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAlert('AuthController hiện chỉ hỗ trợ /login và /hello (tài khoản mặc định: admin / 123456).', 'error');
        });
    }
});

function logout() {
    localStorage.removeItem('soa_token');
    localStorage.removeItem('soa_username');
    document.getElementById('current-token').value = 'Đã đăng xuất.';
    updateUserBadge();
    showAlert('Đã xóa JWT token và đăng xuất.');
}