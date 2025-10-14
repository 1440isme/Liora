class CheckoutPage {
    constructor() {
        this.cartId = null;
        this.selectedItems = [];
        this.shippingFee = 0;
        this.discount = 0;
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

        // Address selection
        $(document).on('change', 'input[name="shippingAddress"]', () => {
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
            this.renderUserInfo(response.result);
        } catch (error) {
            console.log('User not logged in, showing login prompt');
            this.renderLoginPrompt();
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
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
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
