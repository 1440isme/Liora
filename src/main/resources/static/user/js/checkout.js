class CheckoutPage {
    constructor() {
        this.cartId = null;
        this.selectedItems = [];
        this.shippingFee = 0;
        this.discount = 0;
        this.currentUser = null;
        this.addresses = [];
        this.selectedAddressId = null;
        this.waveBearBase = '/api/location';
        this.provincesCache = null;
        this.wardsCacheByProvince = new Map();
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


        // Province change -> load wards for add address
        $(document).on('change', '#addrProvince', (e) => {
            const provinceCode = e.target.value;
            this.loadWards(provinceCode);
        });

        // Province change -> load wards for edit address
        $(document).on('change', '#editAddrProvince', (e) => {
            const provinceCode = e.target.value;
            this.loadEditWards(provinceCode);
        });

        // Province change -> load wards for shipping form
        $(document).on('change', '#shippingProvince', (e) => {
            const provinceCode = e.target.value;
            this.loadShippingWards(provinceCode);
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

        // Delete item
        $(document).on('click', '.btn-delete', (e) => {
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
            console.error('Error loading checkout data:', error);
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
            console.log('User not logged in, showing login prompt');
            this.renderLoginPrompt();
        }
    }

    async loadAddresses() {
        if (!this.currentUser?.userId) {
            return;
        }

        try {
            const addresses = await this.apiCall(`/addresses/${this.currentUser.userId}`, 'GET');
            this.addresses = addresses;
            
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
            console.error('Error loading addresses:', error);
        }
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
        
        // Fill province and ward dropdowns
        if (address.province) {
            // Find province code from province name
            const matchingProvince = this.provincesCache?.find(p => p.name === address.province);
            if (matchingProvince) {
                $('#shippingProvince').val(matchingProvince.code);
                // Load wards for this province
                await this.loadShippingWards(matchingProvince.code, address.ward);
            }
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
    }

    createAddressOption(address) {
        const isDefault = address.isDefault ? '<span class="badge bg-success ms-2">Mặc định</span>' : '';
        const fullAddress = [address.addressDetail, address.ward, address.province].filter(Boolean).join(', ');
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
                // Save to cache
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

    async loadShippingWards(provinceCode, selectedWard = null) {
        const wardSelect = document.getElementById('shippingWard');
        if (!wardSelect) return;
        if (!provinceCode) {
            wardSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            wardSelect.disabled = true;
            return;
        }

        // Check cache first
        if (this.isCacheValid(`wards_${provinceCode}`) && this.wardsCacheByProvince.has(provinceCode)) {
            const cachedWards = this.wardsCacheByProvince.get(provinceCode);
            this.populateSelect(wardSelect, cachedWards.map(w => ({ value: w.name, label: w.name })), 'Chọn Phường/Xã');

            if (selectedWard) {
                wardSelect.value = selectedWard;
            }
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
                // Save to cache
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
            console.error('Error loading address:', error);
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
            console.error('Error deleting address:', error);
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
                                    <div class="col-md-6 mb-3">
                                        <label for="addrProvince" class="form-label">Tỉnh/Thành phố *</label>
                                        <select class="form-control" id="addrProvince" required>
                                            <option value="">Chọn Tỉnh/Thành phố</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="addrWard" class="form-label">Phường/Xã *</label>
                                        <select class="form-control" id="addrWard" required disabled>
                                            <option value="">Chọn Tỉnh/Thành phố trước</option>
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
                                    <div class="col-md-6 mb-3">
                                        <label for="editAddrProvince" class="form-label">Tỉnh/Thành phố *</label>
                                        <select class="form-control" id="editAddrProvince" required>
                                            <option value="">Chọn Tỉnh/Thành phố</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="editAddrWard" class="form-label">Phường/Xã *</label>
                                        <select class="form-control" id="editAddrWard" required disabled>
                                            <option value="">Chọn Tỉnh/Thành phố trước</option>
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
        this.loadEditProvincesWithMapping(address.province, address.ward);
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
                // Save to cache
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

    async loadEditProvincesWithMapping(provinceName = null, wardName = null) {
        const provinceSelect = document.getElementById('editAddrProvince');
        if (!provinceSelect) return;

        // Check cache first
        if (this.isCacheValid('provinces') && this.provincesCache) {
            this.populateSelect(
                provinceSelect,
                this.provincesCache.map(p => ({ value: p.code, label: p.name })),
                'Chọn Tỉnh/Thành phố'
            );

            if (provinceName) {
                // Find province code from province name
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
                    // Find province code from province name
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

    async loadEditWards(provinceCode, selectedWard = null) {
        const wardSelect = document.getElementById('editAddrWard');
        if (!provinceCode || !wardSelect) return;

        // Check cache first
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

    async loadWards(provinceCode) {
        const wardSelect = document.getElementById('addrWard');
        if (!wardSelect) return;
        if (!provinceCode) {
            wardSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố trước</option>';
            wardSelect.disabled = true;
            return;
        }

        // Check cache first
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
                // Save to cache
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
            const provinceCode = document.getElementById('addrProvince')?.value;
            const wardName = document.getElementById('addrWard')?.value;
            const isDefault = document.getElementById('addrDefault')?.checked || false;

            if (!name || !phone || !addressDetail || !provinceCode || !wardName) {
                this.showToast('Vui lòng điền đầy đủ thông tin địa chỉ', 'error');
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

            const provinceCode = document.getElementById('editAddrProvince').value.trim();
            const wardName = document.getElementById('editAddrWard').value.trim();

            // Validation
            if (!document.getElementById('editAddrName').value.trim() ||
                !document.getElementById('editAddrPhone').value.trim() ||
                !document.getElementById('editAddrDetail').value.trim() ||
                !wardName || !provinceCode) {
                this.showToast('Vui lòng điền đầy đủ thông tin', 'error');
                return;
            }

            // Map province code back to province name
            let provinceName = '';
            if (this.provincesCache) {
                const matchingProvince = this.provincesCache.find(p => p.code === provinceCode);
                if (matchingProvince) {
                    provinceName = matchingProvince.name;
                } else {
                    this.showToast('Không tìm thấy tên tỉnh/thành phố', 'error');
                    return;
                }
            } else {
                this.showToast('Dữ liệu tỉnh/thành không khả dụng', 'error');
                return;
            }

            const addressData = {
                name: document.getElementById('editAddrName').value.trim(),
                phone: document.getElementById('editAddrPhone').value.trim(),
                addressDetail: document.getElementById('editAddrDetail').value.trim(),
                ward: wardName,
                province: provinceName,
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
        return `
            <div class="cart-item" data-cart-product-id="${item.idCartProduct}" data-unit-price="${item.productPrice || 0}">
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
                    <div class="item-footer">
                        <span class="item-price">${this.formatCurrency(item.totalPrice)}</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99">
                            <button class="quantity-btn" data-action="increase">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateOrderSummary() {
        const subtotal = this.selectedItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
        const total = subtotal + this.shippingFee - this.discount;

        $('#summary-subtotal').text(this.formatCurrency(subtotal));
        $('#summary-shipping').text(this.shippingFee === 0 ? 'Miễn phí' : this.formatCurrency(this.shippingFee));
        $('#summary-total').text(this.formatCurrency(total));

        // Disable/enable checkout button based on selected items
        if (this.selectedItems.length === 0) {
            this.disableCheckoutButton();
        } else {
            this.enableCheckoutButton();
        }
    }

    updateShippingFee() {
        const selectedAddress = $('input[name="shippingAddress"]:checked').val();
        // Logic tính phí vận chuyển dựa trên địa chỉ
        this.shippingFee = 0; // Miễn phí cho demo
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
            
            // Gọi API để kiểm tra và áp dụng mã giảm giá
            const response = await this.apiCall('/discounts/apply', 'POST', {
                discountCode: promoCode,
                orderTotal: this.calculateOrderTotal()
            });

            this.discount = response.discountAmount || 0;
            this.updateOrderSummary();
            
            this.showToast('Áp dụng mã giảm giá thành công!', 'success');
            $('#promoCode').val('').attr('placeholder', `Đã áp dụng: ${promoCode}`);
            $('#applyPromoBtn').text('Đã áp dụng').prop('disabled', true);
            
        } catch (error) {
            console.error('Error applying promo code:', error);
            this.showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handlePlaceOrder() {
        if (this.selectedItems.length === 0) {
            this.showToast('Không có sản phẩm nào để đặt hàng', 'warning');
            return;
        }

        // Validate form
        if (!this.validateCheckoutForm()) {
            return;
        }

        try {
            this.showLoading(true);
            
            const orderData = this.collectOrderData();
            
            // Gọi API để tạo đơn hàng
            const response = await this.apiCall(`/order/${this.cartId}`, 'POST', orderData);
            
            this.showToast('Đặt hàng thành công!', 'success');
            
            // Redirect to order confirmation page
            setTimeout(() => {
                window.location.href = `/order-confirmation/${response.idOrder}`;
            }, 2000);
            
        } catch (error) {
            console.error('Error placing order:', error);
            this.showToast('Không thể đặt hàng. Vui lòng thử lại!', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateCheckoutForm() {
        const shippingAddress = $('input[name="shippingAddress"]:checked').val();
        const paymentMethod = $('input[name="paymentMethod"]:checked').val();
        
        if (!shippingAddress) {
            this.showToast('Vui lòng chọn địa chỉ giao hàng', 'warning');
            return false;
        }
        
        if (!paymentMethod) {
            this.showToast('Vui lòng chọn phương thức thanh toán', 'warning');
            return false;
        }
        
        return true;
    }

    collectOrderData() {
        const shippingAddress = $('input[name="shippingAddress"]:checked').val();
        const paymentMethod = $('input[name="paymentMethod"]:checked').val();
        const notes = $('#orderNotes').val() || '';
        
        return {
            shippingAddressId: shippingAddress,
            paymentMethod: paymentMethod,
            notes: notes,
            shippingFee: this.shippingFee,
            discount: this.discount,
            totalAmount: this.calculateOrderTotal()
        };
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
        
        if (action === 'increase') {
            newQuantity = Math.min(newQuantity + 1, 99);
        } else if (action === 'decrease') {
            newQuantity = Math.max(newQuantity - 1, 1);
        }
        
        input.val(newQuantity);
        await this.updateCartProductQuantity(cartProductId, newQuantity);
    }

    async handleQuantityInputChange(e) {
        const input = $(e.target);
        const cartItem = input.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        const newQuantity = Math.max(1, Math.min(99, parseInt(input.val()) || 1));
        
        input.val(newQuantity);
        await this.updateCartProductQuantity(cartProductId, newQuantity);
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
                { quantity: quantity }
            );
            
            // Cập nhật dữ liệu local
            const cartItem = this.selectedItems.find(item => item.idCartProduct === cartProductId);
            if (cartItem) {
                cartItem.quantity = quantity;
                cartItem.totalPrice = response.totalPrice;
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
        checkoutBtn.prop('disabled', false).removeClass('btn-secondary').addClass('btn-checkout');
    }

    disableCheckoutButton() {
        const checkoutBtn = $('button[type="submit"][form="checkoutForm"]');
        checkoutBtn.prop('disabled', true).removeClass('btn-checkout').addClass('btn-secondary');
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
}

// Initialize checkout page when DOM is ready
$(document).ready(() => {
    window.checkoutPage = new CheckoutPage();
});
