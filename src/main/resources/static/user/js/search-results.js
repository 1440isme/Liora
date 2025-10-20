class SearchResultsManager {
    constructor() {
        console.log('SearchResultsManager constructor called');
        this.currentQuery = '';
        this.currentPage = 0;
        this.pageSize = 12;
        this.currentSort = 'relevance';
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

        this.initialize();
    }

    initialize() {
        console.log('SearchResultsManager initialize() called');
        try {
            // Parse URL parameters
            this.parseUrlParameters();

            // Initialize event listeners
            this.initializeEventListeners();

            // Load brands
            this.loadBrands();

            // Load initial results
            this.loadSearchResults();
        } catch (error) {
            console.error('Error in initialize():', error);
        }
    }

    parseUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentQuery = urlParams.get('q') || '';

        // Update display
        const searchQueryDisplay = document.getElementById('searchQueryDisplay');
        if (searchQueryDisplay) {
            searchQueryDisplay.textContent = this.currentQuery;
        }
    }

    initializeEventListeners() {
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
        console.log('Price filter updated:', this.currentFilters.minPrice, this.currentFilters.maxPrice);
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
        this.currentPage = 0;
        console.log('Sort changed:', this.currentFilters.sort);
        this.loadSearchResults();
    }

    applyFilters() {
        this.currentPage = 0;
        this.loadSearchResults();
    }

    async loadSearchResults() {
        console.log('Loading search results...');
        this.showLoading();

        try {
            const sortSelect = document.getElementById('sortSelect');
            const sortValue = sortSelect ? sortSelect.value : '';
            let sortBy = '';
            let sortDir = '';

            if (sortValue && sortValue !== '') {
                const [field, direction] = sortValue.split(',');
                sortBy = field;
                sortDir = direction;
                console.log('Sort selected:', sortBy, sortDir);
            } else {
                console.log('No sort selected');
            }

            const params = new URLSearchParams({
                q: this.currentQuery,
                page: this.currentPage,
                size: this.pageSize
            });

            // Chỉ thêm sort parameters khi có giá trị
            if (sortBy && sortBy !== '') {
                params.append('sortBy', sortBy);
                if (sortDir && sortDir !== '') {
                    params.append('sortDir', sortDir);
                }
            }

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

            console.log('Loading search results with params:', params.toString());
            const response = await fetch(`/api/products/search?${params.toString()}`);
            console.log('Search API response:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Search API data:', data);

            if (data.code === 1000 && data.result) {
                this.products = data.result.content || [];
                this.totalElements = data.result.totalElements || 0;
                this.totalPages = data.result.totalPages || 0;
                console.log('Loaded search results:', this.products.length, 'Total:', this.totalElements);
                this.renderProducts();
                this.updatePagination();
                this.updateResultsCount();
            } else {
                console.log('API error:', data.message);
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading search results:', error);
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    renderProducts() {
        console.log('renderProducts called with', this.products.length, 'products');
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        const loadingSpinner = document.getElementById('loadingSpinner');

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
                        <button class="btn btn-outline-primary" onclick="window.searchResultsManager.clearFilters()">
                            <i class="fas fa-times me-2"></i>Xóa bộ lọc
                        </button>
                    `;
                }
            } else {
                if (emptyState) {
                    emptyState.innerHTML = `
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h4>Không tìm thấy sản phẩm</h4>
                        <p class="text-muted">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
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
                             onerror="this.src='/user/img/default-product.jpg'"
                             onclick="window.location.href='/product/${product.productId}?from=search'"
                             style="cursor: pointer;">
                        
                    <!-- Product Status Badge - Removed to avoid overlapping with image -->
                        
                        <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="window.searchResultsManager.showQuickView(${product.productId})"
                                    title="Xem nhanh">
                                <i class="fas fa-eye"></i>
                            </button>
                    </div>
                </div>
                    
                <div class="card-body d-flex flex-column">
                        <h6 class="card-title" title="${product.name}">
                            <a href="/product/${product.productId}?from=search" class="text-decoration-none text-dark product-name-link">
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
                                        onclick="window.searchResultsManager.addToCart(${product.productId}, '${product.name}', ${product.price})">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getProductStatus(product) {
        // Debug: Log giá trị để kiểm tra
        console.log('Product status debug:', {
            productId: product.productId,
            name: product.name,
            isActive: product.isActive,
            available: product.available,
            stock: product.stock
        });

        // 1. Kiểm tra ngừng kinh doanh (ưu tiên cao nhất)
        if (!product.isActive) {
            console.log('Product is deactivated:', product.name);
            return 'deactivated';
        }

        // 2. Kiểm tra hết hàng (chỉ khi sản phẩm còn active)
        if (product.stock <= 0) {
            console.log('Product is out of stock:', product.name);
            return 'out_of_stock';
        }

        // 3. Sản phẩm có sẵn
        console.log('Product is available:', product.name);
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
                <a class="page-link" href="#" onclick="window.searchResultsManager.goToPage(${this.currentPage - 1}); return false;">
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
                    <a class="page-link" href="#" onclick="window.searchResultsManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        paginationHTML += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="window.searchResultsManager.goToPage(${this.currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
                </li>
            `;

        paginationList.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        this.currentPage = page;
        this.loadSearchResults();
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `${this.totalElements || this.products.length} sản phẩm`;
        }
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
        this.loadSearchResults();
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

    showError() {
        const loading = document.getElementById('loadingSpinner');
        const grid = document.getElementById('productsGrid');
        const empty = document.getElementById('emptyState');

        if (loading) loading.style.display = 'none';
        if (grid) grid.style.display = 'none';
        if (empty) {
            empty.style.display = 'block';
            empty.innerHTML = `
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h4 class="text-danger">Có lỗi xảy ra</h4>
            <p class="text-muted">Vui lòng thử lại sau</p>
        `;
        }
    }

    async loadBrands() {
        try {
            console.log('Loading brands for search results...');

            // Use search brands API with query parameter
            const url = this.currentQuery ? 
                `/api/products/search-brands?q=${encodeURIComponent(this.currentQuery)}` : 
                '/api/products/search-brands';
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                console.log('Search brands API response:', data);
                if (data.code === 1000 && data.result) {
                    console.log('Using search brands:', data.result);
                    this.displayBrandFilters(data.result);
                    return;
                }
            }

            console.error('Search brands API failed');
            this.displayBrandFilters([]);
        } catch (error) {
            console.error('Error loading brands:', error);
            const brandFilters = document.getElementById('brandFilters');
            if (brandFilters) {
                brandFilters.innerHTML = '<p class="text-muted">Lỗi khi tải thương hiệu</p>';
            }
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
                    ${brand.name}
                </label>
            </div>
        `).join('');

        brandFilters.innerHTML = brandHTML;
        console.log('Brand filters updated');
    }

    // Add to cart from product card
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
    } đã được thêm vào giỏ hàng!`, 'success');
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

    // Show notification
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
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.searchResultsManager.decrementQuantity()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput" onchange="window.searchResultsManager.validateQuantity()" oninput="window.searchResultsManager.validateQuantity()" onblur="window.searchResultsManager.validateQuantityOnBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.searchResultsManager.incrementQuantity()">+</button>
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

    // Generate stars for modal
    generateStarsForModal(rating, reviewCount = 0) {
        console.log('generateStarsForModal called with rating:', rating, 'reviewCount:', reviewCount);

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

    // Get product status badge
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
                            onclick="window.searchResultsManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="window.searchResultsManager.addToCartWithQuantity(${product.productId})">
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

    // Buy now - add to cart and redirect to checkout
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('productsGrid')) {
        window.searchResultsManager = new SearchResultsManager();
        console.log('SearchResultsManager instance created');
    }
});

