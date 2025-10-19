class CheckoutPage {
    constructor() {
        this.cartId = null;
        this.selectedItems = [];
        this.appliedDiscount = null;
        this.shippingFee = 0;
        this.discount = 0;
        this.currentUser = null;
        this.addresses = [];
        this.selectedAddressId = null;
        this.ghnBase = '/api/ghn';
        this.provincesCache = null;
        this.districtsCacheByProvince = new Map();
        this.wardsCacheByDistrict = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 phút
        this.cacheTimestamp = new Map();
        this.currentEditingAddressId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCheckoutData();
    }

    bindEvents() {
        // Form submission
        $('#checkoutForm').on('submit', (e) => {
            e.preventDefault();
            this.handlePlaceOrder();
        });

        // Apply promo code
        $('#applyPromoBtn').on('click', () => {
            this.handleApplyPromo();
        });

        // Apply/Remove promo code
        $('#applyPromoBtn').on('click', () => {
            if (this.appliedDiscount) {
                this.handleRemovePromo();
            } else {
                this.handleApplyPromo();
            }
        });

        // Province change -> load districts for add/edit address
        $(document).on('change', '#addrProvince', (e) => {
            const provinceId = parseInt(e.target.value, 10);
            this.loadDistricts(provinceId);
            const wardSelect = document.getElementById('addrWard');
            if (wardSelect) { wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>'; wardSelect.disabled = true; }
        });
        $(document).on('change', '#addrDistrict', (e) => {
            const districtId = parseInt(e.target.value, 10);
            this.loadWardsByDistrict(districtId);
        });

        $(document).on('change', '#editAddrProvince', (e) => {
            const provinceId = parseInt(e.target.value, 10);
            this.loadEditDistricts(provinceId);
            const wardSelect = document.getElementById('editAddrWard');
            if (wardSelect) { wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>'; wardSelect.disabled = true; }
        });
        $(document).on('change', '#editAddrDistrict', (e) => {
            const districtId = parseInt(e.target.value, 10);
            this.loadEditWards(districtId);
        });

        // Province change -> load districts for shipping form
        $(document).on('change', '#shippingProvince', (e) => {
            const provinceId = e.target.value;
            this.loadShippingDistricts(provinceId);
        });

        // District change -> load wards for shipping form
        $(document).on('change', '#shippingDistrict', (e) => {
            const districtId = e.target.value;
            this.loadShippingWards(districtId);
            // Update shipping fee when district changes
            this.updateShippingFee();
        });

        // Ward change -> update shipping fee
        $(document).on('change', '#shippingWard', (e) => {
            this.updateShippingFee();
        });

        // Payment method selection
        $(document).on('click', '.payment-option-row', (e) => {
            this.handlePaymentMethodSelect(e);
        });

        // Quantity controls
        $(document).on('click', '.quantity-btn', (e) => {
            this.handleQuantityChange(e);
        });

        $(document).on('change', '.quantity-input', (e) => {
            this.handleQuantityInputChange(e);
        });

        // Chỉ validation khi nhấn Enter hoặc blur (không validation real-time)
        $(document).on('keypress', '.quantity-input', (e) => {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                console.log('Checkout Enter pressed, validating...', e.target.value);
                this.handleQuantityInputChange(e);
            }
        });

        // Xử lý khi ra khỏi ô input (blur event)
        $(document).on('blur', '.quantity-input', (e) => {
            console.log('Checkout blur event, validating...', e.target.value);
            this.handleQuantityInputChange(e);
        });

        // Delete item
        $(document).on('click', '.btn-delete', (e) => {
            console.log('Delete button clicked!');
            this.handleRemoveItem(e);
        });
    }

    async loadCheckoutData() {
        try {
            this.showLoading(true);

            // Load user info first
            await this.loadUserInfo();

            // Lấy thông tin giỏ hàng hiện tại
            const cartResponse = await this.apiCall('/cart/api/current', 'GET');
            this.cartId = cartResponse.cartId;

            if (this.cartId) {
                // Lấy danh sách sản phẩm đã chọn
                const selectedItemsResponse = await this.apiCall(`/CartProduct/${this.cartId}/selected-products`, 'GET');
                this.selectedItems = selectedItemsResponse;
                this.renderSelectedItems();
                this.updateOrderSummary();
            } else {
                this.showEmptyCheckout();
            }
        } catch (error) {
            this.showToast('Không thể tải thông tin thanh toán', 'error');
            this.showEmptyCheckout();
        } finally {
            this.showLoading(false);
        }
    }

    async loadUserInfo() {
        try {
            // Try to get current user info
            const response = await this.apiCall('/users/myInfo', 'GET');
            this.currentUser = response.result;
            this.renderUserInfo(this.currentUser);
            // Load addresses after user info is loaded
            await this.loadAddresses();
        } catch (error) {
            this.renderLoginPrompt();
            // Guest mode: load provinces for shipping form so guest can checkout
            try {
                await this.loadShippingProvinces();
            } catch (_) { /* no-op for guest */ }
        }
    }

    async loadAddresses() {
        if (!this.currentUser?.userId) {
            return;
        }

        try {
            const addresses = await this.apiCall(`/addresses/${this.currentUser.userId}`, 'GET');
            this.addresses = addresses;
            await this.resolveAddressesNames();

            // Load provinces first
            await this.loadShippingProvinces();

            // Auto-fill default address into form
            const defaultAddress = addresses.find(addr => addr.isDefault);
            if (defaultAddress) {
                this.selectedAddressId = defaultAddress.idAddress;
                this.fillAddressToForm(defaultAddress);
            } else if (addresses.length > 0) {
                // If no default, use first address
                this.selectedAddressId = addresses[0].idAddress;
                this.fillAddressToForm(addresses[0]);
            }
        } catch (error) {
            this.showToast('Không thể tải danh sách địa chỉ', 'error');
        }
    }

    // Resolve names for display using GHN (similar to info.js)
    async resolveAddressesNames() {
        if (!Array.isArray(this.addresses)) return;
        const resolved = await Promise.all(this.addresses.map(async (addr) => {
            const provinceName = await this.getProvinceName(addr.provinceId);
            const districtName = await this.getDistrictName(addr.provinceId, addr.districtId);
            const wardName = await this.getWardName(addr.districtId, addr.wardCode);
            return { ...addr, _provinceName: provinceName, _districtName: districtName, _wardName: wardName };
        }));
        this.addresses = resolved;
    }

    async getProvinceName(provinceId) {
        try {
            if (!provinceId) return '';
            if (this.provincesCache && Array.isArray(this.provincesCache)) {
                const found = this.provincesCache.find(p => (p.ProvinceID || p.provinceId || p.code) == provinceId);
                if (found) return (found.ProvinceName || found.provinceName || found.name) || '';
            }
            const res = await fetch('/api/ghn/provinces');
            if (!res.ok) return '';
            const provinces = await res.json();
            this.provincesCache = provinces;
            const found = provinces.find(p => (p.ProvinceID || p.provinceId || p.code) == provinceId);
            return found ? ((found.ProvinceName || found.provinceName || found.name) || '') : '';
        } catch (_) { return ''; }
    }

    async getDistrictName(provinceId, districtId) {
        try {
            if (!provinceId || !districtId) return '';
            this.districtsCacheByProvince = this.districtsCacheByProvince || new Map();
            const key = String(provinceId);
            let list = this.districtsCacheByProvince.get(key);
            if (!list) {
                const res = await fetch(`/api/ghn/districts/${provinceId}`);
                if (!res.ok) return '';
                list = await res.json();
                this.districtsCacheByProvince.set(key, list);
            }
            const found = (list || []).find(d => (d.DistrictID || d.districtId) == districtId);
            return found ? ((found.DistrictName || found.districtName || found.name) || '') : '';
        } catch (_) { return ''; }
    }

    async getWardName(districtId, wardCode) {
        try {
            if (!districtId || !wardCode) return '';
            this.wardsCacheByDistrict = this.wardsCacheByDistrict || new Map();
            const key = String(districtId);
            let list = this.wardsCacheByDistrict.get(key);
            if (!list) {
                const res = await fetch(`/api/ghn/wards/${districtId}`);
                if (!res.ok) return '';
                list = await res.json();
                this.wardsCacheByDistrict.set(key, list);
            }
            const found = (list || []).find(w => (w.WardCode || w.wardCode) == wardCode);
            return found ? ((found.WardName || found.wardName || found.name) || '') : '';
        } catch (_) { return ''; }
    }

    async fillAddressToForm(address) {
        if (!address) return;

        // Fill address name (not user name)
        $('#shippingFullName').val(address.name || '');

        // Fill user email from current user
        if (this.currentUser) {
            $('#shippingGmail').val(this.currentUser.email || '');
        }

        // Fill address info
        $('#shippingPhone').val(address.phone || '');
        $('#shippingAddressDetail').val(address.addressDetail || '');

        // Fill province/district/ward by IDs (GHN)
        if (address.provinceId) {
            $('#shippingProvince').val(address.provinceId);
            await this.loadShippingDistricts(address.provinceId);
            if (address.districtId) {
                $('#shippingDistrict').val(address.districtId);
                await this.loadShippingWards(address.districtId);
                if (address.wardCode) {
                    $('#shippingWard').val(address.wardCode);
                }
            }
            try { this.updateShippingFee(); } catch (_) { }
        }
    }

    showAddressSelector() {
        if (!this.addresses || this.addresses.length === 0) {
            this.showToast('Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ trước.', 'info');
            return;
        }

        // Create address selector modal
        const modalHTML = `
            <div class="modal fade show" id="addressSelectorModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Chọn địa chỉ giao hàng</h5>
                            <button type="button" class="btn-close" onclick="checkoutPage.closeAddressSelector()"></button>
                        </div>
                        <div class="modal-body">
                            <div class="address-list">
                                ${this.addresses.map(addr => this.createAddressOption(addr)).join('')}
                            </div>
                            <div class="text-center mt-3">
                                <button class="btn btn-outline-primary" onclick="checkoutPage.addNewAddress()">
                                    <i class="fas fa-plus me-1"></i>Thêm địa chỉ mới
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="checkoutPage.closeAddressSelector()">Hủy</button>
                            <button type="button" class="btn btn-primary" onclick="checkoutPage.selectAddress()">
                                <i class="fas fa-check"></i> Chọn địa chỉ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHTML);
        // Render immediately with current data to avoid blocking UI
        try {
            const initialHtml = (this.addresses || []).map(addr => this.createAddressOption(addr)).join('');
            $('.address-list').html(initialHtml);
        } catch (_) { $('.address-list').html(''); }
        // Resolve names in background, then update if modal still open
        Promise.resolve()
            .then(() => this.resolveAddressesNames())
            .then(() => {
                if ($('#addressSelectorModal').length) {
                    const listHtml = (this.addresses || []).map(addr => this.createAddressOption(addr)).join('');
                    $('.address-list').html(listHtml);
                }
            })
            .catch(() => { /* no-op to keep modal responsive */ });
    }

    createAddressOption(address) {
        const isDefault = address.isDefault ? '<span class="badge bg-success ms-2">Mặc định</span>' : '';
        const fullAddress = [
            address.addressDetail,
            address._wardName || '',
            address._districtName || '',
            address._provinceName || ''
        ].filter(Boolean).join(', ');
        const isSelected = this.selectedAddressId === address.idAddress ? 'checked' : '';

        return `
            <div class="address-option mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="addressOption" 
                           value="${address.idAddress}" id="option-${address.idAddress}" ${isSelected}>
                    <label class="form-check-label w-100" for="option-${address.idAddress}">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">${this.escapeHtml(address.name || '')} ${isDefault}</h6>
                                        <div class="text-muted small mb-1">
                                            <i class="fas fa-phone me-1"></i>${this.escapeHtml(address.phone || '')}
                                        </div>
                                        <div class="text-muted small">
                                            <i class="fas fa-location-dot me-1"></i>${this.escapeHtml(fullAddress)}
                                        </div>
                                    </div>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-sm btn-outline-primary" onclick="checkoutPage.editAddress(${address.idAddress})" title="Sửa địa chỉ">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="checkoutPage.deleteAddress(${address.idAddress})" title="Xóa địa chỉ">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        `;
    }

    async selectAddress() {
        const selectedOption = $('input[name="addressOption"]:checked');
        if (selectedOption.length === 0) {
            this.showToast('Vui lòng chọn một địa chỉ', 'error');
            return;
        }

        const addressId = parseInt(selectedOption.val());
        const selectedAddress = this.addresses.find(addr => addr.idAddress === addressId);

        if (selectedAddress) {
            this.selectedAddressId = addressId;
            await this.fillAddressToForm(selectedAddress);
            this.closeAddressSelector();
            this.showToast('Đã chọn địa chỉ giao hàng', 'success');
        }
    }

    closeAddressSelector() {
        $('#addressSelectorModal').remove();
    }

    // Shipping form province/ward methods
    async loadShippingProvinces() {
        const provinceSelect = document.getElementById('shippingProvince');
        if (!provinceSelect) return;

        // Check cache first
        if (this.isCacheValid('provinces') && this.provincesCache) {
            const opts = this.provincesCache.map(p => ({
                value: p.provinceId ?? p.ProvinceID ?? p.ProvinceId ?? p.id ?? '',
                label: p.provinceName ?? p.ProvinceName ?? p.name ?? p.Name ?? 'undefined'
            }));
            this.populateSelect(provinceSelect, opts, 'Chọn Tỉnh/Thành phố');
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`/api/ghn/provinces`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            if (Array.isArray(provinces) && provinces.length > 0) {
                // Save to cache
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                const opts = provinces.map(p => ({
                    value: p.provinceId ?? p.ProvinceID ?? p.ProvinceId ?? p.id ?? '',
                    label: p.provinceName ?? p.ProvinceName ?? p.name ?? p.Name ?? 'undefined'
                }));
                this.populateSelect(provinceSelect, opts, 'Chọn Tỉnh/Thành phố');
            } else {
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            this.showToast('Lỗi tải tỉnh/thành', 'error');
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    async loadShippingDistricts(provinceId) {
        const districtSelect = document.getElementById('shippingDistrict');
        if (!districtSelect) return;
        if (!provinceId) {
            districtSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            districtSelect.disabled = true;
            return;
        }

        // Check cache first
        if (this.isCacheValid(`districts_${provinceId}`) && this.districtsCacheByProvince?.has(provinceId)) {
            const cachedDistricts = this.districtsCacheByProvince.get(provinceId);
            const opts = cachedDistricts.map(d => ({
                value: d.districtId ?? d.DistrictID ?? d.id ?? '',
                label: d.districtName ?? d.DistrictName ?? d.name ?? 'undefined'
            }));
            this.populateSelect(districtSelect, opts, 'Chọn Quận/Huyện');
            districtSelect.disabled = false;
            return;
        }

        try {
            districtSelect.disabled = true;
            districtSelect.innerHTML = '<option value="">Đang tải Quận/Huyện...</option>';

            const res = await fetch(`/api/ghn/districts/${provinceId}`);
            if (!res.ok) throw new Error('Không thể tải quận/huyện');
            const districts = await res.json();

            if (Array.isArray(districts) && districts.length > 0) {
                // Initialize cache if not exists
                if (!this.districtsCacheByProvince) {
                    this.districtsCacheByProvince = new Map();
                }

                // Save to cache
                this.districtsCacheByProvince.set(provinceId, districts);
                this.cacheTimestamp.set(`districts_${provinceId}`, Date.now());

                const opts = districts.map(d => ({
                    value: d.districtId ?? d.DistrictID ?? d.id ?? '',
                    label: d.districtName ?? d.DistrictName ?? d.name ?? 'undefined'
                }));
                this.populateSelect(districtSelect, opts, 'Chọn Quận/Huyện');
            } else {
                throw new Error('Dữ liệu quận/huyện không hợp lệ');
            }
            districtSelect.disabled = false;
        } catch (e) {
            this.showToast('Lỗi tải quận/huyện', 'error');
            districtSelect.innerHTML = '<option value="">Không có dữ liệu quận/huyện</option>';
            districtSelect.disabled = true;
        }
    }

    async loadShippingWards(districtId, selectedWard = null) {
        const wardSelect = document.getElementById('shippingWard');
        if (!wardSelect) return;
        if (!districtId) {
            wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>';
            wardSelect.disabled = true;
            return;
        }

        // Check cache first
        if (this.isCacheValid(`wards_${districtId}`) && this.wardsCacheByDistrict?.has(districtId)) {
            const cachedWards = this.wardsCacheByDistrict.get(districtId);
            const opts = cachedWards.map(w => ({
                value: w.wardCode ?? w.WardCode ?? '',
                label: w.wardName ?? w.WardName ?? 'undefined'
            }));
            this.populateSelect(wardSelect, opts, 'Chọn Phường/Xã');

            if (selectedWard) {
                wardSelect.value = selectedWard;
            }
            wardSelect.disabled = false;
            return;
        }

        try {
            wardSelect.disabled = true;
            wardSelect.innerHTML = '<option value="">Đang tải Phường/Xã...</option>';

            const res = await fetch(`/api/ghn/wards/${districtId}`);
            if (!res.ok) throw new Error('Không thể tải phường/xã');
            const wards = await res.json();

            if (Array.isArray(wards) && wards.length > 0) {
                // Initialize cache if not exists
                if (!this.wardsCacheByDistrict) {
                    this.wardsCacheByDistrict = new Map();
                }

                // Save to cache
                this.wardsCacheByDistrict.set(districtId, wards);
                this.cacheTimestamp.set(`wards_${districtId}`, Date.now());

                const opts = wards.map(w => ({
                    value: w.wardCode ?? w.WardCode ?? '',
                    label: w.wardName ?? w.WardName ?? 'undefined'
                }));
                this.populateSelect(wardSelect, opts, 'Chọn Phường/Xã');

                if (selectedWard) {
                    wardSelect.value = selectedWard;
                }
            } else {
                throw new Error('Dữ liệu phường/xã không hợp lệ');
            }
            wardSelect.disabled = false;
        } catch (e) {
            this.showToast('Lỗi tải phường/xã', 'error');
            wardSelect.innerHTML = '<option value="">Không có dữ liệu phường/xã</option>';
            wardSelect.disabled = true;
        }
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

    updateSelectedAddress() {
        // Update shipping fee based on selected address
        this.updateShippingFee();
    }

    async addNewAddress() {
        // Show add address modal
        this.showAddAddressModal();
    }

    async editAddress(id) {
        if (!id) return;

        try {
            const address = await this.apiCall(`/addresses/${this.currentUser.userId}/${id}`, 'GET');
            this.currentEditingAddressId = id;
            this.showEditAddressModal(address);
        } catch (error) {
            this.showToast('Lỗi tải địa chỉ', 'error');
            this.showToast('Không thể tải thông tin địa chỉ', 'error');
        }
    }

    async deleteAddress(id) {
        if (!id) return;
        if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

        try {
            await this.apiCall(`/addresses/${this.currentUser.userId}/${id}`, 'DELETE');
            this.showToast('Đã xóa địa chỉ', 'success');

            // Reload addresses and update form
            await this.loadAddresses();

            // Close any open modals
            this.closeAddressSelector();
            this.closeAddAddressModal();
            this.closeEditAddressModal();
        } catch (error) {
            this.showToast('Lỗi xóa địa chỉ', 'error');
            this.showToast('Không thể xóa địa chỉ', 'error');
        }
    }

    showAddAddressModal() {
        // Create and show add address modal
        const modalHTML = `
            <div class="modal fade show" id="addAddressModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Thêm địa chỉ mới</h5>
                            <button type="button" class="btn-close" onclick="checkoutPage.closeAddAddressModal()"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addAddressForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="addrName" class="form-label">Họ và tên *</label>
                                        <input type="text" class="form-control" id="addrName" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="addrPhone" class="form-label">Số điện thoại *</label>
                                        <input type="tel" class="form-control" id="addrPhone" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="addrDetail" class="form-label">Địa chỉ chi tiết *</label>
                                    <textarea class="form-control" id="addrDetail" rows="2" required></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label for="addrProvince" class="form-label">Tỉnh/Thành phố *</label>
                                        <select class="form-control" id="addrProvince" required>
                                            <option value="">Chọn Tỉnh/Thành phố</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="addrDistrict" class="form-label">Quận/Huyện *</label>
                                        <select class="form-control" id="addrDistrict" required disabled>
                                            <option value="">Chọn Quận/Huyện</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="addrWard" class="form-label">Phường/Xã *</label>
                                        <select class="form-control" id="addrWard" required disabled>
                                            <option value="">Chọn Quận/Huyện trước</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="addrDefault">
                                    <label class="form-check-label" for="addrDefault">
                                        Đặt làm địa chỉ mặc định
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="checkoutPage.closeAddAddressModal()">Hủy</button>
                            <button type="button" class="btn btn-primary" id="btnSubmitAddAddress" onclick="checkoutPage.submitAddAddress()">
                                <i class="fas fa-save"></i> Lưu địa chỉ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHTML);
        this.loadProvinces();
    }

    showEditAddressModal(address) {
        // Create and show edit address modal
        const modalHTML = `
            <div class="modal fade show" id="editAddressModal" tabindex="-1" style="display: block; background: rgba(0,0,0,0.5);">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Sửa địa chỉ</h5>
                            <button type="button" class="btn-close" onclick="checkoutPage.closeEditAddressModal()"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editAddressForm">
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="editAddrName" class="form-label">Họ và tên *</label>
                                        <input type="text" class="form-control" id="editAddrName" value="${this.escapeHtml(address.name || '')}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="editAddrPhone" class="form-label">Số điện thoại *</label>
                                        <input type="tel" class="form-control" id="editAddrPhone" value="${this.escapeHtml(address.phone || '')}" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="editAddrDetail" class="form-label">Địa chỉ chi tiết *</label>
                                    <textarea class="form-control" id="editAddrDetail" rows="2" required>${this.escapeHtml(address.addressDetail || '')}</textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-4 mb-3">
                                        <label for="editAddrProvince" class="form-label">Tỉnh/Thành phố *</label>
                                        <select class="form-control" id="editAddrProvince" required>
                                            <option value="">Chọn Tỉnh/Thành phố</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="editAddrDistrict" class="form-label">Quận/Huyện *</label>
                                        <select class="form-control" id="editAddrDistrict" required disabled>
                                            <option value="">Chọn Quận/Huyện</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4 mb-3">
                                        <label for="editAddrWard" class="form-label">Phường/Xã *</label>
                                        <select class="form-control" id="editAddrWard" required disabled>
                                            <option value="">Chọn Quận/Huyện trước</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="editAddrDefault" ${address.isDefault ? 'checked' : ''}>
                                    <label class="form-check-label" for="editAddrDefault">
                                        Đặt làm địa chỉ mặc định
                                    </label>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="checkoutPage.closeEditAddressModal()">Hủy</button>
                            <button type="button" class="btn btn-primary" id="btnSubmitEditAddress" onclick="checkoutPage.submitEditAddress()">
                                <i class="fas fa-save"></i> Cập nhật địa chỉ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHTML);
        this.loadEditProvinces(address.provinceId, address.districtId, address.wardCode);
    }

    closeAddAddressModal() {
        $('#addAddressModal').remove();
    }

    closeEditAddressModal() {
        $('#editAddressModal').remove();
        this.currentEditingAddressId = null;
    }

    // Province and Ward loading methods (from info.js)
    async loadProvinces() {
        const provinceSelect = document.getElementById('addrProvince');
        if (!provinceSelect) return;

        // Check cache first
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                'Chọn Tỉnh/Thành phố'
            );
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`/api/ghn/provinces`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            if (Array.isArray(provinces) && provinces.length > 0) {
                // Save to cache
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                this.populateSelect(
                    provinceSelect,
                    provinces.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                    'Chọn Tỉnh/Thành phố'
                );
            } else {
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            this.showToast('Lỗi tải tỉnh/thành', 'error');
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    async loadEditProvinces(selectedProvinceId = null, selectedDistrictId = null, selectedWardCode = null) {
        const provinceSelect = document.getElementById('editAddrProvince');
        if (!provinceSelect) return;

        // Check cache first
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                'Chọn Tỉnh/Thành phố'
            );

            if (selectedProvinceId) {
                provinceSelect.value = selectedProvinceId;
                if (selectedDistrictId) {
                    if (typeof this.loadEditDistricts === 'function') {
                        await this.loadEditDistricts(selectedProvinceId, selectedDistrictId, selectedWardCode);
                    } else {
                        // Fallback: load wards directly by district when method is missing
                        await this.loadEditWards(selectedDistrictId, selectedWardCode);
                    }
                }
            }
            return;
        }

        provinceSelect.innerHTML = '<option value="">Đang tải tỉnh/thành...</option>';

        try {
            const res = await fetch(`/api/ghn/provinces`);
            if (!res.ok) throw new Error('Không thể tải tỉnh/thành');
            const provinces = await res.json();

            if (Array.isArray(provinces) && provinces.length > 0) {
                this.provincesCache = provinces;
                this.cacheTimestamp.set('provinces', Date.now());

                this.populateSelect(
                    provinceSelect,
                    provinces.map(p => ({ value: (p.ProvinceID || p.provinceId || p.code), label: (p.ProvinceName || p.name) })),
                    'Chọn Tỉnh/Thành phố'
                );

                if (selectedProvinceId) {
                    provinceSelect.value = selectedProvinceId;
                    if (selectedDistrictId) {
                        if (typeof this.loadEditDistricts === 'function') {
                            await this.loadEditDistricts(selectedProvinceId, selectedDistrictId, selectedWardCode);
                        } else {
                            await this.loadEditWards(selectedDistrictId, selectedWardCode);
                        }
                    }
                }
            } else {
                throw new Error('Dữ liệu tỉnh/thành không hợp lệ');
            }
        } catch (e) {
            this.showToast('Lỗi tải tỉnh/thành', 'error');
            provinceSelect.innerHTML = '<option value="">Không có dữ liệu tỉnh/thành</option>';
        }
    }

    async loadEditDistricts(provinceId, selectedDistrictId = null, selectedWardCode = null) {
        const districtSelect = document.getElementById('editAddrDistrict');
        const wardSelect = document.getElementById('editAddrWard');
        if (!districtSelect) return;
        if (!provinceId) {
            districtSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
            districtSelect.disabled = true;
            if (wardSelect) { wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>'; wardSelect.disabled = true; }
            return;
        }

        try {
            districtSelect.disabled = true;
            districtSelect.innerHTML = '<option value="">Đang tải Quận/Huyện...</option>';
            const res = await fetch(`/api/ghn/districts/${provinceId}`);
            if (!res.ok) throw new Error('Không thể tải quận/huyện');
            const districts = await res.json();
            this.populateSelect(districtSelect, districts.map(d => ({ value: (d.DistrictID || d.districtId), label: (d.DistrictName || d.name) })), 'Chọn Quận/Huyện');
            districtSelect.disabled = false;

            if (selectedDistrictId) {
                districtSelect.value = selectedDistrictId;
                await this.loadEditWards(selectedDistrictId, selectedWardCode);
            } else if (wardSelect) {
                wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>';
                wardSelect.disabled = true;
            }
        } catch (e) {
            this.showToast('Lỗi tải quận/huyện', 'error');
            districtSelect.innerHTML = '<option value="">Không có dữ liệu quận/huyện</option>';
            districtSelect.disabled = true;
        }
    }

    async loadEditWards(districtId, selectedWardCode = null) {
        const wardSelect = document.getElementById('editAddrWard');
        if (!wardSelect) return;
        if (!districtId) {
            wardSelect.innerHTML = '<option value="">Chọn Quận/Huyện trước</option>';
            wardSelect.disabled = true;
            return;
        }

        try {
            wardSelect.disabled = true;
            wardSelect.innerHTML = '<option value="">Đang tải Phường/Xã...</option>';

            const res = await fetch(`/api/ghn/wards/${districtId}`);
            if (!res.ok) throw new Error('Không thể tải phường/xã');
            const wards = await res.json();

            if (Array.isArray(wards) && wards.length > 0) {
                this.populateSelect(wardSelect, wards.map(w => ({ value: (w.WardCode || w.wardCode), label: (w.WardName || w.name) })), 'Chọn Phường/Xã');
                if (selectedWardCode) {
                    wardSelect.value = selectedWardCode;
                }
            } else {
                throw new Error('Dữ liệu phường/xã không hợp lệ');
            }
            wardSelect.disabled = false;
        } catch (e) {
            this.showToast('Lỗi tải phường/xã', 'error');
            wardSelect.innerHTML = '<option value="">Không có dữ liệu phường/xã</option>';
            wardSelect.disabled = true;
        }
    }

    async loadDistricts(provinceId) {
        const wardSelect = document.getElementById('addrWard');
        const districtSelect = document.getElementById('addrDistrict');
        if (!districtSelect) return;
        if (!provinceId) {
            districtSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
            districtSelect.disabled = true;
            return;
        }
        try {
            districtSelect.disabled = true;
            districtSelect.innerHTML = '<option value="">Đang tải Quận/Huyện...</option>';
            const res = await fetch(`/api/ghn/districts/${provinceId}`);
            if (!res.ok) throw new Error('Không thể tải quận/huyện');
            const districts = await res.json();
            this.populateSelect(districtSelect, districts.map(d => ({ value: (d.DistrictID || d.districtId), label: (d.DistrictName || d.name) })), 'Chọn Quận/Huyện');
            districtSelect.disabled = false;
        } catch (e) {
            this.showToast('Lỗi tải quận/huyện', 'error');
            districtSelect.innerHTML = '<option value="">Không có dữ liệu quận/huyện</option>';
            districtSelect.disabled = true;
        }
    }

    populateSelect(selectEl, options, placeholder) {
        const opts = [`<option value="">${this.escapeHtml(placeholder || 'Chọn')}</option>`]
            .concat(options.map(o => `<option value="${this.escapeHtml(o.value)}">${this.escapeHtml(o.label)}</option>`));
        selectEl.innerHTML = opts.join('');
    }

    isCacheValid(key) {
        const timestamp = this.cacheTimestamp.get(key);
        if (!timestamp) return false;
        return (Date.now() - timestamp) < this.cacheExpiry;
    }

    async submitAddAddress() {
        const submitBtn = document.getElementById('btnSubmitAddAddress');
        if (submitBtn.disabled) return;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

            const name = document.getElementById('addrName')?.value?.trim();
            const phone = document.getElementById('addrPhone')?.value?.trim();
            const addressDetail = document.getElementById('addrDetail')?.value?.trim();
            const provinceId = parseInt(document.getElementById('addrProvince')?.value, 10);
            const districtId = parseInt(document.getElementById('addrDistrict')?.value, 10);
            const wardCode = document.getElementById('addrWard')?.value;
            const isDefault = document.getElementById('addrDefault')?.checked || false;

            if (!name || !phone || !addressDetail || !provinceId || !districtId || !wardCode) {
                this.showToast('Vui lòng điền đầy đủ thông tin địa chỉ', 'error');
                return;
            }

            // Province text for storage
            const payload = {
                name,
                phone,
                addressDetail,
                provinceId,
                districtId,
                wardCode,
                isDefault
            };

            await this.apiCall(`/addresses/${this.currentUser.userId}`, 'POST', payload);
            this.showToast('Đã lưu địa chỉ thành công', 'success');
            this.closeAddAddressModal();
            await this.loadAddresses();

            // If this is the first address or it's set as default, fill it to form
            if (isDefault || this.addresses.length === 1) {
                const newAddress = this.addresses.find(addr => addr.isDefault) || this.addresses[0];
                if (newAddress) {
                    this.selectedAddressId = newAddress.idAddress;
                    await this.fillAddressToForm(newAddress);
                }
            }
        } catch (e) {
            console.error(e);
            this.showToast('Không thể lưu địa chỉ', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Lưu địa chỉ';
        }
    }

    async submitEditAddress() {
        const submitBtn = document.getElementById('btnSubmitEditAddress');
        if (submitBtn.disabled) return;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật...';

            const provinceId = parseInt(document.getElementById('editAddrProvince').value, 10);
            const districtId = parseInt(document.getElementById('editAddrDistrict').value, 10);
            const wardCode = document.getElementById('editAddrWard').value.trim();

            // Validation
            if (!document.getElementById('editAddrName').value.trim() ||
                !document.getElementById('editAddrPhone').value.trim() ||
                !document.getElementById('editAddrDetail').value.trim() ||
                !provinceId || !districtId || !wardCode) {
                this.showToast('Vui lòng điền đầy đủ thông tin', 'error');
                return;
            }

            const addressData = {
                name: document.getElementById('editAddrName').value.trim(),
                phone: document.getElementById('editAddrPhone').value.trim(),
                addressDetail: document.getElementById('editAddrDetail').value.trim(),
                provinceId,
                districtId,
                wardCode,
                isDefault: document.getElementById('editAddrDefault').checked
            };

            const currentAddressId = this.currentEditingAddressId;
            if (!currentAddressId) {
                this.showToast('Không tìm thấy ID địa chỉ', 'error');
                return;
            }

            await this.apiCall(`/addresses/${this.currentUser.userId}/${currentAddressId}`, 'PUT', addressData);
            this.showToast('Cập nhật địa chỉ thành công', 'success');
            this.closeEditAddressModal();
            await this.loadAddresses();

            // If this was the selected address, update the form
            if (this.selectedAddressId === currentAddressId) {
                const updatedAddress = this.addresses.find(addr => addr.idAddress === currentAddressId);
                if (updatedAddress) {
                    await this.fillAddressToForm(updatedAddress);
                }
            }
        } catch (e) {
            console.error('Lỗi cập nhật địa chỉ:', e);
            this.showToast('Không thể cập nhật địa chỉ', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Cập nhật địa chỉ';
        }
    }

    renderUserInfo(user) {
        const accountBox = $('.account-box');
        const fullName = user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : (user.firstname || user.lastname || '');
        const avatar = fullName ? fullName.charAt(0).toUpperCase() : (user.username ? user.username.charAt(0).toUpperCase() : 'U');
        const displayName = fullName || user.username || 'Người dùng';
        const email = user.email || 'Chưa cập nhật email';

        accountBox.html(`
            <div class="account-info">
                <div class="account-avatar">${avatar}</div>
                <div class="account-name-email">
                    <div>${displayName}</div>
                    <div>${email}</div>
                </div>
            </div>
        `);
    }

    renderLoginPrompt() {
        const accountBox = $('.account-box');
        accountBox.html(`
                <div class="account-info text-center">
                    <div class="account-avatar mb-2">
                        <i class="fas fa-user-circle fa-2x text-muted"></i>
                    </div>
                    <div class="account-name-email">
                        <div class="text-muted mb-2">
                            Đăng nhập để mua hàng tiện lợi và nhận nhiều ưu đãi hơn nữa
                        </div>
                    </div>
                </div>
            `);
    }

    renderSelectedItems() {
        const container = $('#selected-items-container');
        if (!container.length) {
            console.error('Selected items container not found');
            return;
        }

        if (this.selectedItems.length === 0) {
            container.html(`
                <div class="text-center py-3">
                    <i class="fas fa-shopping-cart fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-2 small">Bạn chưa chọn sản phẩm nào</p>
                    <a href="/cart" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-arrow-left me-1"></i>
                        Quay lại giỏ hàng
                    </a>
                </div>
            `);
            this.disableCheckoutButton();
            return;
        }

        const itemsHTML = this.selectedItems.map(item => this.createSelectedItemHTML(item)).join('');
        container.html(itemsHTML);
        this.enableCheckoutButton();
    }

    createSelectedItemHTML(item) {
        const productStatus = this.getProductStatus(item);
        const isDisabled = productStatus !== 'available';

        return `
            <div class="cart-item ${isDisabled ? 'disabled' : ''}" data-cart-product-id="${item.idCartProduct}" data-unit-price="${item.productPrice || 0}">
                <div class="cart-item-image">
                    <img src="${item.mainImageUrl || '/uploads/products/placeholder.jpg'}" alt="${item.productName}">
                </div>
                <div class="cart-item-details">
                    <div class="item-header">
                        <span class="item-title">${item.productName}</span>
                        <button class="btn-delete" title="Xóa sản phẩm">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    ${this.getProductStatusTag(productStatus)}
                    <div class="item-footer">
                        <span class="item-price">${this.formatCurrency(item.totalPrice)}</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" ${isDisabled ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${Math.min(item.stock || 99, 99)}" ${isDisabled ? 'disabled' : ''}>
                            <button class="quantity-btn" data-action="increase" ${isDisabled ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(item) {
        // Kiểm tra trạng thái sản phẩm - ngừng kinh doanh trước
        if (!item.available || !item.isActive) {
            return 'deactivated';
        }
        if (item.stock <= 0) {
            return 'out_of_stock';
        }
        return 'available';
    }

    getProductStatusTag(status) {
        switch (status) {
            case 'deactivated':
                return '<span class="product-status-tag status-deactivated">Ngừng kinh doanh</span>';
            case 'out_of_stock':
                return '<span class="product-status-tag status-out-of-stock">Hết hàng</span>';
            default:
                return '';
        }
    }

    updateOrderSummary() {
        const subtotal = this.selectedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);

        // ✅ SỬA: Xử lý discount đúng cách
        const discountAmount = this.appliedDiscount ? this.appliedDiscount.discountAmount : 0;
        const total = subtotal + this.shippingFee - discountAmount;

        $('#summary-subtotal').text(this.formatCurrency(subtotal));
        $('#summary-shipping').text(this.shippingFee === 0 ? 'Miễn phí' : this.formatCurrency(this.shippingFee));
        $('#summary-total').text(this.formatCurrency(total));

        // Luôn hiển thị dòng giảm giá
        if (!$('#discount-row').length) {
            // Thêm dòng giảm giá vào summary (luôn hiển thị)
            $('#summary-shipping').parent().after(`
                <div class="summary-row" id="discount-row">
                    <span>Giảm giá:</span>
                    <span class="fw-medium text-success">-${this.formatCurrency(discountAmount)}</span>
                </div>
            `);
        } else {
            // Cập nhật số tiền giảm giá
            $('#discount-row .fw-medium').text(`-${this.formatCurrency(discountAmount)}`);
        }
    }

    async updateShippingFee() {
        const selectedAddress = $('input[name="shippingAddress"]:checked').val();

        try {
            // Lấy dữ liệu từ form trước (hỗ trợ guest)
            let districtId = $('#shippingDistrict').val();
            let wardCode = $('#shippingWard').val();

            // Nếu không có dữ liệu form và có địa chỉ được chọn (user login)
            if ((!districtId || !wardCode) && selectedAddress && selectedAddress !== 'new') {
                const address = this.addresses.find(addr => addr.idAddress == selectedAddress);
                if (address) {
                    districtId = address.districtId || districtId;
                    wardCode = address.wardCode || wardCode;
                }
            }

            if (!districtId || !wardCode) {
                this.shippingFee = 0;
                this.updateOrderSummary();
                return;
            }

            // Calculate shipping fee using GHN API
            const params = new URLSearchParams({
                toDistrictId: districtId,
                toWardCode: wardCode,
                weight: 1000,
                length: 15,
                width: 15,
                height: 15
            });

            const response = await fetch(`${this.ghnBase}/shipping/calculate-fee-simple?${params}`);
            if (response.ok) {
                const fee = await response.json();
                this.shippingFee = fee || 0;
            } else {
                this.shippingFee = 0;
            }
        } catch (error) {
            console.error('Error calculating shipping fee:', error);
            this.shippingFee = 0;
        }

        this.updateOrderSummary();
    }

    handlePaymentMethodSelect(e) {
        const paymentRow = $(e.currentTarget);
        const radioInput = paymentRow.find('input[type="radio"]');

        // Remove active class from all payment options
        $('.payment-option-row').removeClass('active');

        // Add active class to selected option
        paymentRow.addClass('active');

        // Check the radio input
        radioInput.prop('checked', true);
    }

    async handleApplyPromo() {
        const promoCode = $('#promoCode').val().trim();

        if (!promoCode) {
            this.showToast('Vui lòng nhập mã giảm giá', 'warning');
            return;
        }

        try {
            this.showLoading(true);

            const response = await this.apiCall('/discounts/apply', 'POST', {
                discountCode: promoCode,
                orderTotal: this.calculateSubtotalForDiscount()  // ✅ Chỉ gửi subtotal
            });

            // Xử lý response đúng cách
            if (response.result) {
                this.appliedDiscount = response.result;
                this.updateOrderSummary();

                this.showToast('Áp dụng mã giảm giá thành công!', 'success');
                $('#promoCode').val('').attr('placeholder', `${promoCode}`).prop('disabled', true);
                $('#applyPromoBtn').text('Gỡ mã').removeClass('btn-primary').addClass('btn-outline-danger');
            }

        } catch (error) {
            // Hiển thị thông báo lỗi chi tiết
            let errorMessage = 'Mã giảm giá không hợp lệ';

            try {
                const errorData = JSON.parse(error.message);
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // Nếu không parse được JSON, dùng message gốc
                if (error.message) {
                    errorMessage = error.message;
                }
            }

            this.showToast(errorMessage, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Tạo function riêng để tính subtotal cho API
    calculateSubtotalForDiscount() {
        return this.selectedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    }

    handleRemovePromo() {
        this.appliedDiscount = null;
        this.updateOrderSummary();
        this.showToast('Đã gỡ mã giảm giá', 'info');

        // ✅ SỬA: Reset UI về trạng thái ban đầu
        $('#promoCode').val('').attr('placeholder', 'Nhập mã giảm giá').prop('disabled', false);
        $('#applyPromoBtn').text('Áp dụng').removeClass('btn-outline-danger').addClass('btn-primary');
    }

    async handlePlaceOrder() {
        if (this.selectedItems.length === 0) {
            this.showToast('Không có sản phẩm nào để đặt hàng', 'warning');
            return;
        }

        // Validate all products before checkout
        if (!this.validateAllProducts()) {
            return;
        }

        // Validate form
        if (!this.validateCheckoutForm()) {
            return;
        }

        try {
            this.showLoading(true);

            // lấy đầy đủ thông tin
            const orderData = this.collectOrderData();

            // Kiểm tra nếu orderData null (validation failed)
            if (!orderData) {
                this.showLoading(false);
                return;
            }

            console.log('Order data with discount:', orderData);

            const response = await this.apiCall(`/order/${this.cartId}`, 'POST', orderData);

            // Nếu phương thức là VNPAY thì gọi tạo URL thanh toán và redirect
            if (orderData.paymentMethod && orderData.paymentMethod.toUpperCase() === 'VNPAY') {
                try {
                    const payResp = await this.apiCall(`/payment/vnpay/create/${response.idOrder}`, 'POST');
                    if (payResp && payResp.paymentUrl) {
                        window.location.href = payResp.paymentUrl;
                        return; // dừng lại, sẽ rời trang
                    }
                } catch (e) {
                    console.error('Create VNPAY URL failed:', e);
                    this.showToast('Không tạo được liên kết thanh toán VNPAY, vui lòng thử lại', 'error');
                }
            }

            // Nếu không phải VNPAY hoặc VNPAY thất bại, chuyển đến trang thành công
            this.showToast('Đặt hàng thành công!', 'success');
            setTimeout(() => {
                window.location.href = `/order/${response.idOrder}`;
            }, 1500);

        } catch (error) {
            console.error('Error placing order:', error);
            this.showToast('Không thể đặt hàng. Vui lòng thử lại!', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateAllProducts() {
        // Kiểm tra tất cả sản phẩm đã chọn
        for (const item of this.selectedItems) {
            const status = this.getProductStatus(item);

            // Nếu sản phẩm không hợp lệ (hết hàng hoặc ngừng kinh doanh)
            if (status !== 'available') {
                this.showToast('Đơn hàng có sản phẩm không hợp lệ', 'error');
                return false;
            }

            // Kiểm tra số lượng có vượt quá tồn kho không
            if (item.quantity > item.stock) {
                this.showToast('Đơn hàng có sản phẩm không hợp lệ', 'error');
                return false;
            }
        }

        return true;
    }

    validateCheckoutForm() {
        // Kiểm tra thông tin giao hàng
        const fullName = $('#shippingFullName').val().trim();
        const phone = $('#shippingPhone').val().trim();
        const email = $('#shippingGmail').val().trim();
        const province = $('#shippingProvince').val();
        const ward = $('#shippingWard').val();
        const addressDetail = $('#shippingAddressDetail').val().trim();

        if (!fullName) {
            this.showToast('Vui lòng nhập họ và tên', 'warning');
            return false;
        }

        if (!phone) {
            this.showToast('Vui lòng nhập số điện thoại', 'warning');
            return false;
        }

        if (!email) {
            this.showToast('Vui lòng nhập email', 'warning');
            return false;
        }

        if (!province) {
            this.showToast('Vui lòng chọn tỉnh/thành phố', 'warning');
            return false;
        }

        if (!ward) {
            this.showToast('Vui lòng chọn phường/xã', 'warning');
            return false;
        }

        if (!addressDetail) {
            this.showToast('Vui lòng nhập địa chỉ chi tiết', 'warning');
            return false;
        }

        // Kiểm tra phương thức thanh toán (đã có mặc định)
        const paymentMethod = $('input[name="paymentMethod"]:checked').val();
        if (!paymentMethod) {
            this.showToast('Vui lòng chọn phương thức thanh toán', 'warning');
            return false;
        }

        return true;
    }

    collectOrderData() {
        // Thu thập thông tin giao hàng
        const fullName = $('#shippingFullName').val().trim();
        const phone = $('#shippingPhone').val().trim();
        const email = $('#shippingGmail').val().trim();
        const province = $('#shippingProvince').val();
        const provinceNameText = $('#shippingProvince option:selected').text();
        const districtName = $('#shippingDistrict option:selected').text();
        const districtIdRaw = $('#shippingDistrict').val();
        const wardCode = $('#shippingWard').val();
        const wardName = $('#shippingWard option:selected').text();
        const addressDetail = $('#shippingAddressDetail').val().trim();

        // Ghép địa chỉ chi tiết
        const fullAddress = `${addressDetail}, ${wardName || wardCode || ''}, ${districtName || ''}, ${provinceNameText || province || ''}`;

        const paymentMethod = $('input[name="paymentMethod"]:checked').val();
        const notes = $('#orderNotes').val() || 'Không có ghi chú';

        // Order data validation

        // Validation: Kiểm tra các field required
        if (!fullName || fullName.trim() === '') {
            this.showToast('Vui lòng nhập họ và tên', 'warning');
            return null;
        }
        if (!phone || phone.trim() === '') {
            this.showToast('Vui lòng nhập số điện thoại', 'warning');
            return null;
        }
        if (!fullAddress || fullAddress.trim() === '') {
            this.showToast('Vui lòng nhập địa chỉ', 'warning');
            return null;
        }
        if (!paymentMethod) {
            this.showToast('Vui lòng chọn phương thức thanh toán', 'warning');
            return null;
        }
        // Ghi chú có thể null, không cần validation

        // Chuẩn hoá dữ liệu địa chỉ cần cho BE tính phí GHN
        let districtId = districtIdRaw ? parseInt(districtIdRaw, 10) : null;
        let provinceId = province ? parseInt(province, 10) : null;

        const orderData = {
            // Thông tin giao hàng
            name: fullName,
            phone: phone,
            email: email || '', // Đảm bảo email không null
            addressDetail: fullAddress,

            // Thông tin đơn hàng
            paymentMethod: paymentMethod,
            note: notes,
            discountId: null, // Field này có thể null
            //  Mã giảm giá
            discountCode: this.appliedDiscount ? this.appliedDiscount.discountCode : null,

            // Thông tin GHN để BE tính phí và lưu vào order.shippingFee
            districtId: Number.isFinite(districtId) ? districtId : null,
            wardCode: wardCode || null,
            provinceId: Number.isFinite(provinceId) ? provinceId : null,

            // Thông tin giỏ hàng
            cartId: this.cartId
        };

        return orderData;
    }

    calculateOrderTotal() {
        const subtotal = this.selectedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        return subtotal + this.shippingFee - this.discount;
    }

    // ========== CART ITEM HANDLERS ==========

    async handleQuantityChange(e) {
        const button = $(e.target).closest('.quantity-btn');
        const action = button.data('action');
        const input = button.siblings('.quantity-input');
        const cartItem = button.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');

        let newQuantity = parseInt(input.val()) || 1;
        const maxStock = parseInt(input.attr('max')) || 99; // Đã được tính min với 99

        if (action === 'increase') {
            if (newQuantity < maxStock) {
                newQuantity = newQuantity + 1;
            } else {
                newQuantity = maxStock;
                this.showToast(`Bạn chỉ được phép mua tối đa ${maxStock} sản phẩm`, 'warning');
            }
        } else if (action === 'decrease') {
            if (newQuantity > 1) {
                newQuantity = newQuantity - 1;
            } else {
                this.showToast(`Số lượng tối thiểu là 1 sản phẩm`, 'warning');
            }
        }

        input.val(newQuantity);
        await this.updateCartProductQuantity(cartProductId, newQuantity);
    }

    async handleQuantityInputChange(e) {
        const input = $(e.target);
        const cartItem = input.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        const maxStock = parseInt(input.attr('max')) || 99; // Đã được tính min với 99
        let newQuantity = parseInt(input.val()) || 1;

        console.log('Checkout input validation:', { newQuantity, maxStock, inputVal: input.val(), cartProductId });

        // Force validation ngay lập tức
        if (newQuantity < 1) {
            newQuantity = 1;
            input.val(newQuantity);
            this.showToast(`Số lượng tối thiểu là 1 sản phẩm`, 'warning');
            console.log('Set to minimum: 1');
            await this.updateCartProductQuantity(cartProductId, newQuantity);
        } else if (newQuantity > maxStock) {
            // Tự động cập nhật về max stock
            newQuantity = maxStock;
            input.val(newQuantity);
            this.showToast(`Bạn chỉ được phép mua tối đa ${maxStock} sản phẩm`, 'warning');
            console.log('Set to maximum:', maxStock);
            await this.updateCartProductQuantity(cartProductId, newQuantity);
        }
    }

    async handleRemoveItem(e) {
        const cartItem = $(e.target).closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        const productName = cartItem.find('.item-title').text();

        this.showConfirmDialog(
            'Bỏ chọn sản phẩm',
            `Bạn có chắc chắn muốn bỏ chọn "${productName}"?`,
            async () => {
                await this.removeCartProduct(cartProductId, cartItem);
            }
        );
    }

    async updateCartProductQuantity(cartProductId, quantity) {
        try {
            const response = await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'PUT',
                { quantity: quantity, choose: true }
            );

            // Cập nhật dữ liệu local
            const cartItem = this.selectedItems.find(item => item.idCartProduct === cartProductId);
            if (cartItem) {
                cartItem.quantity = quantity;
                cartItem.totalPrice = response.totalPrice || (cartItem.productPrice * quantity);
            }

            // Cập nhật giá trong DOM
            const cartItemElement = $(`.cart-item[data-cart-product-id="${cartProductId}"]`);
            const priceElement = cartItemElement.find('.item-price');
            priceElement.text(this.formatCurrency(response.totalPrice));

            this.updateOrderSummary();

        } catch (error) {
            console.error('Error updating cart product quantity:', error);
            this.showToast('Không thể cập nhật số lượng sản phẩm', 'error');
        }
    }

    async removeCartProduct(cartProductId, cartItemElement) {
        try {
            // Lấy quantity hiện tại từ DOM
            const cartItem = $(`.cart-item[data-cart-product-id="${cartProductId}"]`);
            const currentQuantity = parseInt(cartItem.find('.quantity-input').val()) || 1;

            // Set choose = false thay vì xóa
            await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'PUT',
                {
                    choose: false,
                    quantity: currentQuantity
                }
            );

            // Xóa khỏi dữ liệu local
            this.selectedItems = this.selectedItems.filter(item => item.idCartProduct !== cartProductId);

            // Animation xóa
            this.removeItemWithAnimation(cartItemElement);

            // Cập nhật UI ngay lập tức
            this.renderSelectedItems();
            this.updateOrderSummary();

        } catch (error) {
            console.error('Error removing cart product:', error);
            this.showToast('Không thể bỏ chọn sản phẩm', 'error');
        }
    }

    removeItemWithAnimation(cartItem) {
        cartItem.addClass('removing');
        setTimeout(() => {
            cartItem.fadeOut(300, () => {
                cartItem.remove();
            });
        }, 100);
    }

    showConfirmDialog(title, message, onConfirm) {
        if (confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
    }

    enableCheckoutButton() {
        const checkoutBtn = $('button[type="submit"][form="checkoutForm"]');
        checkoutBtn.prop('disabled', false).css({
            'background-color': '',
            'border-color': '',
            'color': '',
            'opacity': '',
            'cursor': ''
        });
    }

    disableCheckoutButton() {
        const checkoutBtn = $('button[type="submit"][form="checkoutForm"]');
        checkoutBtn.prop('disabled', true).css({
            'background-color': '#6c757d',
            'border-color': '#6c757d',
            'color': '#fff',
            'opacity': '0.65',
            'cursor': 'not-allowed'
        });
    }

    showEmptyCheckout() {
        const container = $('.checkout-main');
        container.html(`
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-6 text-center py-5">
                        <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                        <h4 class="text-muted">Giỏ hàng trống</h4>
                        <p class="text-muted">Bạn chưa có sản phẩm nào để thanh toán</p>
                        <a href="/cart" class="btn btn-primary">Quay lại giỏ hàng</a>
                    </div>
                </div>
            </div>
        `);
    }

    showLoading(show) {
        if (show) {
            $('body').append('<div id="loadingOverlay" class="loading-overlay"><div class="spinner-border text-primary" role="status"></div></div>');
        } else {
            $('#loadingOverlay').remove();
        }
    }

    showToast(message, type = 'info') {
        // Simple toast implementation
        const toastClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const toast = $(`
            <div class="alert ${toastClass} alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

        $('body').append(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.alert('close');
        }, 5000);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // ========== API HELPER METHODS ==========

    async apiCall(url, method = 'GET', data = null) {
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        // Thêm Authorization header nếu có token
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Với DELETE request, response có thể là empty body
        if (method === 'DELETE') {
            return { success: true };
        }

        return await response.json();
    }

    navigateToCart(event) {
        event.preventDefault();

        // Show loading overlay
        this.showLoading(true);

        // Add smooth transition effect
        $('body').addClass('page-transition');

        // Navigate after a short delay for smooth effect
        setTimeout(() => {
            window.location.href = '/cart';
        }, 300);

        return false;
    }
}

// Initialize checkout page when DOM is ready
$(document).ready(() => {
    window.checkoutPage = new CheckoutPage();
});
