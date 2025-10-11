// Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isSignUp = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
        this.checkOAuth2Token();
    }

    checkOAuth2Token() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const authStatus = urlParams.get('auth');

        if (token && authStatus === 'success') {
            localStorage.setItem('access_token', token);
            localStorage.setItem('authenticated', 'true');

            // Decode token để lấy thông tin user
            const payload = this.parseJwt(token);
            const roles = this.extractRolesFromPayload(payload);
            const displayName = payload?.name || payload?.fullName || 'User';
            const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');

            let storedUser = {
                username: payload?.sub,
                name: displayName,
                roles,
                isAdmin
            };
            localStorage.setItem('liora_user', JSON.stringify(storedUser));

            // Redirect về trang chính và xóa params
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.reload();
        }
    }

    bindEvents() {
        // Auth form submission
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuth(e));
        }

        // Toggle between sign in and sign up
        const authToggle = document.getElementById('authToggle');
        if (authToggle) {
            authToggle.addEventListener('click', (e) => this.toggleAuthMode(e));
        }

        // Modal events
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.addEventListener('show.bs.modal', (e) => {
                // If already authenticated, prevent opening modal and ensure header shows dropdown
                if (window.app && window.app.currentUser) {
                    e.preventDefault();
                    window.app.updateUserDisplay();
                    return;
                }
                this.resetForm();
            });
            authModal.addEventListener('hidden.bs.modal', () => this.resetForm());
        }
    }

    async handleAuth(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('authSubmitBtn');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const emailInput = document.getElementById('authEmail');
        const firstNameInput = document.getElementById('authFirstName');
        const lastNameInput = document.getElementById('authLastName');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const firstname = firstNameInput ? firstNameInput.value.trim() : '';
        const lastname = lastNameInput ? lastNameInput.value.trim() : '';

        // Basic validation
        if (!username || !password) {
            this.showError('Vui lòng nhập đầy đủ Username và Password');
            return;
        }

        // if (password.length < 6) {
        //     this.showError('Mật khẩu tối thiểu 6 ký tự');
        //     return;
        // }

        if (this.isSignUp) {
            if (!email) {
                this.showError('Vui lòng nhập email');
                return;
            }
            if (!firstname || !lastname) {
                this.showError('Vui lòng nhập họ và tên');
                return;
            }
        }

        try {
            this.setLoadingState(submitBtn, true);

            if (this.isSignUp) {
                await this.signUp({ username, password, email, firstname, lastname });
            } else {
                await this.signIn(username, password);
            }

            // Close modal and reset form
            const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (authModal) {
                // Show toast only after modal is fully hidden (consistent with logout UX)
                const modalEl = document.getElementById('authModal');
                const onHidden = () => {
                    modalEl.removeEventListener('hidden.bs.modal', onHidden);
                    if (window.app) {
                        window.app.showToast('Đăng nhập thành công! ✨', 'success');
                    }
                };
                modalEl.addEventListener('hidden.bs.modal', onHidden);
                authModal.hide();
            }
            this.resetForm();

            // Force header re-render immediately without page reload
            if (window.app) {
                window.app.currentUser = this.currentUser;
                window.app.updateUserDisplay();
                setTimeout(() => {
                    window.app.currentUser = this.currentUser;
                    window.app.updateUserDisplay();
                }, 0);
            }

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async signUp({ username, password, email, firstname, lastname }) {
        const payload = {
            username,
            password,
            email,
            phone: null,
            firstname,
            lastname,
            dob: null,
            gender: null,
            active: true,
            avatar: null
        };

        const res = await fetch('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            let msg = 'Không thể tạo tài khoản';
            try { const err = await res.json(); msg = err.message || msg; } catch (_) { }
            throw new Error(msg);
        }
        await this.signIn(username, password);
    }

    async signIn(username, password) {
        try {
            const response = await fetch('/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                // Try to extract error message from API
                let msg = 'Đăng nhập thất bại';
                try {
                    const err = await response.json();
                    msg = err.message || msg;
                } catch (_) { }
                throw new Error(msg);
            }

            const data = await response.json();
            // Expecting ApiResponse with result { token, authenticated }
            const result = data?.result || data?.data?.result || data;
            const token = result?.token;
            const authenticated = Boolean(result?.authenticated ?? !!token);

            if (!authenticated || !token) {
                throw new Error('Sai thông tin đăng nhập');
            }

            // Persist token for subsequent API calls
            localStorage.setItem('access_token', token);
            // Also set http cookie so server can read token on SSR pages like /info
            try {
                document.cookie = `access_token=${token}; path=/; SameSite=Lax`;
            } catch (_) { }
            localStorage.setItem('authenticated', 'true');
            // Decode token to get display name and roles if available
            const payload = this.parseJwt(token);
            const roles = this.extractRolesFromPayload(payload);
            const displayName = payload?.name || payload?.fullName || username;
            const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
            // Persist minimal user profile immediately for UI
            let storedUser = { username, name: displayName, roles, isAdmin };
            localStorage.setItem('liora_user', JSON.stringify(storedUser));

            // Try to enrich profile from /users/myInfo to get full name
            try {
                const meRes = await fetch('/users/myInfo', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    const me = meData.result || {};
                    const fullName = `${me.firstname || ''} ${me.lastname || ''}`.trim() || storedUser.name;
                    storedUser = { ...storedUser, name: fullName, username: me.username || storedUser.username };
                    localStorage.setItem('liora_user', JSON.stringify(storedUser));
                }
            } catch (_) { }

            // Update runtime state and UI
            this.currentUser = storedUser;
            this.updateUserDisplay();
            if (window.app) {
                window.app.showToast('Đăng nhập thành công! ✨', 'success');
            }

            // Broadcast login event so other modules can react immediately
            document.dispatchEvent(new CustomEvent('user:login', { detail: storedUser }));

            return { token, authenticated };
        } catch (error) {
            throw error;
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join(''));
            return JSON.parse(jsonPayload);
        } catch (_) {
            return {};
        }
    }

    extractRolesFromPayload(payload) {
        try {
            if (!payload) return [];
            if (Array.isArray(payload.roles)) return payload.roles.map(r => String(r).toUpperCase());
            if (Array.isArray(payload.authorities)) return payload.authorities.map(r => String(r).toUpperCase());
            if (typeof payload.scope === 'string') return payload.scope.split(' ').map(r => r.toUpperCase());
            if (payload.realm_access && Array.isArray(payload.realm_access.roles)) return payload.realm_access.roles.map(r => r.toUpperCase());
            return [];
        } catch (_) {
            return [];
        }
    }

    signOut() {
        localStorage.removeItem('liora_user');
        try {
            // Clear access_token cookie
            document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=Lax';
        } catch (_) { }
        this.currentUser = null;
        this.updateUserDisplay();

        if (window.app) {
            window.app.showToast('Đăng xuất thành công! ✨', 'success');
        }

        // Ensure redirect to /home from any route (e.g., /info)
        try {
            if (window && window.location && window.location.pathname !== '/home') {
                window.location.href = '/home';
                return;
            }
        } catch (_) { }
    }

    toggleAuthMode(e) {
        e.preventDefault();

        this.isSignUp = !this.isSignUp;
        this.updateAuthModal();
    }

    updateAuthModal() {
        const modalTitle = document.getElementById('authModalTitle');
        const signupFields = document.getElementById('signupFields');
        const submitBtn = document.getElementById('authSubmitBtn');
        const toggleBtn = document.getElementById('authToggle');

        if (this.isSignUp) {
            modalTitle.textContent = 'Join Liora ✨';
            signupFields.style.display = 'block';
            submitBtn.textContent = 'Tạo tài khoản';
            toggleBtn.textContent = 'Đã có tài khoản? Đăng nhập';
        } else {
            modalTitle.textContent = 'Welcome Back! 💕';
            signupFields.style.display = 'none';
            submitBtn.textContent = 'Đăng nhập';
            toggleBtn.textContent = "Chưa có tài khoản? Đăng ký";
        }
    }

    resetForm() {
        const form = document.getElementById('authForm');
        if (form) {
            form.reset();
        }

        this.isSignUp = false;
        this.updateAuthModal();
        this.clearError();
    }

    setLoadingState(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = `
                <span class="loading-spinner me-2"></span>
                ${this.isSignUp ? 'Tạo tài khoản...' : 'Đăng nhập...'}
            `;
        } else {
            button.disabled = false;
            button.textContent = this.isSignUp ? 'Tạo tài khoản' : 'Đăng nhập';
        }
    }

    showError(message) {
        // Remove any existing error
        this.clearError();

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-3 auth-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
        `;

        // Add to form
        const form = document.getElementById('authForm');
        form.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => this.clearError(), 5000);
    }

    clearError() {
        const existingError = document.querySelector('.auth-error');
        if (existingError) {
            existingError.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    checkAuthState() {
        const userData = localStorage.getItem('liora_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUserDisplay();
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('liora_user');
            }
        }
    }

    updateUserDisplay() {
        // This will be called by the main app
        if (window.app) {
            window.app.currentUser = this.currentUser;
            window.app.updateUserDisplay();
        }
    }

    getStoredUsers() {
        try {
            const users = localStorage.getItem('liora_users');
            return users ? JSON.parse(users) : this.getDefaultUsers();
        } catch (error) {
            console.error('Error parsing stored users:', error);
            return this.getDefaultUsers();
        }
    }



    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin;
    }

    // Update user profile
    async updateProfile(userData) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const updatedUser = { ...this.currentUser, ...userData };

                    // Update in storage
                    localStorage.setItem('liora_user', JSON.stringify(updatedUser));

                    // Update in users list
                    const users = this.getStoredUsers();
                    const userIndex = users.findIndex(u => u.id === this.currentUser.id);
                    if (userIndex !== -1) {
                        users[userIndex] = updatedUser;
                        localStorage.setItem('liora_users', JSON.stringify(users));
                    }

                    this.currentUser = updatedUser;
                    this.updateUserDisplay();

                    if (window.app) {
                        window.app.showToast('Cập nhật thông tin thành công! ✨', 'success');
                    }

                    resolve(updatedUser);
                } catch (error) {
                    reject(error);
                }
            }, 800);
        });
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (newPassword.length < 6) {
                    reject(new Error('New password must be at least 6 characters long'));
                    return;
                }

                // In a real app, you'd verify the current password
                // For demo purposes, we'll just accept any current password

                if (window.app) {
                    window.app.showToast('Cập nhật mật khẩu thành công! ✨', 'success');
                }

                resolve();
            }, 1000);
        });
    }
}

// Initialize auth manager when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

// Export for use in other scripts
window.AuthManager = AuthManager;