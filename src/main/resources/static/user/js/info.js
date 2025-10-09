// User Info Page JavaScript
class UserInfoManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.bindEvents();
    }

    async loadUserInfo() {
        // Always display loading, but make it resilient with timeout and finally-hide
        this.showLoading();
        const hideLoadingSafely = () => { try { this.hideLoading(); } catch (_) { } };

        let timeoutId;
        const abortController = new AbortController();
        const MAX_WAIT_MS = 8000; // 8s timeout
        timeoutId = setTimeout(() => {
            try { abortController.abort(); } catch (_) { }
            hideLoadingSafely();
            this.showToast('Mạng chậm, vui lòng thử lại hoặc tải lại trang', 'info');
        }, MAX_WAIT_MS);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                hideLoadingSafely();
                this.showError('Vui lòng đăng nhập để xem thông tin cá nhân');
                try { window.location.href = '/home'; } catch (_) { }
                return;
            }

            const response = await fetch('/users/myInfo', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: abortController.signal
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    hideLoadingSafely();
                    this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    try { window.location.href = '/home'; } catch (_) { }
                    return;
                }
                throw new Error('Failed to load user info');
            }

            const data = await response.json();
            this.currentUser = data.result;
            // Sync lightweight user to localStorage for header rendering
            try {
                const existing = (() => { try { return JSON.parse(localStorage.getItem('liora_user')) || {}; } catch (_) { return {}; } })();
                const liteUser = {
                    username: this.currentUser.username,
                    name: `${this.currentUser.firstname || ''} ${this.currentUser.lastname || ''}`.trim(),
                    roles: existing.roles,
                    isAdmin: existing.isAdmin === true || (Array.isArray(existing.roles) && existing.roles.includes('ADMIN'))
                };
                localStorage.setItem('liora_user', JSON.stringify(liteUser));
                if (window.app && typeof window.app.updateUserDisplay === 'function') {
                    window.app.updateUserDisplay();
                }
            } catch (_) { }

            this.populateUserData();
        } catch (error) {
            console.error('Error loading user info:', error);
            this.showError('Không thể tải thông tin người dùng');
        }
        finally {
            if (timeoutId) { try { clearTimeout(timeoutId); } catch (_) { } }
            hideLoadingSafely();
        }
    }

    populateUserData() {
        if (!this.currentUser) return;

        // Update profile header
        this.updateElement('profileName', this.getFullName());
        this.updateElement('profileEmail', this.currentUser.email || 'Chưa cập nhật');

        // Update profile avatar
        const avatar = document.getElementById('profileAvatar');
        if (this.currentUser.avatar) {
            avatar.src = this.currentUser.avatar;
        } else {
            avatar.src = 'https://placehold.co/300x300';
        }

        // Update profile stats (mock data for now)
        this.updateElement('totalOrders', '0');
        this.updateElement('totalSpent', '0');
        this.updateElement('memberSince', this.formatDate(this.currentUser.createdDate));
        this.updateElement('memberSinceText', this.formatDate(this.currentUser.createdDate));

        // Update personal information
        this.updateElement('displayName', this.getFullName());
        this.updateElement('displayEmail', this.currentUser.email || 'Chưa cập nhật');
        this.updateElement('displayPhone', this.currentUser.phone || 'Chưa cập nhật');
        this.updateElement('displayDob', this.formatDate(this.currentUser.dob) || 'Chưa cập nhật');
        this.updateElement('displayGender', this.getGenderText());
    }

    getFullName() {
        const firstname = this.currentUser.firstname || '';
        const lastname = this.currentUser.lastname || '';
        return `${firstname} ${lastname}`.trim() || this.currentUser.username || 'Chưa cập nhật';
    }

    getGenderText() {
        if (this.currentUser.gender === null || this.currentUser.gender === undefined) {
            return 'Chưa cập nhật';
        }
        return this.currentUser.gender ? 'Nam' : 'Nữ';
    }

    formatDate(date) {
        if (!date) return 'Chưa cập nhật';
        return new Date(date).toLocaleDateString('vi-VN');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    bindEvents() {
        // Edit form submission
        const editForm = document.getElementById('profileEditForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTabSwitch(e));
        });
    }

    handleEditSubmit(e) {
        e.preventDefault();

        if (!this.currentUser) {
            this.showError('Không thể cập nhật thông tin');
            return;
        }

        const formData = {
            firstname: document.getElementById('editName').value.split(' ')[0] || '',
            lastname: document.getElementById('editName').value.split(' ').slice(1).join(' ') || '',
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            dob: document.getElementById('editDob').value ? new Date(document.getElementById('editDob').value).toISOString().split('T')[0] : null,
            gender: document.getElementById('editGender').value === 'Nam' ? true : document.getElementById('editGender').value === 'Nữ' ? false : null
        };

        this.updateUserInfo(formData);
    }

    async updateUserInfo(formData) {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập để cập nhật thông tin');
                return;
            }

            const response = await fetch(`/users/${this.currentUser.userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update user info');
            }

            const data = await response.json();
            this.currentUser = data.result;
            // Re-sync header display after update
            try {
                const existing = (() => { try { return JSON.parse(localStorage.getItem('liora_user')) || {}; } catch (_) { return {}; } })();
                const liteUser = {
                    username: this.currentUser.username,
                    name: `${this.currentUser.firstname || ''} ${this.currentUser.lastname || ''}`.trim(),
                    roles: existing.roles,
                    isAdmin: existing.isAdmin === true || (Array.isArray(existing.roles) && existing.roles.includes('ADMIN'))
                };
                localStorage.setItem('liora_user', JSON.stringify(liteUser));
                if (window.app && typeof window.app.updateUserDisplay === 'function') {
                    window.app.updateUserDisplay();
                }
                // Also broadcast login to ensure any listeners update their state on this page
                document.dispatchEvent(new CustomEvent('user:login', { detail: liteUser }));
            } catch (_) { }

            this.populateUserData();
            this.cancelEdit();
            this.showToast('Thông tin đã được cập nhật thành công!', 'success');
        } catch (error) {
            console.error('Error updating user info:', error);
            this.showError('Không thể cập nhật thông tin');
        }
    }

    handleTabSwitch(e) {
        const tabId = e.target.getAttribute('data-bs-target');

        // Load data for specific tabs
        if (tabId === '#orders') {
            this.loadOrders();
        } else if (tabId === '#address') {
            this.loadAddresses();
        }
    }

    async loadOrders() {
        // Mock data for now - replace with actual API call
        const ordersContainer = document.getElementById('ordersList');
        if (!ordersContainer) return;

        ordersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h5>Chưa có đơn hàng nào</h5>
                <p>Hãy mua sắm để xem lịch sử đơn hàng của bạn</p>
            </div>
        `;
    }

    async loadAddresses() {
        // Mock data for now - replace with actual API call
        const addressContainer = document.getElementById('addressList');
        if (!addressContainer) return;

        addressContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt"></i>
                <h5>Chưa có địa chỉ nào</h5>
                <p>Hãy thêm địa chỉ giao hàng để mua sắm dễ dàng hơn</p>
            </div>
        `;
    }

    // UI Helper Methods
    editField(field) {
        const editForm = document.getElementById('editForm');
        if (!editForm) return;

        editForm.style.display = 'block';

        // Populate form with current values
        document.getElementById('editName').value = this.getFullName();
        document.getElementById('editEmail').value = this.currentUser.email || '';
        document.getElementById('editPhone').value = this.currentUser.phone || '';

        if (this.currentUser.dob) {
            const dob = new Date(this.currentUser.dob);
            document.getElementById('editDob').value = dob.toISOString().split('T')[0];
        }

        document.getElementById('editGender').value = this.currentUser.gender === true ? 'Nam' :
            this.currentUser.gender === false ? 'Nữ' : '';

        // Scroll to form
        editForm.scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.style.display = 'none';
        }
    }

    addNewAddress() {
        this.showToast('Chức năng thêm địa chỉ mới sẽ được triển khai', 'info');
    }

    editAddress(id) {
        this.showToast('Chức năng chỉnh sửa địa chỉ sẽ được triển khai', 'info');
    }

    deleteAddress(id) {
        if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
            this.showToast('Địa chỉ đã được xóa', 'success');
        }
    }

    changePassword() {
        this.showToast('Chức năng đổi mật khẩu sẽ được triển khai', 'info');
    }

    enable2FA() {
        this.showToast('Chức năng xác thực 2FA sẽ được triển khai', 'info');
    }

    toggleNotifications() {
        this.showToast('Chức năng cài đặt thông báo sẽ được triển khai', 'info');
    }

    deleteAccount() {
        if (confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác!')) {
            this.showToast('Chức năng xóa tài khoản sẽ được triển khai', 'info');
        }
    }

    async uploadAvatarFile(file) {
        try {
            if (!file) return;
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập để cập nhật avatar');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/admin/api/upload/users/avatar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error('Upload avatar thất bại');

            const data = await response.json();
            const avatarUrl = data?.result?.avatarUrl || data?.data?.result?.avatarUrl;
            if (!avatarUrl) throw new Error('Không nhận được URL avatar');

            // Update UI immediately
            const img = document.getElementById('profileAvatar');
            if (img) img.src = avatarUrl;

            // Persist to profile
            await this.updateUserInfo({ avatar: avatarUrl, firstname: this.currentUser.firstname || '', lastname: this.currentUser.lastname || '' });

            this.showToast('Cập nhật avatar thành công!', 'success');
        } catch (e) {
            console.error(e);
            this.showError('Không thể cập nhật avatar');
        }
    }

    showLoading() {
        if (document.getElementById('loadingOverlay')) return; // avoid duplicates
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loadingOverlay';
        loadingElement.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loadingElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        loadingElement.style.zIndex = '9999';
        loadingElement.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner mb-3"></div>
                <p>Đang tải thông tin...</p>
            </div>
        `;
        document.body.appendChild(loadingElement);
    }

    hideLoading() {
        const loadingElement = document.getElementById('loadingOverlay');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-header">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} text-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} me-2"></i>
                <strong class="me-auto">Thông báo</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        // Remove toast element after it's hidden
        toast.addEventListener('hidden.bs.toast', function () {
            toast.remove();
        });
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }
}

// Global functions for HTML onclick events
function editField(field) {
    if (window.userInfoManager) {
        window.userInfoManager.editField(field);
    }
}

function cancelEdit() {
    if (window.userInfoManager) {
        window.userInfoManager.cancelEdit();
    }
}

function addNewAddress() {
    if (window.userInfoManager) {
        window.userInfoManager.addNewAddress();
    }
}

function editAddress(id) {
    if (window.userInfoManager) {
        window.userInfoManager.editAddress(id);
    }
}

function deleteAddress(id) {
    if (window.userInfoManager) {
        window.userInfoManager.deleteAddress(id);
    }
}

function changePassword() {
    if (window.userInfoManager) {
        window.userInfoManager.changePassword();
    }
}

function enable2FA() {
    if (window.userInfoManager) {
        window.userInfoManager.enable2FA();
    }
}

function toggleNotifications() {
    if (window.userInfoManager) {
        window.userInfoManager.toggleNotifications();
    }
}

function deleteAccount() {
    if (window.userInfoManager) {
        window.userInfoManager.deleteAccount();
    }
}

function uploadAvatar(e) {
    const file = e && e.target && e.target.files && e.target.files[0];
    if (window.userInfoManager && file) {
        window.userInfoManager.uploadAvatarFile(file);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.userInfoManager = new UserInfoManager();
});
