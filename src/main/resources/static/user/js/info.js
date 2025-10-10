// User Info Page JavaScript
class UserInfoManager {
    constructor() {
        this.currentUser = null;
        this.waveBearBase = '/api/location';
        this.addAddressModalInstance = null;
        // Cache system cho tối ưu hiệu năng
        this.provincesCache = null;
        this.wardsCacheByProvince = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 phút
        this.cacheTimestamp = new Map();
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.bindEvents();
        // Dọn dẹp cache hết hạn mỗi 1 phút
        setInterval(() => this.clearExpiredCache(), 60000);
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

        // Add Address modal events - Custom modal không cần Bootstrap events
        const addAddressModalEl = document.getElementById('addAddressModal');
        if (addAddressModalEl) {
            // Click outside để đóng modal
            addAddressModalEl.addEventListener('click', (e) => {
                if (e.target === addAddressModalEl) {
                    closeAddressModal();
                }
            });
        }

        // Province change -> load wards
        const provinceSelect = document.getElementById('addrProvince');
        if (provinceSelect) {
            provinceSelect.addEventListener('change', (e) => {
                const provinceCode = e.target.value;
                this.loadWards(provinceCode);
            });
        }

        // Submit add address
        const submitAddBtn = document.getElementById('btnSubmitAddAddress');
        if (submitAddBtn) {
            submitAddBtn.addEventListener('click', () => this.submitAddAddress());
        }
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
        const addressContainer = document.getElementById('addressList');
        if (!addressContainer) return;

        // Loading placeholder
        addressContainer.innerHTML = `
			<div class="empty-state">
				<i class="fas fa-spinner fa-spin"></i>
				<h5>Đang tải địa chỉ...</h5>
				<p>Vui lòng chờ trong giây lát</p>
			</div>
		`;

        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                addressContainer.innerHTML = `
					<div class="empty-state">
						<i class="fas fa-map-marker-alt"></i>
						<h5>Chưa đăng nhập</h5>
						<p>Vui lòng đăng nhập để quản lý địa chỉ</p>
					</div>
				`;
                return;
            }

            const res = await fetch(`/addresses/${this.currentUser.userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!res.ok) throw new Error('Không thể tải địa chỉ');
            const data = await res.json();
            const addresses = data?.result || data || [];

            if (!Array.isArray(addresses) || addresses.length === 0) {
                addressContainer.innerHTML = `
					<div class="empty-state">
						<i class="fas fa-map-marker-alt"></i>
						<h5>Chưa có địa chỉ nào</h5>
						<p>Hãy thêm địa chỉ giao hàng để mua sắm dễ dàng hơn</p>
					</div>
				`;
                return;
            }

            addressContainer.innerHTML = addresses.map(addr => this.renderAddressCard(addr)).join('');
        } catch (e) {
            console.error(e);
            addressContainer.innerHTML = `
				<div class="empty-state">
					<i class="fas fa-exclamation-triangle"></i>
					<h5>Lỗi khi tải địa chỉ</h5>
					<p>Vui lòng thử lại sau</p>
				</div>
			`;
        }
    }

    renderAddressCard(addr) {
        const isDefault = addr?.isDefault ? '<span class="badge bg-success ms-2">Mặc định</span>' : '';
        const fullAddress = [addr?.addressDetail, addr?.ward, addr?.province].filter(Boolean).join(', ');
        return `
			<div class="card mb-3">
				<div class="card-body d-flex justify-content-between align-items-start flex-wrap">
					<div class="me-3">
						<h6 class="mb-1">${this.escapeHtml(addr?.name || '')} ${isDefault}</h6>
						<div class="text-muted small mb-1"><i class="fas fa-phone me-1"></i>${this.escapeHtml(addr?.phone || '')}</div>
						<div><i class="fas fa-location-dot me-1"></i>${this.escapeHtml(fullAddress)}</div>
					</div>
					<div class="d-flex gap-2 mt-2 mt-md-0">
						<button class="btn btn-sm btn-outline-primary" onclick="editAddress(${addr?.idAddress})"><i class="fas fa-edit"></i></button>
						<button class="btn btn-sm btn-outline-danger" onclick="deleteAddress(${addr?.idAddress})"><i class="fas fa-trash"></i></button>
					</div>
				</div>
			</div>
		`;
    }

    escapeHtml(str) {
        try {
            return String(str)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        } catch (_) { return ''; }
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

    async addNewAddress() {
        const el = document.getElementById('addAddressModal');
        if (!el) return;

        // Reset form
        this.resetAddAddressForm();

        // Hiển thị modal ngay lập tức (zero flicker)
        el.classList.add('show');

        // Tải dữ liệu tỉnh/thành từ cache hoặc API
        await this.loadProvinces();

        // Focus vào input đầu tiên
        setTimeout(() => {
            const firstInput = el.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }, 50);
    }

    async loadProvinces() {
        const provinceSelect = document.getElementById('addrProvince');
        if (!provinceSelect) return;

        // Kiểm tra cache trước
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: p.code, label: p.name })),
                'Chọn Tỉnh/Thành phố'
            );
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`${this.waveBearBase}/provider`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            console.log('API response provinces:', provinces);

            if (Array.isArray(provinces) && provinces.length > 0) {
                // Lưu vào cache
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                this.populateSelect(
                    provinceSelect,
                    provinces.map(p => ({ value: p.code, label: p.name })),
                    'Chọn Tỉnh/Thành phố'
                );
            } else {
                console.log('Dữ liệu tỉnh/thành không hợp lệ:', provinces);
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            console.error('Lỗi tải tỉnh/thành:', e);
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    editAddress(id) {
        this.showToast('Chức năng chỉnh sửa địa chỉ sẽ được triển khai', 'info');
    }

    async deleteAddress(id) {
        if (!id) return;
        if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }
            const res = await fetch(`/addresses/${this.currentUser.userId}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status !== 204 && !res.ok) throw new Error('Xóa địa chỉ thất bại');
            this.showToast('Đã xóa địa chỉ', 'success');
            this.loadAddresses();
        } catch (e) {
            console.error(e);
            this.showError('Không thể xóa địa chỉ');
        }
    }

    resetAddAddressForm() {
        const form = document.getElementById('addAddressForm');
        if (form) form.reset();
        const wardSelect = document.getElementById('addrWard');
        if (wardSelect) {
            wardSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            wardSelect.disabled = true;
        }
        const provinceSelect = document.getElementById('addrProvince');
        if (provinceSelect) {
            provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
        }
    }

    async submitAddAddress() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }
            const name = document.getElementById('addrName')?.value?.trim();
            const phone = document.getElementById('addrPhone')?.value?.trim();
            const addressDetail = document.getElementById('addrDetail')?.value?.trim();
            const provinceCode = document.getElementById('addrProvince')?.value;
            const wardName = document.getElementById('addrWard')?.value;
            const isDefault = document.getElementById('addrDefault')?.checked || false;

            if (!name || !phone || !addressDetail || !provinceCode || !wardName) {
                this.showError('Vui lòng điền đầy đủ thông tin địa chỉ');
                return;
            }

            // Province text for storage
            const provinceText = document.querySelector('#addrProvince option:checked')?.textContent?.trim() || '';

            const payload = {
                name,
                phone,
                addressDetail,
                ward: wardName,
                province: provinceText,
                isDefault
            };

            const res = await fetch(`/addresses/${this.currentUser.userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                let msg = 'Không thể lưu địa chỉ';
                try { const err = await res.json(); msg = err?.message || msg; } catch (_) { }
                throw new Error(msg);
            }

            this.showToast('Đã lưu địa chỉ thành công', 'success');
            // Close modal
            const el = document.getElementById('addAddressModal');
            const modal = el ? bootstrap.Modal.getInstance(el) : null;
            if (modal) modal.hide();

            this.loadAddresses();
        } catch (e) {
            console.error(e);
            this.showError(e?.message || 'Không thể lưu địa chỉ');
        }
    }


    // Kiểm tra cache có còn hiệu lực không
    isCacheValid(key) {
        const timestamp = this.cacheTimestamp.get(key);
        if (!timestamp) return false;
        return (Date.now() - timestamp) < this.cacheExpiry;
    }

    // Xóa cache hết hạn
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, timestamp] of this.cacheTimestamp.entries()) {
            if (now - timestamp >= this.cacheExpiry) {
                this.cacheTimestamp.delete(key);
                if (key === 'provinces') {
                    this.provincesCache = null;
                } else if (key.startsWith('wards_')) {
                    const provinceCode = key.replace('wards_', '');
                    this.wardsCacheByProvince.delete(provinceCode);
                }
            }
        }
    }

    async loadWards(provinceCode) {
        const wardSelect = document.getElementById('addrWard');
        if (!wardSelect) return;
        if (!provinceCode) {
            wardSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            wardSelect.disabled = true;
            return;
        }

        // Kiểm tra cache trước
        if (this.isCacheValid(`wards_${provinceCode}`) && this.wardsCacheByProvince.has(provinceCode)) {
            const cachedWards = this.wardsCacheByProvince.get(provinceCode);
            this.populateSelect(wardSelect, cachedWards.map(w => ({ value: w.name, label: w.name })), 'Chọn Phường/Xã');
            wardSelect.disabled = false;
            return;
        }

        try {
            wardSelect.disabled = true;
            wardSelect.innerHTML = '<option value="">Đang tải Phường/Xã...</option>';

            const res = await fetch(`${this.waveBearBase}/ward/${encodeURIComponent(provinceCode)}`);
            if (!res.ok) throw new Error('Không thể tải phường/xã');
            const wards = await res.json();

            console.log('API response wards:', wards);

            if (Array.isArray(wards) && wards.length > 0) {
                // Lưu vào cache
                this.wardsCacheByProvince.set(provinceCode, wards);
                this.cacheTimestamp.set(`wards_${provinceCode}`, Date.now());

                this.populateSelect(wardSelect, wards.map(w => ({ value: w.name, label: w.name })), 'Chọn Phường/Xã');
            } else {
                console.log('Dữ liệu phường/xã không hợp lệ:', wards);
                throw new Error('Dữ liệu phường/xã không hợp lệ');
            }
            wardSelect.disabled = false;
        } catch (e) {
            console.error('Lỗi tải phường/xã:', e);
            wardSelect.innerHTML = '<option value="">Không có dữ liệu phường/xã</option>';
            wardSelect.disabled = true;
        }
    }

    populateSelect(selectEl, options, placeholder) {
        const opts = [`<option value="">${this.escapeHtml(placeholder || 'Chọn')}</option>`]
            .concat(options.map(o => `<option value="${this.escapeHtml(o.value)}">${this.escapeHtml(o.label)}</option>`));
        selectEl.innerHTML = opts.join('');
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

// Đóng modal địa chỉ - CSS only (zero flicker)
function closeAddressModal() {
    const el = document.getElementById('addAddressModal');
    if (!el) return;
    el.classList.remove('show');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.userInfoManager = new UserInfoManager();
});
