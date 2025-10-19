/**
 * Newest Products Management
 * Handles product listing for newest products
 */
class NewestProductsPageManager {
    constructor() {
        console.log('NewestProductsPageManager constructor called');
        this.currentPage = 0;
        this.pageSize = 12;
        this.currentFilters = {
            search: '',
            minPrice: null,
            maxPrice: null,
            brands: [],
            ratings: [],
            sort: ''
        };
        this.products = [];
        this.totalElements = 0;
        this.totalPages = 0;
    }

    init() {
        console.log('NewestProductsPageManager init() called');
        try {
            this.bindEvents();
            console.log('bindEvents completed');
            this.loadBrands();
            this.loadProducts();
            console.log('loadProducts called');
        } catch (error) {
            console.error('Error in init():', error);
        }
    }

    bindEvents() {
        // Price range filter
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) {
            priceRangeSelect.addEventListener('change', this.handlePriceRangeChange.bind(this));
        }

        // Brand filters
        const brandFilters = document.getElementById('brandFilters');
        if (brandFilters) {
            brandFilters.addEventListener('change', this.handleBrandFilterChange.bind(this));
        }

        // Rating filters
        const ratingFilters = document.getElementById('ratingFilters');
        if (ratingFilters) {
            ratingFilters.addEventListener('change', this.handleRatingFilterChange.bind(this));
        }

        // Sort change
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }

        // Apply filter button
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) {
            applyFilters.addEventListener('click', this.applyFilters.bind(this));
        }

        // Rating checkboxes
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');
        ratingCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleRatingFilterChange(e));
        });

        // Quick view modal events - will be bound when modal is shown
    }

    // Deprecated method - use bindQuickViewEvents(product) instead
    bindQuickViewEvents() {
        console.log('bindQuickViewEvents() called without product - this is deprecated');
    }

    // Setup slider navigation
    setupSliderNavigation(product) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const mainImage = document.getElementById('mainProductImage');
        const thumbnails = document.querySelectorAll('.thumbnail-item');

        if (!product.images || product.images.length <= 1) {
            // Hide navigation buttons if only one image
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }

        let currentImageIndex = 0;

        // Update main image
        const updateMainImage = (index) => {
            if (product.images && product.images[index]) {
                mainImage.src = product.images[index].imageUrl;
                mainImage.alt = product.name;

                // Update thumbnail selection
                thumbnails.forEach((thumb, i) => {
                    thumb.classList.toggle('active', i === index);
                });
            }
        };

        // Previous button
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : product.images.length - 1;
                updateMainImage(currentImageIndex);
            });
        }

        // Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentImageIndex = currentImageIndex < product.images.length - 1 ? currentImageIndex + 1 : 0;
                updateMainImage(currentImageIndex);
            });
        }

        // Thumbnail click handlers
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                currentImageIndex = index;
                updateMainImage(currentImageIndex);
            });
        });
    }

    // Get main image URL for product
    getMainImageUrl(product) {
        if (product.images && product.images.length > 0) {
            // Use first image as main image
            return product.images[0].imageUrl || product.images[0];
        }
        return product.mainImageUrl || '/user/img/default-product.jpg';
    }

    // Generate image thumbnails for slider
    generateImageThumbnails(product) {
        // Use product images if available, otherwise fallback to main image
        let images = [];

        if (product.images && product.images.length > 0) {
            // Use actual product images
            images = product.images;
        } else if (product.mainImageUrl) {
            // Fallback to main image
            images = [{ imageUrl: product.mainImageUrl }];
        } else {
            // Default image
            images = [{ imageUrl: '/user/img/default-product.jpg' }];
        }

        return images.map((image, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                <img src="${image.imageUrl || image}" 
                     alt="${product.name}" 
                     class="img-fluid rounded"
                     onerror="this.src='/user/img/default-product.jpg'">
            </div>
        `).join('');
    }


    // Generate stars for modal
    generateStarsForModal(rating, reviewCount = 0) {

        // Logic đúng cho Quick View modal
        if (!rating || rating === 0 || rating === '0' || rating === null || rating === undefined) {
            console.log('Modal: Rating is 0 or no reviews, showing empty stars');
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += '<i class="far fa-star"></i>';
            }
            return stars;
        }

        const numRating = parseFloat(rating);
        const fullStars = Math.floor(numRating);
        const hasHalfStar = numRating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    // Get quick view actions
    getQuickViewActions(product) {
        const status = this.getProductStatus(product);
        const isDisabled = status !== 'available';

        if (status === 'deactivated') {
            return `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Sản phẩm đã ngừng kinh doanh
                </div>
            `;
        }

        if (status === 'out_of_stock') {
            return `
                <div class="alert alert-danger text-center">
                    <i class="fas fa-times-circle me-2"></i>
                    Sản phẩm đã hết hàng
                </div>
            `;
        }

        return `
            <!-- Buy Now & Add to Cart Buttons (Same Row) -->
            <div class="row g-2">
                <div class="col-6">
                    <button class="btn btn-danger btn-lg w-100" 
                            onclick="window.newestProductsPageManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="window.newestProductsPageManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

    // Quantity controls for modal
    decrementQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            const currentValue = parseInt(quantityInput.value) || 1;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        }
    }

    incrementQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            const currentValue = parseInt(quantityInput.value) || 1;
            const maxValue = parseInt(quantityInput.max) || 99;
            if (currentValue < maxValue) {
                quantityInput.value = currentValue + 1;
            }
        }
    }

    validateQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            const value = parseInt(quantityInput.value);
            const maxValue = parseInt(quantityInput.max) || 99;

            if (value < 1) {
                quantityInput.value = 1;
            } else if (value > maxValue) {
                quantityInput.value = maxValue;
            }
        }
    }

    validateQuantityOnBlur() {
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            const value = parseInt(quantityInput.value);
            const maxValue = parseInt(quantityInput.max) || 99;

            if (isNaN(value) || value < 1) {
                quantityInput.value = 1;
            } else if (value > maxValue) {
                quantityInput.value = maxValue;
            }
        }
    }

    // Add to cart with quantity (copied from category-products)
    addToCartWithQuantity(productId) {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        const product = this.products.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            return;
        }

        // Validate quantity against stock
        if (quantity > product.stock) {
            this.showNotification(`Số lượng bạn chọn (${quantity}) vượt quá số lượng tồn kho hiện có (${product.stock} sản phẩm). Vui lòng chọn số lượng phù hợp.`, 'error');
            return;
        }

        // Try to add to global cart if available
        if (window.app && window.app.cartItems) {
            // Check if product already in cart
            const existingItem = window.app.cartItems.find(item => item.id === productId);

            if (existingItem) {
                const newTotalQuantity = existingItem.quantity + quantity;
                if (newTotalQuantity > product.stock) {
                    this.showNotification(`Tổng số lượng trong giỏ hàng (${newTotalQuantity}) vượt quá tồn kho hiện có (${product.stock} sản phẩm). Vui lòng giảm số lượng.`, 'error');
                    return;
                }
                existingItem.quantity = newTotalQuantity;
            } else {
                window.app.cartItems.push({
                    ...product,
                    quantity: quantity
                });
            }

            // Update cart display
            if (window.app.updateCartDisplay) {
                window.app.updateCartDisplay();
            }
        }

        // Show success message
        this.showNotification(`${quantity} x ${product.name} đã được thêm vào giỏ hàng thành công!`, 'success');
    }

    // Buy now - add to cart and redirect to checkout (copied from category-products)
    buyNow(productId) {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

        const product = this.products.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            return;
        }

        // Validate quantity against stock
        if (quantity > product.stock) {
            this.showNotification(`Số lượng bạn chọn (${quantity}) vượt quá số lượng tồn kho hiện có (${product.stock} sản phẩm). Vui lòng chọn số lượng phù hợp.`, 'error');
            return;
        }

        // Add to cart silently
        if (window.app && window.app.cartItems) {
            // Check if product already in cart
            const existingItem = window.app.cartItems.find(item => item.id === productId);

            if (existingItem) {
                const newTotalQuantity = existingItem.quantity + quantity;
                if (newTotalQuantity > product.stock) {
                    this.showNotification(`Tổng số lượng trong giỏ hàng (${newTotalQuantity}) vượt quá tồn kho hiện có (${product.stock} sản phẩm). Vui lòng giảm số lượng.`, 'error');
                    return;
                }
                existingItem.quantity = newTotalQuantity;
            } else {
                window.app.cartItems.push({
                    ...product,
                    quantity: quantity
                });
            }

            // Update cart display
            if (window.app.updateCartDisplay) {
                window.app.updateCartDisplay();
            }
        }

        // Show success message
        this.showNotification(`${quantity} x ${product.name} đã được thêm vào giỏ hàng! Đang chuyển đến trang thanh toán...`, 'success');

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }

        // Redirect to checkout after a short delay
        setTimeout(() => {
            window.location.href = '/checkout';
        }, 1500);
    }

    // Add to cart from product card (copied from category-products)
    async addToCart(productId, productName, price) {
        console.log('addToCart called for productId:', productId, 'productName:', productName);
        console.log('window.cartManager exists:', !!window.cartManager);
        console.log('window.cartManager:', window.cartManager);

        try {
            // Check if cart functionality exists
            if (window.cartManager && window.cartManager.addItem) {
                console.log('Using cartManager.addItem');
                await window.cartManager.addItem(productId, 1, price);
                this.showNotification(`${productName} đã được thêm vào giỏ hàng!`, 'success');
                return;
            }

            // Fallback to app cart
            if (window.app && window.app.cartItems) {
                console.log('Using app.cartItems fallback');

                // Check if product already in cart
                const existingItem = window.app.cartItems.find(item => item.id === productId);

                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    // Find product in current products array
                    const product = this.products.find(p => p.productId === productId);
                    if (product) {
                        window.app.cartItems.push({
                            ...product,
                            quantity: 1
                        });
                    } else {
                        // Fallback: create minimal product object
                        window.app.cartItems.push({
                            id: productId,
                            productId: productId,
                            name: productName,
                            price: price,
                            quantity: 1
                        });
                    }
                }

                // Update cart display
                if (window.app.updateCartDisplay) {
                    window.app.updateCartDisplay();
                }

                this.showNotification(`${productName} đã được thêm vào giỏ hàng!`, 'success');
                return;
            }

            // Final fallback: show notification
            console.log('Using final fallback - notification only');
            this.showNotification(`${productName} đã được thêm vào giỏ hàng`, 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Không thể thêm vào giỏ hàng', 'error');
        }
    }

    // Show notification (copied from category-products)
    showNotification(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        // Add to toast container
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        // Show toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();

        // Remove from DOM after hiding
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    handlePriceRangeChange(event) {
        const selectedRange = event.target.value;
        if (!selectedRange || selectedRange === '') {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
        } else {
            const [min, max] = selectedRange.split(',').map(Number);
            this.currentFilters.minPrice = min;
            this.currentFilters.maxPrice = max;
        }
        // Don't load products immediately - wait for apply button
        console.log('Price range updated:', this.currentFilters.minPrice, this.currentFilters.maxPrice);
    }

    handleBrandFilterChange(event) {
        const brandId = event.target.value;
        const isChecked = event.target.checked;

        if (isChecked) {
            if (!this.currentFilters.brands.includes(brandId)) {
                this.currentFilters.brands.push(brandId);
            }
        } else {
            this.currentFilters.brands = this.currentFilters.brands.filter(b => b !== brandId);
        }

        // Don't load products immediately - wait for apply button
        console.log('Brand filter updated:', this.currentFilters.brands);
    }

    handleRatingFilterChange(event) {
        const rating = parseInt(event.target.value);
        const isChecked = event.target.checked;

        if (isChecked) {
            if (!this.currentFilters.ratings.includes(rating)) {
                this.currentFilters.ratings.push(rating);
            }
        } else {
            this.currentFilters.ratings = this.currentFilters.ratings.filter(r => r !== rating);
        }

        // Don't load products immediately - wait for apply button
        console.log('Rating filter updated:', this.currentFilters.ratings);
    }

    handleSortChange(event) {
        this.currentFilters.sort = event.target.value;
        // Load products immediately when sort changes
        this.currentPage = 0;
        this.loadProducts();
    }

    applyFilters() {
        this.currentPage = 0;
        this.loadProducts();
    }

    clearFilters() {
        this.currentFilters = {
            search: '',
            minPrice: null,
            maxPrice: null,
            brands: [],
            ratings: [],
            sort: ''
        };

        // Reset form elements
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) priceRangeSelect.value = '';

        const brandCheckboxes = document.querySelectorAll('#brandFilters input[type="checkbox"]');
        brandCheckboxes.forEach(checkbox => checkbox.checked = false);

        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][value^="rating"], input[type="checkbox"][id^="rating"]');
        ratingCheckboxes.forEach(checkbox => checkbox.checked = false);

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.value = '';

        this.currentPage = 0;
        this.loadProducts();
    }

    async loadProducts() {
        console.log('Loading newest products...');
        this.showLoading();

        try {
            // Use sort from currentFilters, fallback to sortSelect value, then default
            let sortValue = this.currentFilters.sort;
            if (!sortValue) {
                const sortSelect = document.getElementById('sortSelect');
                sortValue = sortSelect ? sortSelect.value : 'created,desc';
            }
            const [sortBy, sortDir] = sortValue.split(',');

            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize,
                sortBy: sortBy,
                sortDir: sortDir
            });

            // Add filters
            if (this.currentFilters.minPrice !== null && this.currentFilters.minPrice !== '') {
                params.append('minPrice', this.currentFilters.minPrice);
            }
            if (this.currentFilters.maxPrice !== null && this.currentFilters.maxPrice !== '') {
                params.append('maxPrice', this.currentFilters.maxPrice);
            }
            if (this.currentFilters.brands.length > 0) {
                params.append('brands', this.currentFilters.brands.join(','));
            }
            if (this.currentFilters.ratings.length > 0) {
                params.append('ratings', this.currentFilters.ratings.join(','));
            }

            console.log('Loading products with params:', params.toString());
            const response = await fetch(`/api/products/newest-advanced?${params}`);
            console.log('Newest products API response:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Newest products API data:', data);
            console.log('Data code:', data.code);
            console.log('Data result:', data.result);

            if (data.code === 1000 && data.result) {
                this.products = data.result.content || [];
                this.totalElements = data.result.totalElements || 0;
                this.totalPages = data.result.totalPages || 0;
                console.log('Loaded newest products:', this.products.length, 'Total:', this.totalElements);
                console.log('Products array:', this.products);
                this.renderProducts();
                this.updatePagination();
                this.updateResultsCount();
            } else {
                console.log('API error:', data.message);
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading newest products:', error);
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    renderProducts() {
        console.log('renderProducts called with', this.products.length, 'products');
        console.log('Products array:', this.products);
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const loadingSpinner = document.getElementById('loadingSpinner');

        console.log('Grid element:', grid);
        console.log('Empty state element:', emptyState);
        console.log('Loading spinner element:', loadingSpinner);

        if (!grid) {
            console.log('Grid element not found');
            return;
        }

        // Hide loading spinner
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        if (this.products.length === 0) {
            console.log('No products - hiding grid and showing empty state');
            grid.style.display = 'none';
            grid.innerHTML = ''; // Clear grid content
            if (emptyState) {
                emptyState.style.display = 'block';
            }

            // Update empty state message based on filters
            const hasFilters = this.hasActiveFilters();
            if (hasFilters) {
                if (emptyState) {
                    emptyState.innerHTML = `
                        <i class="fas fa-filter fa-3x text-muted mb-3"></i>
                        <h4>Không tìm thấy sản phẩm phù hợp</h4>
                        <p class="text-muted">Thử thay đổi bộ lọc hoặc chọn khoảng giá khác</p>
                        <button class="btn btn-outline-primary" onclick="window.newestProductsPageManager.clearFilters()">
                            <i class="fas fa-times me-2"></i>Xóa bộ lọc
                        </button>
                    `;
                }
            } else {
                if (emptyState) {
                    emptyState.innerHTML = `
                        <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                        <h4>Không có sản phẩm nào</h4>
                        <p class="text-muted">Hiện chưa có sản phẩm mới nhất</p>
                    `;
                }
            }
            return;
        }

        console.log('Rendering products - clearing grid first');
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        grid.innerHTML = ''; // Clear grid content first
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '0.8rem';
        grid.style.padding = '2rem 1rem';
        grid.style.width = '100%';
        grid.style.maxWidth = '2500px';
        grid.style.margin = '0 auto';
        grid.style.justifyContent = 'stretch';

        console.log('Creating product cards...');
        const html = this.products.map(product => {
            try {
                console.log('Creating card for product:', product.name);
                return this.createProductCard(product);
            } catch (error) {
                console.error('Error creating card for product:', product.name, error);
                return `<div class="error-card">Error loading product: ${product.name}</div>`;
            }
        }).join('');

        console.log('Generated HTML length:', html.length);
        grid.innerHTML = html;
        console.log('Grid updated with', this.products.length, 'products');

        console.log('Products rendered:', this.products.length);
        console.log('Grid element:', grid);
        console.log('Grid computed style:', window.getComputedStyle(grid).display);
    }

    hasActiveFilters() {
        return this.currentFilters.minPrice !== null ||
            this.currentFilters.maxPrice !== null ||
            this.currentFilters.brands.length > 0 ||
            this.currentFilters.ratings.length > 0 ||
            this.currentFilters.search !== '';
    }

    createProductCard(product) {
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);
        const statusText = this.getProductStatusText(productStatus);

        return `
            <div class="product-card ${statusClass}">
                    <div class="position-relative">
                        <img src="${product.mainImageUrl || '/user/img/default-product.jpg'}" 
                             class="card-img-top" 
                             alt="${product.name}"
                             onerror="this.src='/user/img/default-product.jpg'">
                        
                    <!-- Product Status Badge - Removed to avoid overlapping with image -->
                        
                        <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="window.newestProductsPageManager.showQuickView(${product.productId})"
                                    title="Xem nhanh">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title" title="${product.name}">
                            <a href="/product/${product.productId}?from=newest" class="text-decoration-none text-dark product-name-link">
                                ${product.name}
                            </a>
                        </h6>
                        
                        <p class="brand-name">
                            <a href="/brand/${product.brandId}" class="text-decoration-none text-muted brand-link">
                                ${product.brandName || 'Thương hiệu'}
                            </a>
                        </p>
                        
                        <div class="rating">
                            <span class="stars">
                                ${this.generateStars(product.averageRating || 0, product.reviewCount || 0)}
                            </span>
                            <span class="review-count">(${product.reviewCount || 0})</span>
                        </div>
                    
                    <!-- Sales Progress Bar -->
                    <div class="sales-progress mb-3">
                        <div class="sales-info d-flex justify-content-between align-items-center mb-1">
                            <span class="sales-label">Đã bán</span>
                            <span class="sales-count">${this.formatNumber(product.soldCount || 0)}</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" 
                                 style="width: ${this.calculateSalesProgress(product.soldCount || 0)}%"
                                 role="progressbar">
                        </div>
                        </div>
                        </div>
                        
                        <div class="mt-auto">
                            <div class="price-section d-flex justify-content-between align-items-center">
                                <span class="current-price">
                                    ${this.formatPrice(product.price)}
                                </span>
                                <button class="add-to-cart-icon ${productStatus !== 'available' ? 'disabled' : ''}" 
                                    data-product-id="${product.productId}"
                                    data-product-name="${product.name}"
                                        data-product-price="${product.price}"
                                        ${productStatus !== 'available' ? 'disabled' : ''}
                                        title="${productStatus === 'out_of_stock' ? 'Hết hàng' :
                productStatus === 'deactivated' ? 'Ngừng kinh doanh' : 'Thêm vào giỏ'}"
                                        onclick="window.newestProductsPageManager.addToCart(${product.productId}, '${product.name}', ${product.price})">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(product) {
        // Product status validation

        // 1. Kiểm tra ngừng kinh doanh (ưu tiên cao nhất)
        if (!product.isActive) {
            return 'deactivated';
        }

        // 2. Kiểm tra hết hàng (chỉ khi sản phẩm còn active)
        if (product.stock <= 0) {
            return 'out_of_stock';
        }

        // 3. Sản phẩm có sẵn
        return 'available';
    }

    getProductStatusClass(product) {
        const status = this.getProductStatus(product);
        switch (status) {
            case 'deactivated':
                return 'product-deactivated';
            case 'out_of_stock':
                return 'product-out-of-stock';
            case 'available':
            default:
                return 'product-available';
        }
    }

    getProductStatusText(status) {
        switch (status) {
            case 'deactivated':
                return 'Ngừng kinh doanh';
            case 'out_of_stock':
                return 'Hết hàng';
            case 'available':
            default:
                return 'Có sẵn';
        }
    }

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        console.log('getProductStatusBadge called with status:', status);

        switch (status) {
            case 'deactivated':
                console.log('Returning deactivated badge');
                return '<span class="badge bg-warning text-dark">Ngừng kinh doanh</span>';
            case 'out_of_stock':
                console.log('Returning out of stock badge');
                return '<span class="badge bg-danger">Hết hàng</span>';
            default:
                console.log('Returning available badge');
                return '<span class="badge bg-success">Còn hàng</span>';
        }
    }

    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    generateStars(rating, reviewCount = 0) {
        // Logic đúng cho product card - giống generateStarsForModal
        // Chỉ hiển thị sao rỗng khi rating = 0 hoặc không có rating
        if (!rating || rating === 0 || rating === '0' || rating === null || rating === undefined) {
            let stars = '';
            for (let i = 0; i < 5; i++) {
                stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
            }
            return stars;
        }

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star text-warning"></i>';
        }
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star text-warning"></i>';
        }
        return stars;
    }

    formatPrice(price) {
        if (!price || price === null || price === undefined) {
            return '0 ₫';
        }

        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) {
            return '0 ₫';
        }

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numPrice);
    }

    calculateSalesProgress(soldCount) {
        // Define different thresholds for progress calculation - optimized for better visual appeal
        const thresholds = [
            { max: 50, percentage: 30 },     // 0-50: 0-30% (tăng từ 20%)
            { max: 100, percentage: 40 },    // 50-100: 30-40%
            { max: 500, percentage: 55 },   // 100-500: 40-55%
            { max: 1000, percentage: 70 },   // 500-1000: 55-70%
            { max: 5000, percentage: 85 },   // 1000-5000: 70-85%
            { max: 10000, percentage: 95 },  // 5000-10000: 85-95%
            { max: Infinity, percentage: 100 } // >10000: 95-100%
        ];

        for (const threshold of thresholds) {
            if (soldCount <= threshold.max) {
                // Get previous threshold percentage
                const prevThreshold = thresholds[thresholds.indexOf(threshold) - 1];
                const basePercentage = prevThreshold ? prevThreshold.percentage : 0;

                // Calculate progress within this threshold
                const prevMax = prevThreshold ? prevThreshold.max : 0;
                const range = threshold.max - prevMax;
                const progress = ((soldCount - prevMax) / range) * (threshold.percentage - basePercentage);

                return Math.min(100, basePercentage + progress);
            }
        }

        return 100; // For very high sales
    }

    showLoading() {
        const loading = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');
        const empty = document.getElementById('emptyState');

        if (loading) loading.style.display = 'block';
        if (grid) grid.style.display = 'none';
        if (empty) empty.style.display = 'none';
    }

    hideLoading() {
        const loading = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');

        if (loading) loading.style.display = 'none';
        if (grid) grid.style.display = 'block';
    }

    showEmptyState() {
        const loading = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');
        const empty = document.getElementById('emptyState');

        if (loading) loading.style.display = 'none';
        if (grid) grid.style.display = 'none';
        if (empty) empty.style.display = 'block';

        this.updateResultsCount();
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `${this.totalElements || this.products.length} sản phẩm`;
        }
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';
        const paginationList = pagination.querySelector('.pagination');
        if (!paginationList) return;

        let paginationHTML = '';

        // Previous button
        const prevDisabled = this.currentPage === 0 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" onclick="window.newestProductsPageManager.goToPage(${this.currentPage - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            paginationHTML += `
                <li class="page-item ${activeClass}">
                    <a class="page-link" href="#" onclick="window.newestProductsPageManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="window.newestProductsPageManager.goToPage(${this.currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationList.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        this.currentPage = page;
        this.loadProducts();
    }

    async loadBrands() {
        try {
            console.log('Loading brands for newest products...');

            // Load both brands and counts, then combine them
            const [brandsResponse, countsResponse] = await Promise.all([
                fetch('/api/products/newest-brands'),
                fetch('/api/products/newest-brands-with-count')
            ]);

            let brands = [];
            let brandCounts = {};

            // Get brands with IDs
            if (brandsResponse.ok) {
                const brandsData = await brandsResponse.json();
                if (brandsData.code === 1000 && brandsData.result) {
                    brands = brandsData.result;
                    console.log('Loaded brands with IDs:', brands);
                }
            }

            // Get brand counts
            if (countsResponse.ok) {
                const countsData = await countsResponse.json();
                if (countsData.code === 1000 && countsData.result) {
                    brandCounts = countsData.result;
                    console.log('Loaded brand counts:', brandCounts);
                }
            }

            // Combine brands with counts
            if (brands.length > 0) {
                this.displayBrandFiltersWithCountAndIds(brands, brandCounts);
                return;
            }

            // Fallback: try newest brands API only
            console.log('Trying fallback: newest brands');
            const response = await fetch('/api/products/newest-brands');
            if (response.ok) {
                const data = await response.json();
                if (data.code === 1000 && data.result) {
                    console.log('Using newest brands:', data.result);
                    this.displayBrandFilters(data.result);
                    return;
                }
            }

            // Final fallback: load all brands from admin API
            console.log('Trying final fallback: load all brands');
            const fallbackResponse = await fetch('/admin/api/brands/all');
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                console.log('Fallback brands data:', fallbackData);
                if (fallbackData.code === 1000 && fallbackData.result) {
                    console.log('Using fallback brands:', fallbackData.result);
                    this.displayBrandFilters(fallbackData.result);
                    return;
                }
            }

            console.error('All brand loading attempts failed');
            this.displayBrandFilters([]);
        } catch (error) {
            console.error('Error loading brands:', error);
            document.getElementById('brandFilters').innerHTML = '<p class="text-muted">Lỗi khi tải thương hiệu</p>';
        }
    }

    displayBrandFilters(brands) {
        console.log('displayBrandFilters called with brands:', brands);
        const brandFilters = document.getElementById('brandFilters');
        console.log('brandFilters element:', brandFilters);
        if (!brandFilters) {
            console.log('brandFilters element not found');
            return;
        }

        if (brands.length === 0) {
            console.log('No brands to display');
            brandFilters.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>';
            return;
        }

        console.log('Creating brand HTML for', brands.length, 'brands');
        const brandHTML = brands.map(brand => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brand.brandId}" id="brand-${brand.brandId}">
                <label class="form-check-label" for="brand-${brand.brandId}">
                    ${brand.brandName || brand.name} (${brand.productCount || 0})
                </label>
            </div>
        `).join('');

        brandFilters.innerHTML = brandHTML;
        console.log('Brand filters updated');
    }

    displayBrandFiltersWithCount(brandCounts) {
        const brandFilters = document.getElementById('brandFilters');
        if (!brandFilters) return;

        if (Object.keys(brandCounts).length === 0) {
            brandFilters.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>';
            return;
        }

        const brandHTML = Object.entries(brandCounts).map(([brandName, count]) => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brandName}" id="brand-${brandName}">
                <label class="form-check-label" for="brand-${brandName}">
                    ${brandName} (${count})
                </label>
            </div>
        `).join('');

        brandFilters.innerHTML = brandHTML;
    }

    displayBrandFiltersWithCountAndIds(brands, brandCounts) {
        const brandFilters = document.getElementById('brandFilters');
        if (!brandFilters) return;

        if (brands.length === 0) {
            brandFilters.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>';
            return;
        }

        const brandHTML = brands.map(brand => {
            const brandName = brand.name || brand.brandName;
            const count = brandCounts[brandName] || 0;
            return `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${brand.brandId}" id="brand-${brand.brandId}">
                    <label class="form-check-label" for="brand-${brand.brandId}">
                        ${brandName} (${count})
                    </label>
                </div>
            `;
        }).join('');

        brandFilters.innerHTML = brandHTML;
    }

    // Quick View Modal Methods
    async showQuickView(productId) {
        const product = this.products.find(p => p.productId === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            return;
        }

        // Load product images if not already loaded
        if (!product.images) {
            try {
                const response = await fetch(`/api/products/${productId}/images`);
                if (response.ok) {
                    const data = await response.json();
                    product.images = data.result || [];
                }
            } catch (error) {
                console.log('Could not load product images:', error);
                product.images = [];
            }
        }

        this.createQuickViewModal(product);
    }

    // Create quick view modal
    createQuickViewModal(product) {
        // Remove existing modal if any
        const existingModal = document.getElementById('quickViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="quickViewModal" tabindex="-1" aria-labelledby="quickViewModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title" id="quickViewModalLabel">Xem nhanh sản phẩm</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- Product Image Slider -->
                                <div class="col-md-6">
                                    <div class="product-image-slider">
                                        <!-- Main Image -->
                                        <div class="main-image-container mb-3">
                                            <button class="slider-nav slider-prev" id="prevBtn">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <img id="mainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="nextBtn">
                                                <i class="fas fa-chevron-right"></i>
                                            </button>
                                        </div>
                                        
                                        <!-- Thumbnail Slider -->
                                        <div class="thumbnail-slider">
                                            <div class="thumbnail-container d-flex gap-2">
                                                ${this.generateImageThumbnails(product)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Product Info -->
                                <div class="col-md-6">
                                    <h4 class="product-name mb-3">
                                        <a href="/product/${product.productId}" class="text-decoration-none text-dark">
                                            ${product.name}
                                        </a>
                                    </h4>
                                    <p class="brand-name text-muted mb-2">${product.brandName || 'Thương hiệu'}</p>
                                    
                                    <!-- Product Status -->
                                    <div class="product-status mb-3">
                                        ${this.getProductStatusBadge(product)}
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${product.productId}</span>
                                    </div>
                                    
                                    <!-- Rating -->
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.generateStarsForModal(product.averageRating || 0, product.reviewCount || 0)}
                                        </span>
                                        <span class="review-count ms-2">(${product.reviewCount || 0} đánh giá)</span>
                                    </div>
                                    
                                    <!-- Sales Progress -->
                                    <div class="sales-progress mb-3">
                                        <div class="sales-info d-flex justify-content-between align-items-center mb-1">
                                            <span class="sales-label">Đã bán</span>
                                            <span class="sales-count">${this.formatNumber(product.soldCount || 0)}</span>
                                        </div>
                                        <div class="progress">
                                            <div class="progress-bar" 
                                                 style="width: ${this.calculateSalesProgress(product.soldCount || 0)}%"
                                                 role="progressbar">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Price -->
                                    <div class="price-section mb-4">
                                        <span class="current-price h4 text-primary">
                                            ${this.formatPrice(product.price)}
                                        </span>
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsPageManager.decrementQuantity()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput" onchange="window.newestProductsPageManager.validateQuantity()" oninput="window.newestProductsPageManager.validateQuantity()" onblur="window.newestProductsPageManager.validateQuantityOnBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsPageManager.incrementQuantity()">+</button>
            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quantityError" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="quantityErrorMessage">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    ${this.getQuickViewActions(product)}
                                    
                                    <!-- View Details Button -->
                                    <div class="mt-3">
                                        <a href="/product/${product.productId}" 
                                           class="btn btn-outline-primary btn-lg w-100">
                                            <i class="fas fa-info-circle me-2"></i>
                                            Xem chi tiết sản phẩm
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
        modal.show();

        // Add slider navigation event listeners
        this.setupSliderNavigation(product);

        // Remove modal from DOM when hidden
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('productsGrid')) {
        window.newestProductsPageManager = new NewestProductsPageManager();
        window.newestProductsPageManager.init();
    }
});
