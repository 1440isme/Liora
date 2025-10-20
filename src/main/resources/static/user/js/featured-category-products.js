/**
 * Featured Category Products Management
 * Handles product listing for featured categories (level 1 categories)
 * Shows all products from level 3 child categories
 */
class FeaturedCategoryProductsManager {
    constructor() {
        this.currentCategoryId = null;
        this.currentPage = 0;
        this.pageSize = 12;
        this.currentFilters = {
            search: '',
            minPrice: null,
            maxPrice: null,
            brands: [],
            categories: [],
            ratings: [],
            sort: ''
        };
        this.products = [];
        this.totalElements = 0;
        this.totalPages = 0;
    }

    init() {
        try {
            this.getCategoryIdFromUrl();
            this.bindEvents();
            this.loadCategoryInfo();
            this.loadLevel3Categories();
            this.loadBrands();
            this.loadProducts();
        } catch (error) {
            console.error('Error in init():', error);
        }
    }

    getCategoryIdFromUrl() {
        const path = window.location.pathname;
        const match = path.match(/\/featured-category\/(\d+)/);
        this.currentCategoryId = match ? parseInt(match[1]) : null;

        if (!this.currentCategoryId) {
            console.error('Category ID not found in URL');
            this.showLoading(false);
            this.showEmptyState('Danh mục không tồn tại');
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

        // Category filters
        const categoryFilters = document.getElementById('categoryFilters');
        if (categoryFilters) {
            categoryFilters.addEventListener('change', this.handleCategoryFilterChange.bind(this));
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
    }

    async loadCategoryInfo() {
        if (!this.currentCategoryId) return;

        try {
            const response = await fetch(`/api/products/categories/${this.currentCategoryId}`);
            const data = await response.json();

            if (data.code === 1000 && data.result) {
                // Check if category is active
                if (data.result.isActive === false || data.result.isActive === null) {
                    this.showCategoryUnavailable(data.result.name);
                    return;
                }

                const categoryName = data.result.name;
                document.title = `${categoryName} - Liora`;

                const titleElement = document.querySelector('.page-title');
                if (titleElement) {
                    titleElement.textContent = categoryName;
                }
            }
        } catch (error) {
            console.error('Error loading category info:', error);
        }
    }

    async loadLevel3Categories() {
        if (!this.currentCategoryId) return;

        try {
            const response = await fetch(`/api/products/categories/${this.currentCategoryId}/level3-categories`);
            const data = await response.json();

            if (data.code === 1000 && data.result) {
                this.displayLevel3Categories(data.result);
            }
        } catch (error) {
            console.error('Error loading level 3 categories:', error);
        }
    }

    displayLevel3Categories(categories) {
        const container = document.getElementById('categoryFilters');
        if (!container) return;

        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted small">Không có loại sản phẩm</p>';
            return;
        }

        const html = categories.map(category => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${category.categoryId}" id="category${category.categoryId}">
                <label class="form-check-label" for="category${category.categoryId}">
                    ${category.categoryName}
                </label>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async loadBrands() {
        if (!this.currentCategoryId) return;

        try {
            const response = await fetch(`/api/products/categories/${this.currentCategoryId}/brands-with-count`);
            const data = await response.json();

            if (data.code === 1000 && data.result) {
                this.displayBrands(data.result);
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    displayBrands(brands) {
        const container = document.getElementById('brandFilters');
        if (!container) return;

        if (Object.keys(brands).length === 0) {
            container.innerHTML = '<p class="text-muted small">Không có thương hiệu</p>';
            return;
        }

        const html = Object.keys(brands)
            .sort((a, b) => a.localeCompare(b))
            .map(brandName => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${brandName}" id="brand${brandName.replace(/\s+/g, '')}">
                    <label class="form-check-label" for="brand${brandName.replace(/\s+/g, '')}">
                        ${brandName}
                    </label>
                </div>
            `).join('');

        container.innerHTML = html;
    }

    async loadProducts() {
        if (!this.currentCategoryId) return;

        this.showLoading(true);

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize,
                includeChildren: true // Include all child categories
            });

            // Add filters
            if (this.currentFilters.minPrice) {
                params.append('minPrice', this.currentFilters.minPrice);
            }
            if (this.currentFilters.maxPrice) {
                params.append('maxPrice', this.currentFilters.maxPrice);
            }
            if (this.currentFilters.brands && this.currentFilters.brands.length > 0) {
                params.append('brands', this.currentFilters.brands.join(','));
            }
            if (this.currentFilters.categories && this.currentFilters.categories.length > 0) {
                params.append('categories', this.currentFilters.categories.join(','));
            }
            if (this.currentFilters.ratings && this.currentFilters.ratings.length > 0) {
                params.append('ratings', this.currentFilters.ratings.join(','));
            }
            if (this.currentFilters.sort) {
                const [sortBy, sortDir] = this.currentFilters.sort.split(',');
                if (sortBy && sortDir) {
                    params.append('sortBy', sortBy);
                    params.append('sortDir', sortDir);
                }
            }

            const fullUrl = `/api/products/category/${this.currentCategoryId}?${params}`;
            const response = await fetch(fullUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.code === 1000) {
                this.products = data.result.content || [];
                this.totalElements = data.result.totalElements || 0;
                this.totalPages = data.result.totalPages || 0;

                this.showLoading(false);
            } else {
                console.log('API error:', data.message);
                this.showLoading(false);
                this.showEmptyState('Không tìm thấy sản phẩm');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showLoading(false);
            this.showEmptyState('Có lỗi xảy ra khi tải sản phẩm');
        } finally {
            this.renderProducts();
            this.updateResultsInfo();
            this.updatePagination();
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        if (!grid) {
            console.log('Grid element not found');
            return;
        }

        if (this.products.length === 0) {
            grid.style.display = 'none';
            grid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }
        grid.innerHTML = '';
        grid.style.display = 'block';

        const html = this.products.map(product => this.createProductCard(product)).join('');
        grid.innerHTML = html;

        // Trigger rating load sau khi render xong
        setTimeout(() => {
            if (window.loadProductRatings) {
                window.loadProductRatings();
            }
        }, 500);
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
                         onerror="this.src='/user/img/default-product.jpg'"
                         onclick="window.location.href='/product/${product.productId}'"
                         style="cursor: pointer;">
                    
                    <!-- Product Status Badge - Removed to avoid overlapping with image -->
                    
                    <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="window.featuredCategoryProductsManager.showQuickView(${product.productId})"
                                title="Xem nhanh">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title" title="${product.name}">
                        <a href="/product/${product.productId}?from=featured-category" class="text-decoration-none text-dark product-name-link">
                            ${product.name}
                        </a>
                    </h6>
                    
                    <p class="brand-name">
                        <a href="/brand/${product.brandId}" class="text-decoration-none text-muted brand-link">
                            ${product.brandName || 'Thương hiệu'}
                        </a>
                    </p>
                    
                    <!-- Rating sẽ được load bởi ProductRatingUtils -->
                    <div class="product-rating" data-product-id="${product.productId}">
                        <div class="star-rating">
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star empty">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                        </div>
                        <span class="rating-count">(0)</span>
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
                                onclick="window.featuredCategoryProductsManager.addToCart(${product.productId}, '${product.name}', ${product.price})">
                                <i class="fas fa-shopping-cart"></i>
                    </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(product) {
        if (!product.isActive) {
            return 'deactivated';
        }
        if (product.stock <= 0) {
            return 'out_of_stock';
        }
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

    generateStars(rating, reviewCount = 0) {
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

    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    calculateSalesProgress(soldCount) {
        const thresholds = [
            { max: 50, percentage: 30 },
            { max: 100, percentage: 40 },
            { max: 500, percentage: 55 },
            { max: 1000, percentage: 70 },
            { max: 5000, percentage: 85 },
            { max: 10000, percentage: 95 },
            { max: Infinity, percentage: 100 }
        ];

        for (const threshold of thresholds) {
            if (soldCount <= threshold.max) {
                const prevThreshold = thresholds[thresholds.indexOf(threshold) - 1];
                const basePercentage = prevThreshold ? prevThreshold.percentage : 0;
                const prevMax = prevThreshold ? prevThreshold.max : 0;
                const range = threshold.max - prevMax;
                const progress = ((soldCount - prevMax) / range) * (threshold.percentage - basePercentage);
                return Math.min(100, basePercentage + progress);
            }
        }
        return 100;
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
    }

    handleCategoryFilterChange(event) {
        const categoryId = event.target.value;
        const isChecked = event.target.checked;

        if (isChecked) {
            if (!this.currentFilters.categories.includes(categoryId)) {
                this.currentFilters.categories.push(categoryId);
            }
        } else {
            this.currentFilters.categories = this.currentFilters.categories.filter(c => c !== categoryId);
        }
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
    }

    handleSortChange(event) {
        this.currentFilters.sort = event.target.value;
        this.currentPage = 0;
        this.loadProducts();
    }

    applyFilters() {
        this.currentPage = 0;
        this.loadProducts();
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
                <a class="page-link" href="#" onclick="window.featuredCategoryProductsManager.goToPage(${this.currentPage - 1}); return false;">
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
                    <a class="page-link" href="#" onclick="window.featuredCategoryProductsManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="window.featuredCategoryProductsManager.goToPage(${this.currentPage + 1}); return false;">
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

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        if (show) {
            if (spinner) spinner.style.display = 'block';
            if (grid) grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'none';
        } else {
            if (spinner) spinner.style.display = 'none';
        }
    }

    showEmptyState(message) {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');

        if (grid) grid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <h4>Không tìm thấy sản phẩm</h4>
                <p class="text-muted">${message}</p>
            `;
        }
    }

    updateResultsInfo() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Hiển thị ${this.totalElements} sản phẩm`;
        }
    }

    async addToCart(productId, productName, price) {
        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, 1, true);
                await window.app.refreshCartBadge?.();
            } else {
                this.showNotification('Chức năng đang được tải...', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
        `;

        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // Quick View Methods
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

    // Create quick view modal - sử dụng chuẩn từ main.js
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
                                            <button class="slider-nav slider-prev" id="quickViewPrevBtn">
                                                <i class="mdi mdi-chevron-left"></i>
                                            </button>
                                            <img id="mainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="quickViewNextBtn">
                                                <i class="mdi mdi-chevron-right"></i>
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
                                    <p class="brand-name text-muted mb-2">${product.brand || product.brandName || 'N/A'}</p>
                                    
                                    <!-- Product Status -->
                                    <div class="product-status mb-3">
                                        <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
                                            ${product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}
                                        </span>
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${product.productId || 'N/A'}</span>
                                    </div>
                                    
                                    <!-- Rating -->
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.renderStars(product.rating || product.averageRating || 0)}
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
                                            ${this.formatCurrency(product.price)}
                                        </span>
                                        ${product.originalPrice ? `<span class="text-muted ms-2"><s>${this.formatCurrency(product.originalPrice)}</s></span>` : ''}
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.featuredCategoryProductsManager.decrementQuantity()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput" onchange="window.featuredCategoryProductsManager.validateQuantity()" oninput="window.featuredCategoryProductsManager.validateQuantity()" onblur="window.featuredCategoryProductsManager.validateQuantityOnBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.featuredCategoryProductsManager.incrementQuantity()">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quantityError" class="text-danger mt-2" style="display: none;">
                                            <i class="mdi mdi-information me-1"></i>
                                            <span id="quantityErrorMessage">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        <!-- Buy Now & Add to Cart Buttons (Same Row) -->
                                        <div class="row g-2">
                                            <div class="col-6">
                                                <button class="btn btn-danger btn-lg w-100" 
                                                        onclick="window.featuredCategoryProductsManager.buyNow(${product.productId})"
                                                        ${product.stock <= 0 ? 'disabled' : ''}>
                                                    <i class="mdi mdi-lightning-bolt me-1"></i>
                                                    ${product.stock > 0 ? 'Mua ngay' : 'Hết hàng'}
                                                </button>
                                            </div>
                                            <div class="col-6">
                                                <button class="btn btn-primary btn-lg w-100" 
                                                        onclick="window.featuredCategoryProductsManager.addToCartWithQuantity(${product.productId})"
                                                        ${product.stock <= 0 ? 'disabled' : ''}>
                                                    <i class="mdi mdi-cart-plus me-1"></i>
                                                    ${product.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- View Details Button -->
                                        <a href="/product/${product.productId}" 
                                           class="btn btn-outline-primary btn-lg">
                                            <i class="mdi mdi-information me-2"></i>
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

        // Add slider navigation event listeners after modal is shown
        setTimeout(() => {
            this.setupSliderNavigation(product);
        }, 100);

        // Remove modal from DOM when hidden
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
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
            images = product.images;
        } else if (product.mainImageUrl) {
            images = [{ imageUrl: product.mainImageUrl }];
        } else {
            images = [{ imageUrl: '/user/img/default-product.jpg' }];
        }

        return images.map((image, index) => `
            <img src="${image.imageUrl || image}" 
                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                 alt="${product.name}"
                 style="width: 60px; height: 60px; object-fit: cover; cursor: pointer; border: 2px solid ${index === 0 ? '#007bff' : 'transparent'}; border-radius: 4px;"
                 onerror="this.src='/user/img/default-product.jpg'">
        `).join('');
    }

    // Setup slider navigation
    setupSliderNavigation(product) {
        const mainImage = document.getElementById('mainProductImage');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const thumbnails = document.querySelectorAll('.thumbnail');

        if (!mainImage || !product.images || product.images.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            return;
        }

        let currentImageIndex = 0;

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

    // Get product status badge
    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        switch (status) {
            case 'deactivated':
                return '<span class="badge bg-warning">Ngừng kinh doanh</span>';
            case 'out_of_stock':
                return '<span class="badge bg-danger">Hết hàng</span>';
            default:
                return '<span class="badge bg-success">Còn hàng</span>';
        }
    }

    // Generate stars for modal
    generateStarsForModal(rating, reviewCount) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let stars = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star text-warning"></i>';
        }

        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt text-warning"></i>';
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star text-warning"></i>';
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
                            onclick="window.featuredCategoryProductsManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                    </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="window.featuredCategoryProductsManager.addToCartWithQuantity(${product.productId})">
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

    // Buy now action - chuẩn từ main.js
    async buyNow(productId) {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        // Get product info for notification
        const product = this.products.find(p => p.productId == productId);

        // Sử dụng buyNowBackend để tick true sản phẩm trong cart
        if (window.app && typeof window.app.buyNowBackend === 'function') {
            try {
                // Close modal trước
                const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
                if (modal) {
                    modal.hide();
                }

                // Sử dụng buyNowBackend để tick true và chuyển checkout
                await window.app.buyNowBackend(productId, quantity);
            } catch (error) {
                console.error('Buy now error:', error);
                this.showNotification('Không thể thực hiện Mua ngay. Vui lòng thử lại.', 'error');
            }
        } else {
            this.showNotification('Chức năng đang được tải...', 'error');
        }
    }

    // Add to cart with quantity
    async addToCartWithQuantity(productId) {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        try {
            // Sử dụng addProductToCartBackend để gọi API backend
            if (window.app && window.app.addProductToCartBackend) {
                await window.app.addProductToCartBackend(productId, quantity, true);
                await window.app.refreshCartBadge?.();
            } else {
                this.showNotification('Chức năng đang được tải...', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Simple notification - you can enhance this
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Show category unavailable message
    showCategoryUnavailable(categoryName) {
        const container = document.querySelector('.container-fluid .row');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <div class="error-icon mb-4">
                        <i class="fas fa-exclamation-triangle fa-4x text-warning"></i>
                    </div>
                    <h2 class="text-danger mb-3">Danh mục tạm ngưng hoạt động</h2>
                    <p class="text-muted mb-4">
                        Danh mục "${categoryName}" hiện đang tạm ngưng hoạt động. Vui lòng quay lại sau.
                    </p>
                    <div class="d-flex justify-content-center gap-3">
                        <a href="/" class="btn btn-primary btn-lg">
                            <i class="fas fa-home me-2"></i>
                            Về trang chủ
                        </a>
                        <a href="javascript:history.back()" class="btn btn-outline-secondary btn-lg">
                            <i class="fas fa-arrow-left me-2"></i>
                            Quay lại
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Render stars for rating - chuẩn từ main.js
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="mdi mdi-star text-warning"></i>';
        }

        // Half star
        if (hasHalfStar) {
            starsHTML += '<i class="mdi mdi-star-half text-warning"></i>';
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="mdi mdi-star-outline text-muted"></i>';
        }

        return starsHTML;
    }

    // Format currency - chuẩn từ main.js
    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('productsGrid')) {
        window.featuredCategoryProductsManager = new FeaturedCategoryProductsManager();
        window.featuredCategoryProductsManager.init();
    }
});
