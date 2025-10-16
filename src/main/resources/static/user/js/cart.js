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

        // Chỉ validation khi nhấn Enter hoặc blur (không validation real-time)
        $(document).on('keypress', '.quantity-input', (e) => {
            if (e.which === 13) { // Enter key
                e.preventDefault();
                console.log('Enter pressed, validating...', e.target.value);
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


        // Toggle unavailable items selection
        $(document).on('click', '#toggleUnavailableSelection', (e) => {
            this.handleToggleUnavailableSelection(e);
        });

        // Delete selected unavailable items
        $(document).on('click', '#deleteSelectedUnavailable', (e) => {
            this.handleDeleteSelectedUnavailable(e);
        });

        // Handle unavailable item selection
        $(document).on('change', '.unavailable-checkbox', (e) => {
            this.handleUnavailableItemSelection(e);
        });

        // Handle select all unavailable items
        $(document).on('change', '#selectAllUnavailable', (e) => {
            this.handleSelectAllUnavailable(e);
        });

        // Handle find similar products
        $(document).on('click', '.btn-find-similar', (e) => {
            this.handleFindSimilarProducts(e);
        });

        // Remove selected items
        $(document).on('click', '#deleteSelectedBtn', () => {
            this.handleRemoveSelected();
        });

        // Checkout button
        $(document).on('click', '#checkoutBtn', (e) => {
            e.preventDefault();
            this.navigateToCheckout();
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
                
                // Update header cart badge
                if (window.app && window.app.updateCartDisplay) {
                    window.app.updateCartDisplay();
                }
            } else {
                this.showEmptyCart();
            }
        } catch (error) {
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

        // Phân loại sản phẩm
        const availableItems = [];
        const unavailableItems = [];
        
        this.cartItems.forEach(item => {
            const status = this.getProductStatus(item);
            if (status === 'available') {
                availableItems.push(item);
            } else {
                unavailableItems.push(item);
            }
        });

        const cartItemsContainer = $('#cart-items');
        cartItemsContainer.empty();

        // Hiển thị sản phẩm khả dụng trước
        availableItems.forEach(item => {
            const cartItemHTML = this.createCartItemHTML(item);
            cartItemsContainer.append(cartItemHTML);
        });
        
        // Hiển thị sản phẩm không tồn tại
        if (unavailableItems.length > 0) {
            cartItemsContainer.append(this.createUnavailableItemsSection(unavailableItems));
        }

        this.showCartWithItems();
        
        // Cập nhật trạng thái UI sau khi render
        this.updateSelectAllState();
        this.updateDeleteButton();
        this.updateCartSummary();
    }

    createCartItemHTML(item) {
        const productStatus = this.getProductStatus(item);
        const isDisabled = productStatus !== 'available';
        
        return `
            <div class="cart-item ${isDisabled ? 'disabled' : ''}" data-cart-product-id="${item.idCartProduct}" data-unit-price="${item.productPrice || 0}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="form-check">
                            <input class="form-check-input cart-item-checkbox" type="checkbox" 
                                   ${item.choose ? 'checked' : ''} 
                                   ${isDisabled ? 'disabled' : ''}>
                        </div>
                    </div>
                    <div class="col-auto">
                        <a href="/product/${item.idProduct}" style="text-decoration: none;">
                            <img src="${item.mainImageUrl || '/uploads/products/placeholder.jpg'}" alt="${item.productName || 'Sản phẩm'}" class="cart-product-image">
                        </a>
                    </div>
                    <div class="col">
                        <div class="cart-product-info">
                            <a href="/product/${item.idProduct}" style="text-decoration: none; color: inherit;">
                                <h6 class="cart-product-title">${item.productName || 'Tên sản phẩm'}</h6>
                            </a>
                            <div class="cart-product-brand">${item.brandName || 'Thương hiệu'}</div>
                            <div class="cart-product-price" style="background-color: #f8f9fa; padding: 1px 4px; border-radius: 3px; font-size: 0.8rem; color: #6c757d; display: inline-block;">
                                Đơn giá: ${this.formatCurrency(item.productPrice || 0)}
                            </div>
                            ${this.getProductStatusTag(productStatus)}
                        </div>
                    </div>
                    <div class="col-auto">
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
                    <div class="col-auto">
                        <div class="cart-price-section">
                            <div class="cart-price">${this.formatCurrency(item.totalPrice || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createUnavailableItemsSection(unavailableItems) {
        const itemsHTML = unavailableItems.map(item => this.createUnavailableItemHTML(item)).join('');
        
        return `
            <div class="unavailable-items-section">
                <div class="section-divider">
                    <hr>
                    <span class="divider-text">Sản phẩm không tồn tại</span>
                    <hr>
                </div>
                <div class="unavailable-items-header">
                    <div class="unavailable-items-controls">
                        <div class="unavailable-select-all" style="display: none;">
                            <input type="checkbox" id="selectAllUnavailable" class="select-all-checkbox">
                            <label for="selectAllUnavailable" class="select-all-label">Chọn tất cả</label>
                        </div>
                        <button class="btn btn-outline-danger btn-sm" id="deleteSelectedUnavailable" style="display: none;">
                            <i class="fas fa-trash"></i>
                            <span class="selected-count">0</span>
                        </button>
                        <button class="btn btn-link btn-sm" id="toggleUnavailableSelection" title="Chọn sản phẩm để xóa">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>
                <div class="unavailable-items">
                    ${itemsHTML}
                </div>
            </div>
        `;
    }

    createUnavailableItemHTML(item) {
        const productStatus = this.getProductStatus(item);
        const statusText = productStatus === 'out_of_stock' ? 'Hết hàng' : 'Ngừng kinh doanh';
        const statusClass = productStatus === 'out_of_stock' ? 'status-out-of-stock' : 'status-deactivated';

        return `
            <div class="unavailable-item" data-cart-product-id="${item.idCartProduct}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="unavailable-item-checkbox" style="display: none;">
                            <input type="checkbox" class="unavailable-checkbox" data-cart-product-id="${item.idCartProduct}">
                        </div>
                    </div>
                    <div class="col-auto">
                        <a href="/product/${item.idProduct}" style="text-decoration: none;">
                            <img src="${item.mainImageUrl || '/uploads/products/placeholder.jpg'}" alt="${item.productName || 'Sản phẩm'}" class="unavailable-product-image">
                        </a>
                    </div>
                    <div class="col">
                        <div class="unavailable-product-info">
                            <a href="/product/${item.idProduct}" style="text-decoration: none; color: inherit;">
                                <h6 class="unavailable-product-title">${item.productName || 'Tên sản phẩm'}</h6>
                            </a>
                            <div class="unavailable-product-brand">${item.brandName || 'Thương hiệu'}</div>
                            <span class="product-status-tag ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="col-auto">
                        <button class="btn btn-outline-primary btn-sm btn-find-similar" data-product-id="${item.idProduct}">
                            <i class="fas fa-search"></i>
                            <span class="btn-text">Tìm sản phẩm tương tự</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(item) {
        // Kiểm tra trạng thái sản phẩm - hết hàng trước
        if (item.stock <= 0) {
            return 'out_of_stock';
        }
        if (!item.available || !item.isActive) {
            return 'deactivated';
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

    async handleQuantityChange(e) {
        const button = $(e.target).closest('.quantity-btn');
        const action = button.data('action');
        const input = button.siblings('.quantity-input');
        const cartItem = button.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        let value = parseInt(input.val());
        
        // Lấy max stock từ input attribute (đã được tính min với 99)
        const maxStock = parseInt(input.attr('max')) || 99;

        if (action === 'increase') {
            if (value < maxStock) {
            value++;
            } else {
                // Tự động cập nhật về max stock
                value = maxStock;
                this.showToast(`Bạn chỉ được phép mua tối đa ${maxStock} sản phẩm`, 'warning');
            }
        } else if (action === 'decrease') {
            if (value > 1) {
            value--;
            } else {
                this.showToast(`Số lượng tối thiểu là 1 sản phẩm`, 'warning');
            }
        }

        input.val(value);
        await this.updateCartProductQuantity(cartProductId, value);
    }

    async handleQuantityInputChange(e) {
        const input = $(e.target);
        const cartItem = input.closest('.cart-item');
        const cartProductId = cartItem.data('cart-product-id');
        let value = parseInt(input.val());

        // Lấy max stock từ input attribute (đã được tính min với 99)
        const maxStock = parseInt(input.attr('max')) || 99;
        
        console.log('Input validation:', { value, maxStock, inputVal: input.val(), cartProductId });

        // Force validation ngay lập tức
        if (isNaN(value) || value < 1) {
            value = 1;
            input.val(value);
            this.showToast(`Số lượng tối thiểu là 1 sản phẩm`, 'warning');
            console.log('Set to minimum: 1');
            await this.updateCartProductQuantity(cartProductId, value);
        } else if (value > maxStock) {
            // Tự động cập nhật về max stock
            value = maxStock;
            input.val(value);
            this.showToast(`Bạn chỉ được phép mua tối đa ${maxStock} sản phẩm`, 'warning');
            console.log('Set to maximum:', maxStock);
            await this.updateCartProductQuantity(cartProductId, value);
        }
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
        const deleteBtn = $('#deleteSelectedBtn');
        
        if (hasSelected) {
            deleteBtn.prop('disabled', false);
        } else {
            deleteBtn.prop('disabled', true);
        }
        
        console.log('Update delete button - hasSelected:', hasSelected, 'disabled:', deleteBtn.prop('disabled'));
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
                    // Gọi API để xóa tất cả sản phẩm đã chọn
                    const response = await this.apiCall(
                        `/CartProduct/${this.cartId}/selected`,
                        'DELETE'
                    );
                    
                    // Lấy danh sách ID của các sản phẩm đã chọn để xóa khỏi cartItems
                    const selectedIds = [];
                    $('.cart-item-checkbox:checked').each((index, checkbox) => {
                        const cartItem = $(checkbox).closest('.cart-item');
                        const cartProductId = cartItem.data('cart-product-id');
                        selectedIds.push(cartProductId);
                    });
                    
                    // Xóa khỏi dữ liệu local
                    this.cartItems = this.cartItems.filter(item => !selectedIds.includes(item.idCartProduct));
                    
                    // Xóa tất cả sản phẩm đã chọn khỏi DOM
                    $('.cart-item-checkbox:checked').closest('.cart-item').each((index, item) => {
                        this.removeItemWithAnimation($(item));
                    });
                    
                    // Cập nhật lại UI sau khi xóa
                    this.updateSelectAllState();
                    this.updateDeleteButton();
                    this.updateCartSummary();
                    
                    // Update header cart badge
                    if (window.app && window.app.updateCartDisplay) {
                        window.app.updateCartDisplay();
                    }
                    
                } catch (error) {
                    this.showToast('Không thể xóa sản phẩm đã chọn', 'error');
                }
            }
        );
    }


    handleToggleUnavailableSelection(e) {
        e.preventDefault();
        const button = $(e.target).closest('#toggleUnavailableSelection');
        const isActive = button.hasClass('active');
        
        if (isActive) {
            // Tắt chế độ chọn
            button.removeClass('active');
            $('.unavailable-item-checkbox').hide();
            $('.unavailable-select-all').hide();
            $('#deleteSelectedUnavailable').hide();
            $('.unavailable-checkbox').prop('checked', false);
            $('#selectAllUnavailable').prop('checked', false);
        } else {
            // Bật chế độ chọn
            button.addClass('active');
            $('.unavailable-item-checkbox').show();
            $('.unavailable-select-all').show();
            $('#deleteSelectedUnavailable').show();
            this.updateSelectAllUnavailableState();
        }
    }

    handleUnavailableItemSelection(e) {
        this.updateUnavailableDeleteButton();
        this.updateSelectAllUnavailableState();
    }

    handleSelectAllUnavailable(e) {
        const isChecked = $(e.target).is(':checked');
        $('.unavailable-checkbox').prop('checked', isChecked);
        this.updateUnavailableDeleteButton();
    }

    updateSelectAllUnavailableState() {
        const totalUnavailable = $('.unavailable-checkbox').length;
        const selectedUnavailable = $('.unavailable-checkbox:checked').length;
        const selectAllCheckbox = $('#selectAllUnavailable');
        
        if (selectedUnavailable === 0) {
            selectAllCheckbox.prop('checked', false);
            selectAllCheckbox.prop('indeterminate', false);
        } else if (selectedUnavailable === totalUnavailable) {
            selectAllCheckbox.prop('checked', true);
            selectAllCheckbox.prop('indeterminate', false);
        } else {
            selectAllCheckbox.prop('checked', false);
            selectAllCheckbox.prop('indeterminate', true);
        }
    }

    updateUnavailableDeleteButton() {
        const selectedCount = $('.unavailable-checkbox:checked').length;
        const deleteBtn = $('#deleteSelectedUnavailable');
        const countSpan = deleteBtn.find('.selected-count');
        
        // Luôn hiển thị thùng rác khi ở chế độ chọn
        if ($('#toggleUnavailableSelection').hasClass('active')) {
            deleteBtn.show();
            
            // Thêm/xóa class enabled dựa trên số lượng được chọn
            if (selectedCount > 0) {
                deleteBtn.addClass('enabled');
            } else {
                deleteBtn.removeClass('enabled');
            }
        }
        
        // Cập nhật số lượng (nhưng đã ẩn bằng CSS)
        countSpan.text(selectedCount);
    }

    async handleDeleteSelectedUnavailable(e) {
        e.preventDefault();
        const selectedCheckboxes = $('.unavailable-checkbox:checked');
        
        if (selectedCheckboxes.length === 0) {
            this.showToast('Vui lòng chọn sản phẩm để xóa', 'warning');
            return;
        }
        
        this.showConfirmDialog(
            'Xóa sản phẩm đã chọn',
            `Bạn có chắc chắn muốn xóa ${selectedCheckboxes.length} sản phẩm đã chọn?`,
            async () => {
                try {
                    const selectedIds = [];
                    selectedCheckboxes.each((index, checkbox) => {
                        const cartProductId = $(checkbox).data('cart-product-id');
                        selectedIds.push(cartProductId);
                    });
                    
                    console.log('Deleting unavailable items:', selectedIds);
                    
                    // Xóa từng sản phẩm không tồn tại
                    for (const cartProductId of selectedIds) {
                        console.log('Deleting unavailable cart product:', cartProductId);
                        await this.apiCall(`/CartProduct/${this.cartId}/unavailable/${cartProductId}`, 'DELETE');
                    }
                    
                    // Xóa khỏi dữ liệu local
                    this.cartItems = this.cartItems.filter(item => !selectedIds.includes(item.idCartProduct));
                    
                    // Xóa khỏi DOM
                    selectedCheckboxes.closest('.unavailable-item').each((index, item) => {
                        this.removeItemWithAnimation($(item));
                    });
                    
                    // Tắt chế độ chọn
                    $('#toggleUnavailableSelection').removeClass('active');
                    $('.unavailable-item-checkbox').hide();
                    $('.unavailable-select-all').hide();
                    $('#deleteSelectedUnavailable').hide();
                    $('.unavailable-checkbox').prop('checked', false);
                    $('#selectAllUnavailable').prop('checked', false);
                    
                    // Cập nhật lại UI
                    this.updateCartSummary();
                    
                    // Update header cart badge
                    if (window.app && window.app.forceUpdateCartDisplay) {
                        window.app.forceUpdateCartDisplay();
                    }
                    
                    this.showToast(`Đã xóa ${selectedIds.length} sản phẩm khỏi giỏ hàng`, 'success');
                    
                } catch (error) {
                    console.error('Error deleting unavailable items:', error);
                    this.showToast('Không thể xóa sản phẩm đã chọn', 'error');
                }
            }
        );
    }

    handleFindSimilarProducts(e) {
        e.preventDefault();
        const button = $(e.target).closest('.btn-find-similar');
        const productId = button.data('product-id');
        
        if (!productId) {
            this.showToast('Không thể tìm sản phẩm tương tự', 'error');
            return;
        }
        
        // Tìm sản phẩm trong cartItems để lấy thông tin
        const product = this.cartItems.find(item => item.idProduct === productId);
        if (!product) {
            this.showToast('Không tìm thấy thông tin sản phẩm', 'error');
            return;
        }
        
        // Chuyển đến trang tìm kiếm với từ khóa là tên sản phẩm
        const searchQuery = encodeURIComponent(product.productName || '');
        window.location.href = `/search?q=${searchQuery}`;
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

    async removeUnavailableItem(cartProductId, cartItemElement) {
        try {
            await this.apiCall(
                `/CartProduct/${this.cartId}/unavailable/${cartProductId}`,
                'DELETE'
            );
            
            // Xóa khỏi dữ liệu local
            this.cartItems = this.cartItems.filter(item => item.idCartProduct !== cartProductId);
            
            // Animation xóa
            this.removeItemWithAnimation(cartItemElement);
            
            // Update header cart badge
            if (window.app && window.app.forceUpdateCartDisplay) {
                window.app.forceUpdateCartDisplay();
            }
            
            this.showToast('Đã xóa sản phẩm khỏi giỏ hàng', 'success');
            
        } catch (error) {
            this.showToast('Không thể xóa sản phẩm', 'error');
        }
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
        let availableSelectedCount = 0;
    
        $('.cart-item').each((index, element) => {
            const $item = $(element);
            const checkbox = $item.find('.cart-item-checkbox');
            if (!checkbox.is(':checked')) return;
    
            const quantity = parseInt($item.find('.quantity-input').val(), 10) || 1;
            const isDisabled = $item.hasClass('disabled');
    
            // Lấy đơn giá từ data-unit-price (số nguyên/float), tránh parse từ text hiển thị
            const unitPrice = parseFloat($item.data('unit-price')) || 0;
    
            subtotal += unitPrice * quantity;
                selectedCount++;

            // Chỉ đếm sản phẩm khả dụng cho checkout
            if (!isDisabled) {
                availableSelectedCount++;
            }
        });
    
        $('#selected-count').text(selectedCount);
        $('#subtotal').text(this.formatCurrency(subtotal));
        $('#total').text(this.formatCurrency(subtotal));

        // Chỉ cho phép checkout nếu có ít nhất 1 sản phẩm khả dụng được chọn
        $('#checkoutBtn').prop('disabled', availableSelectedCount === 0);
        
        // Hiển thị cảnh báo nếu có sản phẩm không khả dụng được chọn
        if (selectedCount > 0 && availableSelectedCount === 0) {
            this.showToast('Không thể thanh toán: Tất cả sản phẩm đã chọn đều không khả dụng', 'warning');
        } else if (selectedCount > availableSelectedCount) {
            this.showToast(`${selectedCount - availableSelectedCount} sản phẩm không khả dụng sẽ bị loại bỏ khỏi đơn hàng`, 'info');
        }
        
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
            
            // Update header cart badge
            if (window.app && window.app.forceUpdateCartDisplay) {
                window.app.forceUpdateCartDisplay();
            }
        } catch (error) {
            this.showToast('Không thể cập nhật số lượng sản phẩm', 'error');
        }
    }

    async updateCartProductSelection(cartProductId, isSelected) {
        try {
            // Lấy quantity hiện tại từ DOM
            const cartItem = $(`.cart-item[data-cart-product-id="${cartProductId}"]`);
            const currentQuantity = parseInt(cartItem.find('.quantity-input').val()) || 1;
            
            
            const response = await this.apiCall(
                `/CartProduct/${this.cartId}/${cartProductId}`,
                'PUT',
                { 
                    choose: isSelected,
                    quantity: currentQuantity
                }
            );
            
            // Cập nhật dữ liệu local
            const localCartItem = this.cartItems.find(item => item.idCartProduct === cartProductId);
            if (localCartItem) {
                localCartItem.choose = isSelected;
            }
        } catch (error) {
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
            
            // Update header cart badge
            if (window.app && window.app.forceUpdateCartDisplay) {
                window.app.forceUpdateCartDisplay();
            }
            
        } catch (error) {
            this.showToast('Không thể xóa sản phẩm khỏi giỏ hàng', 'error');
        }
    }

    calculateCartTotal() {
        const subtotalText = $('#subtotal').text().replace(/[^\d]/g, '');
        return parseFloat(subtotalText) || 0;
    }

    navigateToCheckout() {
        // Validate all selected products before checkout
        if (!this.validateSelectedProducts()) {
            return;
        }
        
        // Show loading overlay
        this.showLoading(true);
        
        // Add smooth transition effect
        $('body').addClass('page-transition');
        
        // Navigate after a short delay for smooth effect
        setTimeout(() => {
            window.location.href = '/checkout';
        }, 300);
    }

    validateSelectedProducts() {
        // Lấy danh sách sản phẩm đã chọn
        const selectedItems = this.cartItems.filter(item => item.choose === true);
        
        if (selectedItems.length === 0) {
            this.showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán', 'warning');
            return false;
        }
        
        // Kiểm tra tất cả sản phẩm đã chọn
        for (const item of selectedItems) {
            const status = this.getProductStatus(item);
            
            // Nếu sản phẩm không hợp lệ (hết hàng hoặc ngừng kinh doanh)
            if (status !== 'available') {
                let message = '';
                if (status === 'out_of_stock') {
                    message = 'Sản phẩm đã hết hàng';
                } else if (status === 'deactivated') {
                    message = 'Sản phẩm đã ngừng kinh doanh';
                }
                
                this.showToast(`Đơn hàng có sản phẩm không hợp lệ: ${item.product.productName} (${message})`, 'error');
                return false;
            }
            
            // Kiểm tra số lượng có vượt quá tồn kho không
            if (item.quantity > item.stock) {
                this.showToast(`Sản phẩm ${item.product.productName} không đủ hàng (còn ${item.stock} sản phẩm)`, 'error');
                return false;
            }
        }
        
        return true;
    }
    
}

// Initialize cart page when DOM is ready
$(document).ready(() => {
    window.cartPage = new CartPage();
});