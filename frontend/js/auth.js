document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const tokenDisplay = document.getElementById('jwt-token-display');
    const btnCopyToken = document.getElementById('btn-copy-token');
    const btnTestAuth = document.getElementById('btn-test-auth');
    const btnLogout = document.getElementById('btn-logout');
    const testResult = document.getElementById('auth-test-result');

    function updateView() {
        const token = getToken();
        if (tokenDisplay) tokenDisplay.value = token;
        const userBadge = document.getElementById('user-badge-name');
        if (userBadge) userBadge.textContent = getUser();
    }

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();

            try {
                const res = await fetch(`${API_CONFIG.AUTH}/api/v1/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userName: username, password })
                });

                if (!res.ok) {
                    throw new Error('Đăng nhập thất bại! Kiểm tra username/password.');
                }

                const data = await res.json();
                setToken(data.token, username);
                updateView();
                showAlert('success', 'Đăng nhập thành công! Token đã được lưu.');
            } catch (err) {
                showAlert('error', err.message);
            }
        });
    }

    if (btnCopyToken) {
        btnCopyToken.addEventListener('click', () => {
            const token = getToken();
            if (!token) {
                showAlert('error', 'Chưa có Token!');
                return;
            }
            navigator.clipboard.writeText(token);
            showAlert('success', 'Đã copy Token!');
        });
    }

    if (btnTestAuth) {
        btnTestAuth.addEventListener('click', async () => {
            try {
                const res = await authFetch(`${API_CONFIG.AUTH}/api/v1/hello`);
                const data = await res.json();
                if (testResult) {
                    testResult.style.display = 'block';
                    testResult.textContent = JSON.stringify(data, null, 2);
                }
                showAlert('success', 'Gọi test /api/v1/hello thành công!');
            } catch (err) {
                if (testResult) {
                    testResult.style.display = 'block';
                    testResult.textContent = 'Lỗi: ' + err.message;
                }
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            clearToken();
            updateView();
            if (testResult) testResult.style.display = 'none';
            showAlert('success', 'Đã đăng xuất!');
        });
    }

    updateView();
});
