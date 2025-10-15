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
        this.currentEditingAddressId = null;
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.bindEvents();
        this.handleHashNavigation();
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
            this.loadOrderStats();
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

        // Hash change event
        window.addEventListener('hashchange', () => {
            this.handleHashNavigation();
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

        // Edit Address modal events
        const editAddressModalEl = document.getElementById('editAddressModal');
        if (editAddressModalEl) {
            // Click outside để đóng modal
            editAddressModalEl.addEventListener('click', (e) => {
                if (e.target === editAddressModalEl) {
                    this.closeEditAddressModal();
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

        // Edit Province change -> load wards
        const editProvinceSelect = document.getElementById('editAddrProvince');
        if (editProvinceSelect) {
            editProvinceSelect.addEventListener('change', (e) => {
                const provinceCode = e.target.value;
                this.loadEditWards(provinceCode);
            });
        }

        // Submit add address
        const submitAddBtn = document.getElementById('btnSubmitAddAddress');
        if (submitAddBtn) {
            submitAddBtn.addEventListener('click', () => this.submitAddAddress());
        }

        // Submit edit address
        const submitEditBtn = document.getElementById('btnSubmitEditAddress');
        if (submitEditBtn) {
            submitEditBtn.addEventListener('click', () => this.submitEditAddress());
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

    handleHashNavigation() {
        const hash = window.location.hash;
        if (hash === '#orders') {
            // Tìm và click vào tab orders
            const ordersTab = document.querySelector('[data-bs-target="#orders"]');
            if (ordersTab) {
                ordersTab.click();
            }
        } else if (hash === '#address') {
            // Tìm và click vào tab address
            const addressTab = document.querySelector('[data-bs-target="#address"]');
            if (addressTab) {
                addressTab.click();
            }
        }
    }

    async loadOrders() {
        const ordersContainer = document.getElementById('ordersList');
        if (!ordersContainer) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                this.showError('Vui lòng đăng nhập để xem lịch sử đơn hàng');
                return;
            }

            // Show loading state
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h5>Đang tải đơn hàng...</h5>
                    <p>Vui lòng chờ trong giây lát</p>
                </div>
            `;

            const response = await fetch('/users/myOrdersWithProducts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    this.showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }
                throw new Error('Failed to load orders');
            }

            const data = await response.json();
            console.log('Orders API response:', data);
            const ordersWithProducts = data.result || [];

            if (ordersWithProducts.length === 0) {
                ordersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <h5>Chưa có đơn hàng nào</h5>
                        <p>Hãy mua sắm để xem lịch sử đơn hàng của bạn</p>
                        <a href="/products" class="btn btn-primary">Mua sắm ngay</a>
                    </div>
                `;
            } else {
                ordersContainer.innerHTML = ordersWithProducts.map(orderWithProduct => this.createCompactOrderCard(orderWithProduct)).join('');
            }

        } catch (error) {
            this.showToast('Không thể tải lịch sử đơn hàng', 'error');
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h5>Lỗi tải đơn hàng</h5>
                    <p>Vui lòng thử lại sau</p>
                    <button class="btn btn-primary" onclick="userInfoManager.loadOrders()">Thử lại</button>
                </div>
            `;
        }
    }

    createCompactOrderCard(orderWithProduct) {
        const order = orderWithProduct.order;
        const firstProduct = orderWithProduct.firstProduct;
        const totalProducts = orderWithProduct.totalProducts;
        
        const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN');
        const totalAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.total);

        const statusClass = this.getOrderStatusClass(order.orderStatus);
        const statusText = this.getOrderStatusText(order.orderStatus);

        return `
            <div class="compact-order-card clickable-order" data-order-id="${order.idOrder}" onclick="userInfoManager.viewOrderDetail(${order.idOrder})">
                <div class="compact-order-header">
                    <div class="order-basic-info">
                        <h5 class="order-id">Đơn hàng #${order.idOrder}</h5>
                        <p class="order-date">
                            <i class="fas fa-calendar"></i>
                            ${orderDate}
                        </p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                
                <div class="compact-order-content">
                    <div class="product-preview">
                        ${firstProduct ? `
                        <div class="product-sample">
                            <img src="${firstProduct.mainImageUrl || 'https://placehold.co/60x60'}" 
                                 alt="${firstProduct.productName}" 
                                 class="product-image">
                            <div class="product-info">
                                <h6 class="product-name">${firstProduct.productName}</h6>
                                <p class="product-quantity">Số lượng: ${firstProduct.quantity}</p>
                            </div>
                        </div>
                        ` : `
                        <div class="no-product">
                            <i class="fas fa-box-open"></i>
                            <span>Không có sản phẩm</span>
                        </div>
                        `}
                    </div>
                    
                    <div class="order-summary-compact">
                        <div class="total-info">
                            <span class="total-amount">${totalAmount}</span>
                            <span class="product-count">(${totalProducts} sản phẩm)</span>
                        </div>
                    </div>
                </div>
                
                <div class="compact-order-actions">
                    <div class="click-hint">
                        <i class="fas fa-mouse-pointer"></i>
                        <span>Click để xem chi tiết</span>
                    </div>
                    ${order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED' ? `
                    <button class="btn btn-outline-success btn-sm" onclick="event.stopPropagation(); userInfoManager.reorder(${order.idOrder})">
                        <i class="fas fa-redo"></i> Mua lại
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createOrderCard(order) {
        const orderDate = new Date(order.orderDate).toLocaleDateString('vi-VN');
        const totalAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(order.total);

        const statusClass = this.getOrderStatusClass(order.orderStatus);
        const statusText = this.getOrderStatusText(order.orderStatus);

        return `
            <div class="order-card" data-order-id="${order.idOrder}">
                <div class="order-header">
                    <div class="order-info">
                        <h5 class="order-id">Đơn hàng #${order.idOrder}</h5>
                        <p class="order-date">
                            <i class="fas fa-calendar"></i>
                            ${orderDate}
                        </p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                
                <div class="order-details">
                    <div class="order-summary">
                        <div class="summary-item">
                            <span class="label">Phương thức thanh toán:</span>
                            <span class="value">${order.paymentMethod}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Địa chỉ giao hàng:</span>
                            <span class="value">${order.addressDetail}</span>
                        </div>
                        ${order.note ? `
                        <div class="summary-item">
                            <span class="label">Ghi chú:</span>
                            <span class="value">${order.note}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="order-total">
                        <span class="total-label">Tổng tiền:</span>
                        <span class="total-amount">${totalAmount}</span>
                    </div>
                </div>
                
                <div class="order-actions">
                    <button class="btn btn-outline-primary btn-sm" onclick="userInfoManager.viewOrderDetail(${order.idOrder})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    ${order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED' ? `
                    <button class="btn btn-outline-success btn-sm" onclick="userInfoManager.reorder(${order.idOrder})">
                        <i class="fas fa-redo"></i> Mua lại
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getOrderStatusClass(status) {
        const statusMap = {
            'PENDING': 'status-pending',
            'COMPLETED': 'status-completed',
            'CANCELLED': 'status-cancelled'
        };
        return statusMap[status] || 'status-pending';
    }

    getOrderStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ xử lý',
            'COMPLETED': 'Hoàn tất',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    async viewOrderDetail(orderId) {
        // Chuyển đến trang chi tiết đơn hàng
        window.location.href = `/user/order-detail/${orderId}`;
    }

    async reorder(orderId) {
        // TODO: Implement reorder functionality
        this.showToast('Tính năng mua lại sẽ được cập nhật sớm', 'info');
    }


    async loadOrderStats() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch('/users/orderStats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            console.log('Order stats API response:', data);
            const stats = data.result;

            // Update profile stats
            const totalOrdersElement = document.getElementById('totalOrders');
            const totalSpentElement = document.getElementById('totalSpent');
            const memberSinceElement = document.getElementById('memberSince');

            if (totalOrdersElement) {
                totalOrdersElement.textContent = stats.totalOrders || 0;
            }

            if (totalSpentElement) {
                const totalSpent = stats.totalSpent || 0;
                totalSpentElement.textContent = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    minimumFractionDigits: 0
                }).format(totalSpent);
            }

            if (memberSinceElement && this.currentUser?.createdDate) {
                const createdDate = new Date(this.currentUser.createdDate);
                memberSinceElement.textContent = createdDate.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long'
                });
            }

        } catch (error) {
            // Silently fail for stats - not critical
            console.log('Could not load order stats:', error);
        }
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
            const addresses = await res.json();

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
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            console.error('Lỗi tải tỉnh/thành:', e);
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    async editAddress(id) {
        if (!id) return;

        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }

            // Load address details
            const res = await fetch(`/addresses/${this.currentUser.userId}/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Không thể tải thông tin địa chỉ');
            const address = await res.json();

            // Store current editing address ID
            this.currentEditingAddressId = id;

            // Populate edit form
            this.populateEditForm(address);

            // Show edit modal
            this.showEditAddressModal();

        } catch (e) {
            console.error('Lỗi tải địa chỉ:', e);
            this.showError('Không thể tải thông tin địa chỉ');
        }
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

            if (res.status === 204) {
                this.showToast('Đã xóa địa chỉ', 'success');
                this.loadAddresses();
            } else if (res.status === 400) {
                const errorData = await res.json().catch(() => ({}));
                if (errorData.message && errorData.message.includes('default address')) {
                    this.showError('Không thể xóa địa chỉ mặc định. Vui lòng chọn địa chỉ khác làm mặc định trước.');
                } else {
                    this.showError('Không thể xóa địa chỉ này');
                }
            } else if (res.status === 404) {
                this.showError('Địa chỉ không tồn tại');
            } else {
                this.showError('Xóa địa chỉ thất bại');
            }
        } catch (e) {
            console.error('Lỗi xóa địa chỉ:', e);
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

    closeAddressModal() {
        const el = document.getElementById('addAddressModal');
        if (!el) return;
        el.classList.remove('show');
    }

    populateEditForm(address) {
        document.getElementById('editAddrName').value = address?.name || '';
        document.getElementById('editAddrPhone').value = address?.phone || '';
        document.getElementById('editAddrDetail').value = address?.addressDetail || '';
        document.getElementById('editAddrDefault').checked = address?.isDefault || false;

        // Load provinces first, then find matching province code and load wards
        this.loadEditProvincesWithMapping(address?.province, address?.ward);
    }

    async loadEditProvincesWithMapping(provinceName = null, wardName = null) {
        const provinceSelect = document.getElementById('editAddrProvince');
        if (!provinceSelect) return;


        // Kiểm tra cache trước
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: p.code, label: p.name })),
                'Chọn Tỉnh/Thành phố'
            );

            if (provinceName) {
                // Tìm province code từ province name
                const matchingProvince = this.provincesCache.find(p => p.name === provinceName);
                if (matchingProvince) {
                    provinceSelect.value = matchingProvince.code;
                    this.loadEditWards(matchingProvince.code, wardName);
                }
            }
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`${this.waveBearBase}/provider`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            if (Array.isArray(provinces) && provinces.length > 0) {
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                this.populateSelect(
                    provinceSelect,
                    provinces.map(p => ({ value: p.code, label: p.name })),
                    'Chọn Tỉnh/Thành phố'
                );

                if (provinceName) {
                    // Tìm province code từ province name
                    const matchingProvince = provinces.find(p => p.name === provinceName);
                    if (matchingProvince) {
                        provinceSelect.value = matchingProvince.code;
                        this.loadEditWards(matchingProvince.code, wardName);
                    }
                }
            } else {
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            console.error('Lỗi tải tỉnh/thành:', e);
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    async loadEditProvinces(selectedProvince = null, selectedWard = null) {
        const provinceSelect = document.getElementById('editAddrProvince');
        if (!provinceSelect) return;

        // Kiểm tra cache trước
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: p.code, label: p.name })),
                'Chọn Tỉnh/Thành phố'
            );

            if (selectedProvince) {
                provinceSelect.value = selectedProvince;
                this.loadEditWards(selectedProvince, selectedWard);
            }
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`${this.waveBearBase}/provider`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            if (Array.isArray(provinces) && provinces.length > 0) {
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                this.populateSelect(
                    provinceSelect,
                    provinces.map(p => ({ value: p.code, label: p.name })),
                    'Chọn Tỉnh/Thành phố'
                );

                if (selectedProvince) {
                    provinceSelect.value = selectedProvince;
                    this.loadEditWards(selectedProvince, selectedWard);
                }
            } else {
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            console.error('Lỗi tải tỉnh/thành:', e);
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    async loadEditWards(provinceCode, selectedWard = null) {
        const wardSelect = document.getElementById('editAddrWard');
        if (!provinceCode || !wardSelect) return;

        // Kiểm tra cache trước
        if (this.isCacheValid(`wards_${provinceCode}`) && this.wardsCacheByProvince.has(provinceCode)) {
            const cachedWards = this.wardsCacheByProvince.get(provinceCode);
            this.populateSelect(wardSelect, cachedWards.map(w => ({ value: w.name, label: w.name })), 'Chọn Phường/Xã');

            if (selectedWard) {
                wardSelect.value = selectedWard;
            }
            wardSelect.disabled = false;
            return;
        }

        wardSelect.disabled = true;
        wardSelect.innerHTML = '<option value="">Đang tải Phường/Xã...</option>';

        try {
            const res = await fetch(`${this.waveBearBase}/ward/${encodeURIComponent(provinceCode)}`);
            if (!res.ok) throw new Error('Không thể tải phường/xã');
            const wards = await res.json();

            if (Array.isArray(wards) && wards.length > 0) {
                this.wardsCacheByProvince.set(provinceCode, wards);
                this.cacheTimestamp.set(`wards_${provinceCode}`, Date.now());

                this.populateSelect(wardSelect, wards.map(w => ({ value: w.name, label: w.name })), 'Chọn Phường/Xã');

                if (selectedWard) {
                    wardSelect.value = selectedWard;
                }
            } else {
                throw new Error('Dữ liệu phường/xã không hợp lệ');
            }
            wardSelect.disabled = false;
        } catch (e) {
            console.error('Lỗi tải phường/xã:', e);
            wardSelect.innerHTML = '<option value="">Không có dữ liệu phường/xã</option>';
        }
    }

    showEditAddressModal() {
        const modal = document.getElementById('editAddressModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';

            // Focus vào input đầu tiên
            setTimeout(() => {
                const firstInput = modal.querySelector('input');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    closeEditAddressModal() {
        const modal = document.getElementById('editAddressModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            this.resetEditAddressForm();
        }
    }

    resetEditAddressForm() {
        const form = document.getElementById('editAddressForm');
        if (form) form.reset();
        const wardSelect = document.getElementById('editAddrWard');
        if (wardSelect) {
            wardSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            wardSelect.disabled = true;
        }
        const provinceSelect = document.getElementById('editAddrProvince');
        if (provinceSelect) {
            provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
        }
    }

    async submitEditAddress() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token || !this.currentUser?.userId) {
                this.showError('Vui lòng đăng nhập');
                return;
            }

            const form = document.getElementById('editAddressForm');
            if (!form) return;

            const provinceCode = document.getElementById('editAddrProvince').value.trim();
            const wardName = document.getElementById('editAddrWard').value.trim();

            // Validation
            if (!document.getElementById('editAddrName').value.trim() ||
                !document.getElementById('editAddrPhone').value.trim() ||
                !document.getElementById('editAddrDetail').value.trim() ||
                !wardName || !provinceCode) {
                this.showError('Vui lòng điền đầy đủ thông tin');
                return;
            }

            // Map province code back to province name
            let provinceName = '';
            if (this.provincesCache) {
                const matchingProvince = this.provincesCache.find(p => p.code === provinceCode);
                if (matchingProvince) {
                    provinceName = matchingProvince.name;
                } else {
                    this.showError('Không tìm thấy tên tỉnh/thành phố');
                    return;
                }
            } else {
                this.showError('Dữ liệu tỉnh/thành không khả dụng');
                return;
            }

            const addressData = {
                name: document.getElementById('editAddrName').value.trim(),
                phone: document.getElementById('editAddrPhone').value.trim(),
                addressDetail: document.getElementById('editAddrDetail').value.trim(),
                ward: wardName,
                province: provinceName, // Lưu province name thay vì code
                isDefault: document.getElementById('editAddrDefault').checked
            };

            // Get address ID from current editing address
            const currentAddressId = this.currentEditingAddressId;
            if (!currentAddressId) {
                this.showError('Không tìm thấy ID địa chỉ');
                return;
            }

            const res = await fetch(`/addresses/${this.currentUser.userId}/${currentAddressId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });

            if (res.ok) {
                this.showToast('Cập nhật địa chỉ thành công', 'success');
                this.closeEditAddressModal();
                await this.loadAddresses();
            } else {
                const errorData = await res.json().catch(() => ({}));
                this.showError(errorData.message || 'Cập nhật địa chỉ thất bại');
            }
        } catch (e) {
            console.error('Lỗi cập nhật địa chỉ:', e);
            this.showError('Không thể cập nhật địa chỉ');
        }
    }

    async submitAddAddress() {
        // Prevent double submission
        const submitBtn = document.getElementById('btnSubmitAddAddress');
        if (submitBtn.disabled) return;

        try {
            // Disable submit button to prevent double submission
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

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

            // Close modal properly using CSS class
            this.closeAddressModal();

            // Reset form
            this.resetAddAddressForm();

            // Reload addresses
            this.loadAddresses();
        } catch (e) {
            console.error(e);
            this.showError(e?.message || 'Không thể lưu địa chỉ');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu địa chỉ';
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

            if (Array.isArray(wards) && wards.length > 0) {
                // Lưu vào cache
                this.wardsCacheByProvince.set(provinceCode, wards);
                this.cacheTimestamp.set(`wards_${provinceCode}`, Date.now());

                this.populateSelect(wardSelect, wards.map(w => ({ value: w.name, label: w.name })), 'Chọn Phường/Xã');
            } else {
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

function closeEditAddressModal() {
    if (window.userInfoManager) {
        window.userInfoManager.closeEditAddressModal();
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
    if (window.userInfoManager) {
        window.userInfoManager.closeAddressModal();
    } else {
        const el = document.getElementById('addAddressModal');
        if (!el) return;
        el.classList.remove('show');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    window.userInfoManager = new UserInfoManager();
});
