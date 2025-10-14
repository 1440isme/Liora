/**
 * Cart Page JavaScript
 * Xử lý tất cả tương tác trong trang giỏ hàng
 */

class CartPage {
    constructor() {
        this.cartItems = [];
        this.selectedItems = new Set();
        this.cartId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCartData();
    }

    bindEvents() {
        $(document).on('click', '.quantity-btn', (e) => {
            this.handleQuantityChange(e);
        });

        // Quantity input direct change
        $(document).on('change', '.quantity-input', (e) => {
            this.handleQuantityInputChange(e);
        });

        // Xử lý phím Enter trong ô nhập số lượng
        $(document).on('keypress', '.quantity-input', (e) => {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                $(e.target).blur(); // Thoát khỏi ô input để trigger change event
                this.handleQuantityInputChange(e);
            }
        });

        // Xử lý khi ra khỏi ô input (blur event)
        $(document).on('blur', '.quantity-input', (e) => {
            this.handleQuantityInputChange(e);
        });

        // Select all checkbox
        $(document).on('change', '#selectAllItems', (e) => {
            this.handleSelectAll(e.target.checked);
        });

        // Individual item checkbox
        $(document).on('change', '.cart-item-checkbox', (e) => {
            this.handleItemSelect(e);
        });

        // Remove item
        $(document).on('click', '.cart-action-btn.delete', (e) => {
            this.handleRemoveItem(e);
        });

        // Remove selected items
        $(document).on('click', '#deleteSelectedBtn', () => {
            this.handleRemoveSelected();
        });

        // Checkout button
        $(document).on('click', '#checkoutBtn', () => {
            window.location.href = '/checkout';
        });

        // Apply promo code
        $(document).on('click', '#applyPromoBtn', () => {
            this.handleApplyPromo();
        });
    }

    async loadCartData() {
        try {
            this.showLoading(true);
            
            // Lấy thông tin giỏ hàng hiện tại
            const cartResponse = await this.apiCall('/cart/api/current', 'GET');
            this.cartId = cartResponse.cartId;
            
            if (this.cartId) {
                // Lấy danh sách sản phẩm trong giỏ hàng
                const itemsResponse = await this.apiCall(`/cart/api/${this.cartId}/items`, 'GET');
                this.cartItems = itemsResponse;
                this.renderCartItems();
                this.updateCartSummary();
            } else {
                this.showEmptyCart();
            }
        } catch (error) {
            console.error('Error loading cart data:', error);
            this.showToast('Không thể tải thông tin giỏ hàng', 'error');
            this.showEmptyCart();
        } finally {
            this.showLoading(false);
        }
    }

    renderCartItems() {
        if (!this.cartItems || this.cartItems.length === 0) {
            this.showEmptyCart();
            return;
        }

        const cartItemsContainer = $('#cart-items');
        cartItemsContainer.empty();

        this.cartItems.forEach(item => {
            const cartItemHTML = this.createCartItemHTML(item);
            cartItemsContainer.append(cartItemHTML);
        });

        this.showCartWithItems();
    }

    createCartItemHTML(item) {
        return `
            <div class="cart-item" data-cart-product-id="${item.idCartProduct}" data-unit-price="${item.productPrice || 0}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="form-check">
                            <input class="form-check-input cart-item-checkbox" type="checkbox" ${item.choose ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="col-auto">
                        <a href="/product-detail" style="text-decoration: none;">
                            <img src="${item.mainImageUrl || '/uploads/products/placeholder.jpg'}" alt="${item.productName || 'Sản phẩm'}" class="cart-product-image">
                        </a>
                    </div>
                    <div class="col">
                        <div class="cart-product-info">
                            <a href="/product-detail" style="text-decoration: none; color: inherit;">
                                <h6 class="cart-product-title">${item.productName || 'Tên sản phẩm'}</h6>
                            </a>
                            <div class="cart-product-brand">${item.brandName || 'Thương hiệu'}</div>
                            <div class="cart-product-price" style="background-color: #f8f9fa; padding: 1px 4px; border-radius: 3px; font-size: 0.8rem; color: #6c757d; display: inline-block;">
                                Đơn giá: ${this.formatCurrency(item.productPrice || 0)}
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
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
                    <div class="col-auto">
                        <div class="cart-price-section">
                            <div class="cart-price">${this.formatCurrency(item.totalPrice || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    

    async handleQuantityChange(e) {
        const button = $(e.target).closest('.quantity-btn');
        const action = button.data('action');
        const input = button.siblings('.quantity-input');
        const cartItem = button.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        let value = parseInt(input.val());

        if (action === 'increase') {
            value++;
        } else if (action === 'decrease' && value > 1) {
            value--;
        }

        input.val(value);
        await this.updateCartProductQuantity(cartProductId, value);
    }

    async handleQuantityInputChange(e) {
        const input = $(e.target);
        const cartItem = input.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        let value = parseInt(input.val());

        if (isNaN(value) || value < 1) {
            value = 1;
            input.val(value);
        } else if (value > 99) {
            value = 99;
            input.val(value);
        }

        await this.updateCartProductQuantity(cartProductId, value);
    }

    async handleSelectAll(isChecked) {
        $('.cart-item-checkbox').prop('checked', isChecked);
        $('.cart-item').toggleClass('selected', isChecked);
        
        // Cập nhật tất cả sản phẩm trong giỏ hàng
        const promises = [];
        $('.cart-item').each((index, item) => {
            const cartProductId = $(item).data('cart-product-id');
            promises.push(this.updateCartProductSelection(cartProductId, isChecked));
        });
        
        await Promise.all(promises);
        this.updateDeleteButton();
        this.updateCartSummary();
    }

    async handleItemSelect(e) {
        const checkbox = $(e.target);
        const cartItem = checkbox.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        const isChecked = checkbox.is(':checked');

        cartItem.toggleClass('selected', isChecked);
        await this.updateCartProductSelection(cartProductId, isChecked);
        this.updateSelectAllState();
        this.updateDeleteButton();
        this.updateCartSummary();
    }

    updateSelectAllState() {
        const totalItems = $('.cart-item-checkbox').length;
        const checkedItems = $('.cart-item-checkbox:checked').length;
        const selectAllCheckbox = $('#selectAllItems');

        if (checkedItems === 0) {
            selectAllCheckbox.prop('checked', false).prop('indeterminate', false);
        } else if (checkedItems === totalItems) {
            selectAllCheckbox.prop('checked', true).prop('indeterminate', false);
        } else {
            selectAllCheckbox.prop('checked', false).prop('indeterminate', true);
        }
    }

    updateDeleteButton() {
        const hasSelected = $('.cart-item-checkbox:checked').length > 0;
        $('#deleteSelectedBtn').prop('disabled', !hasSelected);
    }

    handleRemoveItem(e) {
        const cartItem = $(e.target).closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        const productName = cartItem.find('.cart-product-title').text();

        this.showConfirmDialog(
            'Xóa sản phẩm',
            `Bạn có chắc chắn muốn xóa "${productName}" khỏi giỏ hàng?`,
            async () => {
                await this.removeCartProduct(cartProductId, cartItem);
            }
        );
    }

    handleRemoveSelected() {
        const selectedCount = $('.cart-item-checkbox:checked').length;

        if (selectedCount === 0) return;

        this.showConfirmDialog(
            'Xóa sản phẩm đã chọn',
            `Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn?`,
            async () => {
                try {
                    console.log('Starting to remove selected products...');
                    console.log('Cart ID:', this.cartId);
                    console.log('Selected count:', selectedCount);
                    
                    // Gọi API để xóa tất cả sản phẩm đã chọn
                    const response = await this.apiCall(
                        `/CartProduct/${this.cartId}/selected`,
                        'DELETE'
                    );
                    
                    console.log('Delete API response:', response);
                    
                    // Lấy danh sách ID của các sản phẩm đã chọn để xóa khỏi cartItems
                    const selectedIds = [];
                    $('.cart-item-checkbox:checked').each((index, checkbox) => {
                        const cartItem = $(checkbox).closest('.cart-item');
                        const cartProductId = cartItem.data('cart-product-id');
                        selectedIds.push(cartProductId);
                    });
                    
                    console.log('Selected IDs to remove:', selectedIds);
                    
                    // Xóa khỏi dữ liệu local
                    this.cartItems = this.cartItems.filter(item => !selectedIds.includes(item.idCartProduct));
                    console.log('Updated cartItems:', this.cartItems);
                    
                    // Xóa tất cả sản phẩm đã chọn khỏi DOM
                    $('.cart-item-checkbox:checked').closest('.cart-item').each((index, item) => {
                        this.removeItemWithAnimation($(item));
                    });
                    
                    // Cập nhật lại UI sau khi xóa
                    this.updateSelectAllState();
                    this.updateDeleteButton();
                    this.updateCartSummary();
                    
                    console.log('Successfully removed selected products');
                } catch (error) {
                    console.error('Error removing selected products:', error);
                    console.error('Error details:', {
                        message: error.message,
                        status: error.status,
                        response: error.response
                    });
                    this.showToast('Không thể xóa sản phẩm đã chọn', 'error');
                }
            }
        );
    }

    removeItemWithAnimation(cartItem) {
        cartItem.addClass('removing');

        setTimeout(() => {
            cartItem.fadeOut(300, () => {
                cartItem.remove();
                this.updateSelectAllState();
                this.updateDeleteButton();
                this.updateCartSummary();
                this.checkIfCartEmpty();
            });
        }, 200);
    }

    checkIfCartEmpty() {
        if (!this.cartItems || this.cartItems.length === 0) {
            this.showEmptyCart();
        }
    }

    showEmptyCart() {
        $('#cart-items-row').fadeOut(300, () => {
            $('#cart-empty-row').fadeIn(300);
        });
    }

    showCartWithItems() {
        $('#cart-empty-row').fadeOut(300, () => {
            $('#cart-items-row').fadeIn(300);
        });
    }

    updateCartSummary() {
        let subtotal = 0;
        let selectedCount = 0;
    
        $('.cart-item').each((index, element) => {
            const $item = $(element);
            const checkbox = $item.find('.cart-item-checkbox');
            if (!checkbox.is(':checked')) return;
    
            const quantity = parseInt($item.find('.quantity-input').val(), 10) || 1;
    
            // Lấy đơn giá từ data-unit-price (số nguyên/float), tránh parse từ text hiển thị
            const unitPrice = parseFloat($item.data('unit-price')) || 0;
    
            subtotal += unitPrice * quantity;
            selectedCount++;
        });
    
        $('#selected-count').text(selectedCount);
        $('#subtotal').text(this.formatCurrency(subtotal));
        $('#total').text(this.formatCurrency(subtotal));
        $('#checkoutBtn').prop('disabled', selectedCount === 0);
        $('#discount').parent().hide();
    }
    

    handleCheckout() {
        const selectedCount = $('.cart-item-checkbox:checked').length;

        if (selectedCount === 0) {
            this.showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán', 'warning');
            return;
        }

        // Show loading
        this.showLoading(true);

        // Simulate checkout process
        setTimeout(() => {
            this.showLoading(false);
            this.showToast('Chuyển đến trang thanh toán...', 'success');

            // Redirect to checkout page
            setTimeout(() => {
                window.location.href = '/checkout';
            }, 1000);
        }, 1500);
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
                orderTotal: this.calculateCartTotal()
            });

            this.showToast('Áp dụng mã giảm giá thành công!', 'success');
            $('#promoCode').val('').attr('placeholder', `Đã áp dụng: ${promoCode}`);
            $('#applyPromoBtn').text('Đã áp dụng').prop('disabled', true);
            this.updateCartSummary();
            
        } catch (error) {
            console.error('Error applying promo code:', error);
            this.showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showConfirmDialog(title, message, onConfirm) {
        if (confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
    }

    showLoading(show) {
        if (show) {
            $('#loading-overlay').fadeIn(200);
        } else {
            $('#loading-overlay').fadeOut(200);
        }
    }

    showToast(message, type = 'info') {
        // Create toast container if not exists
        if (!$('#toast-container').length) {
            $('body').append('<div id="toast-container" class="position-fixed top-0 end-0 p-3" style="z-index: 9999;"></div>');
        }

        const toastId = 'toast-' + Date.now();
        const iconMap = {
            success: 'fas fa-check-circle text-success',
            error: 'fas fa-exclamation-circle text-danger',
            warning: 'fas fa-exclamation-triangle text-warning',
            info: 'fas fa-info-circle text-info'
        };

        const colorMap = {
            success: 'success',
            error: 'danger',
            warning: 'warning',
            info: 'info'
        };

        const toastHTML = `
            <div class="toast align-items-center text-bg-${colorMap[type]} border-0" id="${toastId}" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="${iconMap[type]} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        $('#toast-container').append(toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();

        // Auto remove after hide
        toastElement.addEventListener('hidden.bs.toast', () => {
            $(toastElement).remove();
        });
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

    async updateCartProductQuantity(cartProductId, quantity) {
        try {
            const response = await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'PUT',
                { quantity: quantity }
            );
            
            // Cập nhật dữ liệu local
            const cartItem = this.cartItems.find(item => item.idCartProduct === cartProductId);
            if (cartItem) {
                cartItem.quantity = quantity;
                cartItem.totalPrice = response.totalPrice;
            }
            
            // Cập nhật giá trong DOM
            const cartItemElement = $(`.cart-item[data-cart-product-id="${cartProductId}"]`);
            const priceElement = cartItemElement.find('.cart-price');
            if (priceElement.length > 0) {
                priceElement.text(this.formatCurrency(response.totalPrice));
            }
            
            this.updateCartSummary();
        } catch (error) {
            console.error('Error updating cart product quantity:', error);
            this.showToast('Không thể cập nhật số lượng sản phẩm', 'error');
        }
    }

    async updateCartProductSelection(cartProductId, isSelected) {
        try {
            // Lấy quantity hiện tại từ DOM
            const cartItem = $(`.cart-item[data-cart-product-id="${cartProductId}"]`);
            const currentQuantity = parseInt(cartItem.find('.quantity-input').val()) || 1;
            
            console.log('Updating cart product selection:', {
                cartProductId,
                isSelected,
                currentQuantity,
                cartId: this.cartId
            });
            
            const response = await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'PUT',
                { 
                    choose: isSelected,
                    quantity: currentQuantity
                }
            );
            
            console.log('Update response:', response);
            
            // Cập nhật dữ liệu local
            const localCartItem = this.cartItems.find(item => item.idCartProduct === cartProductId);
            if (localCartItem) {
                localCartItem.choose = isSelected;
            }
        } catch (error) {
            console.error('Error updating cart product selection:', error);
            this.showToast('Không thể cập nhật trạng thái chọn sản phẩm', 'error');
        }
    }

    async removeCartProduct(cartProductId, cartItemElement) {
        try {
            await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'DELETE'
            );
            
            // Xóa khỏi dữ liệu local
            this.cartItems = this.cartItems.filter(item => item.idCartProduct !== cartProductId);
            
            // Animation xóa
            this.removeItemWithAnimation(cartItemElement);
            
        } catch (error) {
            console.error('Error removing cart product:', error);
            this.showToast('Không thể xóa sản phẩm khỏi giỏ hàng', 'error');
        }
    }

    calculateCartTotal() {
        const subtotalText = $('#subtotal').text().replace(/[^\d]/g, '');
        return parseFloat(subtotalText) || 0;
    }
    
}

// Initialize cart page when DOM is ready
$(document).ready(() => {
    window.cartPage = new CartPage();
}); 