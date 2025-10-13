/**
 * Cart Page JavaScript
 * Xử lý tất cả tương tác trong trang giỏ hàng
 */

class CartPage {
    constructor() {
        this.cartItems = [];
        this.selectedItems = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.initDemoData();
        // Kiểm tra trạng thái giỏ hàng trống khi trang được tải
        this.checkIfCartEmpty();
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

    initDemoData() {
        // Hiển thị giỏ hàng có sản phẩm để demo
        this.showCartWithItems();
        this.updateCartSummary();
    }

    handleQuantityChange(e) {
        const button = $(e.target).closest('.quantity-btn');
        const action = button.data('action');
        const input = button.siblings('.quantity-input');
        let value = parseInt(input.val());

        if (action === 'increase') {
            value++;
        } else if (action === 'decrease' && value > 1) {
            value--;
        }

        input.val(value);
        this.updateCartSummary();
    }

    handleQuantityInputChange(e) {
        const input = $(e.target);
        let value = parseInt(input.val());

        if (isNaN(value) || value < 1) {
            value = 1;
            input.val(value);
        } else if (value > 99) {
            value = 99;
            input.val(value);
        }

        // Bỏ hoàn toàn animation - chỉ cập nhật tổng tiền
        this.updateCartSummary();
    }

    handleSelectAll(isChecked) {
        $('.cart-item-checkbox').prop('checked', isChecked);
        $('.cart-item').toggleClass('selected', isChecked);
        this.updateDeleteButton();
        this.updateCartSummary();
    }

    handleItemSelect(e) {
        const checkbox = $(e.target);
        const cartItem = checkbox.closest('.cart-item');

        cartItem.toggleClass('selected', checkbox.is(':checked'));
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
        const productName = cartItem.find('.cart-product-title').text();

        this.showConfirmDialog(
            'Xóa sản phẩm',
            `Bạn có chắc chắn muốn xóa "${productName}" khỏi giỏ hàng?`,
            () => {
                this.removeItemWithAnimation(cartItem);
            }
        );
    }

    handleRemoveSelected() {
        const selectedCount = $('.cart-item-checkbox:checked').length;

        if (selectedCount === 0) return;

        this.showConfirmDialog(
            'Xóa sản phẩm đã chọn',
            `Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn?`,
            () => {
                const selectedItems = $('.cart-item-checkbox:checked').closest('.cart-item');
                selectedItems.each((index, item) => {
                    setTimeout(() => {
                        this.removeItemWithAnimation($(item));
                    }, index * 100);
                });
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
        if ($('.cart-item').length === 0) {
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
        let originalTotal = 0;
        let selectedCount = 0;

        $('.cart-item').each(function() {
            const checkbox = $(this).find('.cart-item-checkbox');
            if (checkbox.is(':checked')) {
                const quantity = parseInt($(this).find('.quantity-input').val());
                const priceText = $(this).find('.cart-price').text().replace(/[^\d]/g, '');
                const price = parseInt(priceText);

                subtotal += price;
                selectedCount++;

                // Tính original price nếu có
                const originalPriceElement = $(this).find('.cart-original-price');
                if (originalPriceElement.length > 0) {
                    const originalPriceText = originalPriceElement.text().replace(/[^\d]/g, '');
                    const originalPrice = parseInt(originalPriceText);
                    originalTotal += originalPrice;
                }
            }
        });

        const discount = originalTotal - subtotal;

        // Update UI
        $('#selected-count').text(selectedCount);
        $('#subtotal').text(this.formatCurrency(originalTotal || subtotal));
        $('#discount').text(discount > 0 ? `-${this.formatCurrency(discount)}` : '0đ');
        $('#total').text(this.formatCurrency(subtotal));

        // Enable/disable checkout button
        $('#checkoutBtn').prop('disabled', selectedCount === 0);

        // Update discount visibility
        if (discount > 0) {
            $('#discount').parent().show();
        } else {
            $('#discount').parent().hide();
        }
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

    handleApplyPromo() {
        const promoCode = $('#promoCode').val().trim();

        if (!promoCode) {
            this.showToast('Vui lòng nhập mã giảm giá', 'warning');
            return;
        }

        this.showLoading(true);

        // Simulate API call
        setTimeout(() => {
            this.showLoading(false);

            // Demo: randomly accept or reject promo code
            if (Math.random() > 0.5) {
                this.showToast('Áp dụng mã giảm giá thành công! Giảm 50.000đ', 'success');
                $('#promoCode').val('').attr('placeholder', `Đã áp dụng: ${promoCode}`);
                $('#applyPromoBtn').text('Đã áp dụng').prop('disabled', true);
            } else {
                this.showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
            }
        }, 1000);
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
}

// Initialize cart page when DOM is ready
$(document).ready(() => {
    window.cartPage = new CartPage();
});
