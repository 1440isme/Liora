/**
 * Bestseller Products Page Management
 * Handles product listing for bestseller products with filtering and sorting
 */
class BestsellerProductsPageManager {
    constructor() {
        console.log('BestsellerProductsPageManager constructor called');
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
        this.isLoading = false;
    }

    init() {
        console.log('BestsellerProductsPageManager init() called');
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
        const ratingInputs = document.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', this.handleRatingFilterChange.bind(this));
        });

        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', this.applyFilters.bind(this));
        }

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', this.handleSortChange.bind(this));
        }
    }

    async loadBrands() {
        try {
            const response = await fetch('/api/products/brands');
            const data = await response.json();
            
            if (data.code === 1000 && data.result) {
                this.displayBrandFilters(data.result);
            }
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    async loadBrands() {
        console.log('loadBrands called for bestseller products');
        try {
            // Try to load brands with count first
            const response = await fetch('/api/products/best-selling-brands-with-count');
            console.log('Bestseller brands with count API response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Bestseller brands with count API data:', data);
                if (data.code === 1000 && data.result) {
                    console.log('Displaying brands with count:', data.result);
                    this.displayBrandFiltersWithCount(data.result);
                    return;
                }
            }
            
            // Fallback: try to load brands without count
            console.log('Trying fallback: load brands without count');
            const fallbackResponse = await fetch('/api/products/best-selling-brands');
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                console.log('Fallback brands data:', fallbackData);
                if (fallbackData.code === 1000 && fallbackData.result) {
                    console.log('Using fallback brands:', fallbackData.result);
                    this.displayBrandFilters(fallbackData.result);
                    return;
                }
            }
            
            // Final fallback: try to load all brands
            console.log('Trying final fallback: load all brands');
            const finalFallbackResponse = await fetch('/admin/api/brands/all');
            if (finalFallbackResponse.ok) {
                const finalFallbackData = await finalFallbackResponse.json();
                console.log('Final fallback brands data:', finalFallbackData);
                if (finalFallbackData.code === 1000 && finalFallbackData.result) {
                    console.log('Using final fallback brands:', finalFallbackData.result);
                    this.displayBrandFilters(finalFallbackData.result);
                    return;
                }
            }
            
            console.log('Error loading bestseller brands');
        } catch (error) {
            console.log('Error loading bestseller brands:', error);
        }
    }

    displayBrandFiltersWithCount(brandsWithCount) {
        console.log('displayBrandFiltersWithCount called with brands:', brandsWithCount);
        const brandFilters = document.getElementById('brandFilters');
        if (!brandFilters) {
            console.log('brandFilters element not found!');
            return;
        }

        console.log('brandFilters element found:', brandFilters);
        
        if (!brandsWithCount || Object.keys(brandsWithCount).length === 0) {
            console.log('No brands to display');
            brandFilters.innerHTML = '<div class="text-muted">Không có thương hiệu nào</div>';
            return;
        }

        // Sort brands by name
        const sortedBrands = Object.entries(brandsWithCount)
            .sort(([a], [b]) => a.localeCompare(b));

        const brandHTML = sortedBrands.map(([brandName, count], index) => `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" value="${brandName}" id="brand-${brandName}">
                <label class="form-check-label" for="brand-${brandName}">${brandName} (${count})</label>
            </div>
        `).join('');

        console.log('Generated brand HTML with count:', brandHTML);
        brandFilters.innerHTML = brandHTML;

        // Re-bind events for new brand checkboxes
        brandFilters.addEventListener('change', this.handleBrandFilterChange.bind(this));
        console.log('Brand filters with count displayed successfully');
    }

    displayBrandFilters(brands) {
        console.log('displayBrandFilters called with brands:', brands);
        const brandFilters = document.getElementById('brandFilters');
        if (!brandFilters) {
            console.log('brandFilters element not found!');
            return;
        }

        console.log('brandFilters element found:', brandFilters);
        
        if (!brands || brands.length === 0) {
            console.log('No brands to display');
            brandFilters.innerHTML = '<div class="text-muted">Không có thương hiệu nào</div>';
            return;
        }

        const brandHTML = brands.map(brand => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brand.brandId}" id="brand_${brand.brandId}">
                <label class="form-check-label" for="brand_${brand.brandId}">${brand.name}</label>
            </div>
        `).join('');

        console.log('Generated brand HTML:', brandHTML);
        brandFilters.innerHTML = brandHTML;

        // Re-bind events for new brand checkboxes
        brandFilters.addEventListener('change', this.handleBrandFilterChange.bind(this));
        console.log('Brand filters displayed successfully');
    }

    handlePriceRangeChange(event) {
        const value = event.target.value;
        if (value) {
            const [minPrice, maxPrice] = value.split(',').map(Number);
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
        } else {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
        }
    }

    handleBrandFilterChange(event) {
        console.log('Brand filter changed:', event.target.value, event.target.checked);
        // Just log for now, actual filtering will be handled by applyFilters()
    }

    handleRatingFilterChange(event) {
        const checkedRatings = Array.from(document.querySelectorAll('input[name="rating"]:checked'))
            .map(input => parseInt(input.value));
        this.currentFilters.ratings = checkedRatings;
    }

    handleSortChange(event) {
        this.currentFilters.sort = event.target.value;
        this.currentPage = 0; // Reset to first page
        this.loadProducts();
    }

    applyFilters() {
        console.log('applyFilters called');
        
        // Get filter values
        const priceRange = document.getElementById('priceRange');
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="rating"]');
        
        console.log('Price range value:', priceRange ? priceRange.value : 'not found');
        
        // Update current filters - handle price range
        if (priceRange && priceRange.value && priceRange.value.includes(',')) {
            const [minPrice, maxPrice] = priceRange.value.split(',').map(Number);
            this.currentFilters.minPrice = minPrice;
            this.currentFilters.maxPrice = maxPrice;
            console.log('Price filter set:', { minPrice, maxPrice });
        } else {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
            console.log('No price filter');
        }
        
        // Get selected brands (dynamic) - now using brand names instead of IDs
        const brandCheckboxes = document.querySelectorAll('#brandFilters input[type="checkbox"]');
        this.currentFilters.brands = Array.from(brandCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value); // This will be brand names now
        console.log('Selected brands:', this.currentFilters.brands);
            
        // Get selected ratings
        this.currentFilters.ratings = Array.from(ratingCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => parseInt(cb.value));
        console.log('Selected ratings:', this.currentFilters.ratings);
        
        console.log('Final filters:', this.currentFilters);
        this.currentPage = 0;
        this.loadProducts();
    }

    async loadProducts() {
        if (this.isLoading) return;
        
        console.log('Loading bestseller products...');
        this.isLoading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                size: this.pageSize
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
            if (this.currentFilters.ratings && this.currentFilters.ratings.length > 0) {
                params.append('ratings', this.currentFilters.ratings.join(','));
            }
            if (this.currentFilters.sort) {
                // Split the sort value (format: "name,asc" or "price,desc")
                const [sortBy, sortDir] = this.currentFilters.sort.split(',');
                console.log('Sort parameters:', { sortBy, sortDir });
                if (sortBy && sortDir) {
                    params.append('sortBy', sortBy);
                    params.append('sortDir', sortDir);
                }
            } else {
                console.log('No sort filter applied');
            }

            console.log('Loading products with params:', params.toString());
            console.log('Current filters:', this.currentFilters);
            
            const fullUrl = `/api/products/best-selling-advanced?${params}`;
            console.log('Final URL:', fullUrl);
            
            const response = await fetch(fullUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);

            if (data.code === 1000) {
                this.products = data.result.content || [];
                this.totalElements = data.result.totalElements || 0;
                this.totalPages = data.result.totalPages || 0;
                console.log('Products loaded:', this.products.length, 'Total:', this.totalElements);
                
                // Hide loading spinner
                this.showLoading(false);
                
                // Check if no products found
                if (this.products.length === 0) {
                    this.showEmptyState('Không tìm thấy sản phẩm phù hợp');
                } else {
                    this.renderProducts();
                    this.updateResultsCount();
                    this.renderPagination();
                }
            } else {
                console.log('API error:', data.message);
                this.showLoading(false);
                this.showEmptyState('Chưa có sản phẩm bán chạy nào');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showLoading(false);
            this.showEmptyState('Có lỗi xảy ra khi tải sản phẩm');
        } finally {
            this.isLoading = false;
        }
    }

    showLoading(show = true) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingSpinner) loadingSpinner.style.display = show ? 'block' : 'none';
        if (productsGrid) productsGrid.style.display = show ? 'none' : 'block';
        if (emptyState) emptyState.style.display = 'none';
    }

    showEmptyState(message = 'Không tìm thấy sản phẩm') {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const productsGrid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (productsGrid) {
            productsGrid.style.display = 'none';
            // Clear products grid content
            productsGrid.innerHTML = '';
        }
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.querySelector('h4').textContent = message;
        }
        
        // Update results count to 0
        this.updateResultsCount();
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            this.showEmptyState();
            return;
        }

        const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
        productsGrid.innerHTML = productsHTML;
        productsGrid.style.display = 'block';
    }

    createProductCard(product) {
        const productStatus = this.getProductStatus(product);
        const statusClass = this.getProductStatusClass(productStatus);
        
        // Safe property access with fallbacks
        const productId = product.productId || product.id || 0;
        const productName = product.name || 'Tên sản phẩm';
        const brandId = product.brandId || 0;
        const brandName = product.brandName || 'Thương hiệu';
        const reviewCount = product.reviewCount || product.ratingCount || 0;
        const currentPrice = product.currentPrice || product.price || 0;
        
        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class="card h-100 product-card ${statusClass}">
                    <div class="position-relative">
                        <img src="${this.getMainImageUrl(product)}" 
                             class="card-img-top" 
                             alt="${productName}"
                             onerror="this.src='/uploads/products/default.jpg'"
                             onclick="window.location.href='/product/${productId}'"
                             style="cursor: pointer;">
                        
                        <div class="product-actions">
                            <button class="quick-view-btn" 
                                    onclick="if(window.bestsellerProductsPageManager) window.bestsellerProductsPageManager.showQuickView(${productId}); else alert('Chức năng đang được tải...');"
                                    title="Xem nhanh">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title" title="${productName}">
                            <a href="/product/${productId}" class="text-decoration-none text-dark product-name-link">
                                ${productName}
                            </a>
                        </h6>
                        
                        <p class="brand-name">
                            <a href="/brand/${brandId}" class="text-decoration-none text-muted brand-link">
                                ${brandName}
                            </a>
                        </p>
                        
                        <div class="rating">
                            <span class="stars">
                                ${this.renderStars(product.averageRating || product.rating || 0, reviewCount)}
                            </span>
                            <span class="rating-count">(${reviewCount} đánh giá)</span>
                        </div>
                        
                        <div class="mt-auto">
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
                            
                            <div class="price-section d-flex justify-content-between align-items-center">
                                <span class="current-price">
                                    ${this.formatPrice(currentPrice)}
                                </span>
                                <button class="add-to-cart-icon bestseller-page-cart-btn" 
                                        data-product-id="${productId}"
                                        data-product-name="${productName}"
                                        data-product-price="${currentPrice}"
                                        title="Thêm vào giỏ"
                                        onclick="event.preventDefault(); event.stopPropagation(); window.bestsellerProductsPageManager.addToCart(${productId}, '${productName}', ${currentPrice})">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getMainImageUrl(product) {
        // Check for mainImageUrl first (from API response)
        if (product.mainImageUrl) {
            return product.mainImageUrl;
        }
        
        // Fallback to images array
        if (product.images && product.images.length > 0) {
            return product.images[0].imageUrl;
        }
        
        return '/uploads/products/default.jpg';
    }

    getProductStatus(product) {
        if (!product.available) return 'out-of-stock';
        if (product.stock <= 0) return 'out-of-stock';
        if (product.stock <= 5) return 'low-stock';
        return 'available';
    }

    getProductStatusClass(status) {
        switch (status) {
            case 'out-of-stock': return 'out-of-stock';
            case 'low-stock': return 'low-stock';
            default: return 'available';
        }
    }

    renderStars(rating, reviewCount = 0) {
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
            stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
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
            currency: 'VND'
        }).format(numPrice);
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Hiển thị ${this.products.length} sản phẩm`;
        }
    }

    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'block';
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.bestsellerProductsPageManager.goToPage(${this.currentPage - 1}); return false;">Trước</a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="window.bestsellerProductsPageManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage >= this.totalPages - 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="window.bestsellerProductsPageManager.goToPage(${this.currentPage + 1}); return false;">Sau</a>
            </li>
        `;

        pagination.querySelector('ul').innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        
        this.currentPage = page;
        this.loadProducts();
        
        // Scroll to top of products
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async addToCart(productId, productName, price) {
        try {
            let success = false;
            
            // Check if cart functionality exists
            if (window.cartManager) {
                await window.cartManager.addItem(productId, 1);
                success = true;
            }
            // Fallback: Try to use global cart if available
            else if (window.app && window.app.cartItems) {
                const product = this.products.find(p => (p.productId || p.id) === productId);
                if (product) {
                    const existingItem = window.app.cartItems.find(item => item.id === productId);
                    
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        window.app.cartItems.push({
                            ...product,
                            quantity: 1
                        });
                    }
                    
                    if (window.app.updateCartDisplay) {
                        window.app.updateCartDisplay();
                    }
                    success = true;
                }
            }
            
            // Show single notification based on success
            if (success) {
                this.showNotification(`${productName} đã được thêm vào giỏ hàng thành công!`, 'success');
            } else {
                this.showNotification('Không tìm thấy thông tin sản phẩm!', 'error');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
        }
    }

    async showQuickView(productId) {
        const product = this.products.find(p => (p.productId || p.id) === productId);
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
                product.images = [];
            }
        }
        
        this.createQuickViewModal(product);
    }

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
                                                 onerror="this.src='/uploads/products/default.jpg'">
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
                                        <a href="/product/${product.productId || product.id}" class="text-decoration-none text-dark">
                                            ${product.name}
                                        </a>
                                    </h4>
                                    <p class="brand-name text-muted mb-2">${product.brandName || 'Thương hiệu'}</p>
                                    
                                    <!-- Product Status -->
                                    <div class="product-status mb-3">
                                        ${this.getProductStatusBadge(product)}
                                        <span class="ms-2 text-muted">Mã sản phẩm: ${product.productId || product.id}</span>
                                    </div>
                                    
                                    <!-- Rating -->
                                    <div class="rating mb-3">
                                        <span class="stars">
                                            ${this.generateStarsForModal(product.averageRating || product.rating || 0, product.reviewCount || product.ratingCount || 0)}
                                        </span>
                                        <span class="review-count ms-2">(${product.reviewCount || product.ratingCount || 0} đánh giá)</span>
                                    </div>
                                    
                                    <!-- Price -->
                                    <div class="price-section mb-4">
                                        <span class="current-price h4 text-primary">
                                            ${this.formatPrice(product.currentPrice || product.price)}
                                        </span>
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.bestsellerProductsPageManager.decrementQuantity('${product.productId || product.id}')">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput_${product.productId || product.id}" onchange="window.bestsellerProductsPageManager.validateQuantity('${product.productId || product.id}')" oninput="window.bestsellerProductsPageManager.validateQuantity('${product.productId || product.id}')" onblur="window.bestsellerProductsPageManager.validateQuantityOnBlur('${product.productId || product.id}')">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.bestsellerProductsPageManager.incrementQuantity('${product.productId || product.id}')">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quantityError_${product.productId || product.id}" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="quantityErrorMessage_${product.productId || product.id}">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        ${this.getQuickViewActions(product)}
                                        
                                        <!-- View Details Button -->
                                        <a href="/product/${product.productId || product.id}" 
                                           class="btn btn-outline-primary btn-lg">
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
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'), {
            backdrop: true
        });
        modal.show();
        
        // Add slider navigation event listeners
        this.setupSliderNavigation(product);
        
        // Clean up when modal is hidden
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', () => {
            const modalElement = document.getElementById('quickViewModal');
            if (modalElement) {
                modalElement.remove();
            }
        }, { once: true });
    }

    generateImageThumbnails(product) {
        if (!product.images || product.images.length === 0) {
            return `
                <div class="thumbnail-item active">
                    <img src="${this.getMainImageUrl(product)}" 
                         class="thumbnail-img" 
                         alt="${product.name}">
                </div>
            `;
        }

        return product.images.map((image, index) => `
            <div class="thumbnail-item ${index === 0 ? 'active' : ''}">
                <img src="${image.imageUrl}" 
                     class="thumbnail-img" 
                     alt="${product.name}">
            </div>
        `).join('');
    }

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        
        switch (status) {
            case 'out-of-stock':
                return '<span class="badge bg-danger">Hết hàng</span>';
            case 'low-stock':
                return '<span class="badge bg-warning text-dark">Sắp hết hàng</span>';
            default:
                return '<span class="badge bg-success">Còn hàng</span>';
        }
    }

    getQuickViewActions(product) {
        const status = this.getProductStatus(product);
        const isDisabled = status !== 'available';
        
        if (status === 'out-of-stock') {
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
                            onclick="window.bestsellerProductsPageManager.buyNow(${product.productId || product.id})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="event.preventDefault(); event.stopPropagation(); window.bestsellerProductsPageManager.addToCartWithQuantity(${product.productId || product.id})">
                        <i class="fas fa-shopping-cart me-1"></i>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

    generateStarsForModal(rating, reviewCount = 0) {
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
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star" style="color: #ffc107 !important;"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt" style="color: #ffc107 !important;"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star" style="color: #ccc !important; font-weight: 400 !important;"></i>';
        }
        
        return stars;
    }
    
    setupSliderNavigation(product) {
        // Wait for modal to be fully rendered
        setTimeout(() => {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const mainImage = document.getElementById('mainProductImage');
            const thumbnails = document.querySelectorAll('#quickViewModal .thumbnail-item');
            
            console.log('Setting up slider navigation:', {
                prevBtn: !!prevBtn,
                nextBtn: !!nextBtn,
                mainImage: !!mainImage,
                thumbnails: thumbnails.length,
                productImages: product.images ? product.images.length : 0
            });
            
            if (!product.images || product.images.length <= 1) {
                // Hide navigation buttons if only one image
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                return;
            }
            
            let currentImageIndex = 0;
            
            // Update main image
            const updateMainImage = (index) => {
                if (product.images && product.images[index] && mainImage) {
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
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : product.images.length - 1;
                    updateMainImage(currentImageIndex);
                });
            }
            
            // Next button
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = currentImageIndex < product.images.length - 1 ? currentImageIndex + 1 : 0;
                    updateMainImage(currentImageIndex);
                });
            }
            
            // Thumbnail click handlers
            thumbnails.forEach((thumb, index) => {
                thumb.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentImageIndex = index;
                    updateMainImage(currentImageIndex);
                });
            });
        }, 100); // Small delay to ensure modal is rendered
    }
    
    // Quantity management methods for quick view modal
    decrementQuantity(productId) {
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.validateQuantity(productId);
            }
        }
    }

    incrementQuantity(productId) {
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
            const maxAllowed = Math.min(maxStock, 99); // Tối đa 99 sản phẩm
            if (currentValue < maxAllowed) {
                quantityInput.value = currentValue + 1;
                this.validateQuantity(productId);
            }
        }
    }

    validateQuantity(productId) {
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        const errorDiv = document.getElementById(`quantityError_${productId}`);
        const errorMessage = document.getElementById(`quantityErrorMessage_${productId}`);

        if (!quantityInput || !errorDiv || !errorMessage) return;

        const currentValue = parseInt(quantityInput.value) || 0;
        const maxStock = parseInt(quantityInput.getAttribute('max')) || 10;
        const maxAllowed = Math.min(maxStock, 99); // Tối đa 99 sản phẩm

        if (quantityInput.value === '' || quantityInput.value === '0') {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
            return;
        }

        if (currentValue < 1) {
            quantityInput.value = 1;
            errorDiv.style.display = 'block';
            errorMessage.textContent = 'Số lượng không thể nhỏ hơn 1.';
            quantityInput.classList.add('is-invalid');
        } else if (currentValue > maxAllowed) {
            quantityInput.value = maxAllowed;
            errorDiv.style.display = 'block';
            errorMessage.textContent = `Số lượng tối đa là ${maxAllowed} sản phẩm.`;
            quantityInput.classList.add('is-invalid');
        } else {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
        }
    }

    validateQuantityOnBlur(productId) {
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        if (quantityInput && (quantityInput.value === '' || quantityInput.value === '0')) {
            quantityInput.value = 1;
        }
        this.validateQuantity(productId);
    }

    // Buy now functionality
    async buyNow(productId) {
        const product = this.products.find(p => (p.productId || p.id) === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm!', 'error');
            return;
        }

        // Add to cart first
        await this.addToCart(productId, product.name, product.currentPrice || product.price);
        
        // Redirect to checkout
        window.location.href = '/checkout';
    }

    // Add to cart with quantity
    addToCartWithQuantity(productId) {
        const product = this.products.find(p => (p.productId || p.id) === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            return;
        }

        // Get quantity from input using unique ID
        const quantityInput = document.getElementById(`quantityInput_${productId}`);
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        // Add to cart with quantity
        this.addToCartWithQuantityValue(productId, product.name, product.currentPrice || product.price, quantity);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('quickViewModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Add to cart with specific quantity
    async addToCartWithQuantityValue(productId, productName, price, quantity) {
        try {
            let success = false;
            
            // Check if cart functionality exists
            if (window.cartManager && typeof window.cartManager.addItem === 'function') {
                await window.cartManager.addItem(productId, quantity);
                success = true;
            }
            // Fallback to global app cart
            else if (window.app && window.app.cartItems) {
                // Validate data first
                if (productId && productName && price && !isNaN(price)) {
                    const product = this.products.find(p => (p.productId || p.id) === productId);
                    if (product) {
                        const existingItem = window.app.cartItems.find(item => item.id === productId);
                        
                        if (existingItem) {
                            existingItem.quantity += quantity;
                        } else {
                            window.app.cartItems.push({
                                id: productId,
                                name: productName,
                                price: price,
                                quantity: quantity,
                                image: product.images && product.images.length > 0 ? product.images[0].imageUrl : '/static/user/images/no-image.png'
                            });
                        }
                        
                        if (window.app.updateCartDisplay) {
                            window.app.updateCartDisplay();
                        }
                        success = true;
                    }
                }
            }
            
            // Show single notification based on success
            if (success) {
                this.showNotification(`${quantity} x ${productName} đã được thêm vào giỏ hàng thành công!`, 'success');
            } else {
                this.showNotification('Không tìm thấy thông tin sản phẩm!', 'error');
            }
        } catch (error) {
            this.showNotification('Có lỗi xảy ra khi thêm vào giỏ hàng', 'error');
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

        let container = document.querySelector('.bestseller-page-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'bestseller-page-toast-container';
            container.style.cssText = 'position: fixed !important; top: 20px !important; right: 20px !important; z-index: 9999 !important; width: 300px;';
            document.body.appendChild(container);
        }
        container.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
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

    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid')) {
        window.bestsellerProductsPageManager = new BestsellerProductsPageManager();
    }
});