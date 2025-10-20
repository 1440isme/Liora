/**
 * Newest Products Page - Clean implementation
 */
class NewestProductsPageManager {
    constructor() {
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
        this.bindEvents();
        this.loadBrands().finally(() => this.loadProducts());
    }

    bindEvents() {
        const priceRangeSelect = document.getElementById('priceRange');
        if (priceRangeSelect) priceRangeSelect.addEventListener('change', (e) => this.handlePriceRangeChange(e));

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', (e) => this.handleSortChange(e));

        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => this.applyFilters());

        document.addEventListener('change', (e) => {
            if (e.target && e.target.closest && e.target.closest('#brandFilters')) {
                this.handleBrandFilterChange(e);
            }
            if (e.target && String(e.target.id || '').startsWith('rating')) {
                this.handleRatingFilterChange(e);
            }
        });
    }

    handlePriceRangeChange(event) {
        const selectedRange = event.target.value;
        if (!selectedRange) {
            this.currentFilters.minPrice = null;
            this.currentFilters.maxPrice = null;
            return;
        }
        const [min, max] = selectedRange.split(',').map(Number);
        this.currentFilters.minPrice = isNaN(min) ? null : min;
        this.currentFilters.maxPrice = isNaN(max) ? null : max;
    }

    handleSortChange(event) {
        this.currentFilters.sort = event.target.value || '';
        this.currentPage = 0;
        this.loadProducts();
    }

    handleBrandFilterChange(event) {
        const el = event.target;
        if (!el || el.type !== 'checkbox') return;
        const val = String(el.value);
        const i = this.currentFilters.brands.indexOf(val);
        if (el.checked && i === -1) this.currentFilters.brands.push(val);
        if (!el.checked && i !== -1) this.currentFilters.brands.splice(i, 1);
    }

    handleRatingFilterChange(event) {
        const el = event.target;
        if (!el || el.type !== 'checkbox') return;
        const rating = parseInt(el.value, 10);
        if (isNaN(rating)) return;
        const i = this.currentFilters.ratings.indexOf(rating);
        if (el.checked && i === -1) this.currentFilters.ratings.push(rating);
        if (!el.checked && i !== -1) this.currentFilters.ratings.splice(i, 1);
    }

    applyFilters() {
        this.currentPage = 0;
        this.loadProducts();
    }

    async loadProducts() {
        if (this.isLoading) return;
        this.isLoading = true;
        this.showLoading();

        try {
            let sortValue = this.currentFilters.sort || '';
            if (!sortValue) {
                const sortSelect = document.getElementById('sortSelect');
                sortValue = sortSelect ? sortSelect.value : 'created,desc';
            }
            const [sortBy, sortDir] = (sortValue || 'created,desc').split(',');

            const params = new URLSearchParams({
                page: String(this.currentPage),
                size: String(this.pageSize),
                sortBy: String(sortBy || 'created'),
                sortDir: String(sortDir || 'desc')
            });

            if (this.currentFilters.minPrice != null && this.currentFilters.minPrice !== '') params.append('minPrice', String(this.currentFilters.minPrice));
            if (this.currentFilters.maxPrice != null && this.currentFilters.maxPrice !== '') params.append('maxPrice', String(this.currentFilters.maxPrice));
            if (this.currentFilters.brands.length > 0) params.append('brands', this.currentFilters.brands.join(','));
            if (this.currentFilters.ratings.length > 0) params.append('ratings', this.currentFilters.ratings.join(','));

            const url = `/api/products/newest-advanced?${params.toString()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data && (data.code === 1000 || data.code === 200)) {
                const result = data.result || {};
                const items = Array.isArray(result) ? result : (result.content || []);
                this.products = items || [];
                this.totalElements = Array.isArray(result) ? this.products.length : (result.totalElements || this.products.length);
                this.totalPages = Array.isArray(result) ? 1 : (result.totalPages || 1);

                if (this.products.length === 0) {
                    try {
                        const fb = await fetch(`/api/products/newest?limit=${this.pageSize}`);
                        if (fb.ok) {
                            const fbData = await fb.json();
                            if (fbData && (fbData.code === 1000 || fbData.code === 200)) {
                                const fbResult = fbData.result || {};
                                const fbItems = Array.isArray(fbResult) ? fbResult : (fbResult.content || []);
                                this.products = fbItems || [];
                                this.totalElements = this.products.length;
                                this.totalPages = 1;
                            }
                        }
                    } catch (_) { }
                }

                if (this.products.length > 0) {
                    this.renderProducts();
                    this.updatePagination();
                    this.updateResultsCount();
                    this.hideLoading();
                } else {
                    this.showEmptyState();
                }
            } else {
                this.showEmptyState();
            }
        } catch (err) {
            console.error('Newest load error:', err);
            this.showEmptyState();
        } finally {
            this.isLoading = false;
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        if (!grid) return;
        if (emptyState) emptyState.style.display = 'none';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '0.8rem';
        grid.style.padding = '2rem 1rem';

        grid.innerHTML = this.products.map((p) => this.createProductCard(p)).join('');

        // Trigger rating load sau khi render xong
        setTimeout(() => {
            if (window.loadProductRatings) {
                window.loadProductRatings();
            }
        }, 500);
    }

    createProductCard(product) {
        const productId = product.productId || product.id;
        const name = product.name || 'Sản phẩm';
        const brandName = product.brandName || 'Thương hiệu';
        const brandId = product.brandId || '';
        const price = product.price || 0;
        const imageUrl = product.mainImageUrl || '/user/img/default-product.jpg';

        return `
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                <div class=" product-card">
                    <div class="position-relative">
                        <img src="${imageUrl}" class="card-img-top" alt="${name}"
                             onerror="this.src='/user/img/default-product.jpg'"
                             style="cursor:pointer" onclick="window.location.href='/product/${productId}?from=newest'">
                        <div class="product-actions">
                            <button class="quick-view-btn" title="Xem nhanh"
                                onclick="window.newestProductsPageManager && window.newestProductsPageManager.showQuickView(${productId})">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title" title="${name}">
                            <a href="/product/${productId}?from=newest" class="text-decoration-none text-dark product-name-link">${name}</a>
                        </h6>
                        <p class="brand-name">
                            <a href="/brand/${brandId}" class="text-decoration-none text-muted brand-link">${brandName}</a>
                        </p>
                        
                        <!-- Rating sẽ được load bởi ProductRatingUtils -->
                        <div class="product-rating" data-product-id="${productId}">
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
                        
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="current-price">${this.formatPrice(price)}</span>
                            <button class="add-to-cart-icon" title="Thêm vào giỏ"
                                onclick="event.preventDefault(); event.stopPropagation(); window.newestProductsPageManager.addToCart(${productId}, '${name.replace(/'/g, "\\'")}', ${price})">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    formatPrice(price) {
        const num = Number(price);
        if (!isFinite(num)) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    }

    async addToCart(productId, productName, price) {
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(productId, 1, true);
                await window.app.refreshCartBadge?.();
                return;
            }
        } catch (e) {
            console.error('Add to cart error:', e);
        }
        alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    }

    async showQuickView(productId) {
        const product = this.products.find(p => (p.productId || p.id) === productId);
        if (!product) return;

        // Normalize images
        if (!product.images && Array.isArray(product.imageUrls)) {
            product.images = product.imageUrls.map(u => ({ imageUrl: u }));
        }

        this.createQuickViewModal(product);
    }

    createQuickViewModal(product) {
        // Remove existing modal and backdrop if any
        const existingModal = document.getElementById('homepageBestsellerQuickViewModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Remove any existing backdrop
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="homepageBestsellerQuickViewModal" tabindex="-1" aria-labelledby="homepageBestsellerQuickViewModalLabel" aria-hidden="true" style="z-index: 9999 !important;">
                <div class="modal-dialog modal-dialog-centered modal-xl" style="max-width: 900px;">
                    <div class="modal-content" style="z-index: 10000 !important;">
                        <div class="modal-header border-0">
                            <h5 class="modal-title" id="homepageBestsellerQuickViewModalLabel">Xem nhanh sản phẩm</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- Product Image Slider -->
                                <div class="col-md-6">
                                    <div class="product-image-slider">
                                        <!-- Main Image -->
                                        <div class="main-image-container mb-3">
                                            <button class="slider-nav slider-prev" id="homepageBestsellerModalPrevBtn">
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                            <img id="homepageBestsellerModalMainProductImage" 
                                                 src="${this.getMainImageUrl(product)}" 
                                                 class="img-fluid rounded" 
                                                 alt="${product.name}"
                                                 onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="homepageBestsellerModalNextBtn">
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
                                            ${this.generateStarsForModal(product.averageRating || product.rating || 0, product.reviewCount || product.ratingCount || 0)}
                                        </span>
                                        <span class="review-count ms-2">(${product.reviewCount || product.ratingCount || 0} đánh giá)</span>
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
                                            ${this.formatPrice(product.currentPrice || product.price)}
                                        </span>
                                    </div>
                                    
                                    <!-- Quantity Selector -->
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsPageManager.decQty()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quickQty" onchange="window.newestProductsPageManager.valQty()" oninput="window.newestProductsPageManager.valQty()" onblur="window.newestProductsPageManager.valQtyBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsPageManager.incQty()">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="quickQtyErr" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="quickQtyMsg">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Actions -->
                                    <div class="d-grid gap-2">
                                        ${this.getQuickViewActions(product)}
                                        
                                        <!-- View Details Button -->
                                        <a href="/product/${product.productId}" 
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

        // Show modal with proper backdrop
        const modal = new bootstrap.Modal(document.getElementById('homepageBestsellerQuickViewModal'), {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        modal.show();

        // Ensure backdrop has proper z-index
        setTimeout(() => {
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.style.zIndex = '9998';
                backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        }, 10);

        // Add slider navigation event listeners
        this.setupSliderNavigation(product);

        // Clean up when modal is hidden
        document.getElementById('homepageBestsellerQuickViewModal').addEventListener('hidden.bs.modal', () => {
            const modalElement = document.getElementById('homepageBestsellerQuickViewModal');
            if (modalElement) {
                modalElement.remove();
            }
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }, { once: true });
    }

    decrementQuantity() {
        const input = document.getElementById('quantityInput');
        if (!input) return;
        const v = parseInt(input.value || '1', 10);
        if (v > 1) input.value = String(v - 1);
        this.validateQuantity();
    }

    incrementQuantity() {
        const input = document.getElementById('quantityInput');
        if (!input) return;
        const v = parseInt(input.value || '1', 10);
        const max = parseInt(input.getAttribute('max') || '99', 10);
        if (v < max) input.value = String(v + 1);
        this.validateQuantity();
    }

    validateQuantity() {
        const input = document.getElementById('quantityInput');
        const errorDiv = document.getElementById('quantityError');
        const errorMsg = document.getElementById('quantityErrorMessage');
        if (!input || !errorDiv || !errorMsg) return;
        const v = parseInt(input.value || '1', 10);
        const max = parseInt(input.getAttribute('max') || '99', 10);
        if (isNaN(v) || v < 1) {
            input.value = '1';
            errorDiv.style.display = 'none';
            input.classList.remove('is-invalid');
            return;
        }
        if (v > max) {
            input.value = String(max);
            errorDiv.style.display = 'block';
            errorMsg.textContent = `Số lượng tối đa là ${max} sản phẩm.`;
            input.classList.add('is-invalid');
        } else {
            errorDiv.style.display = 'none';
            input.classList.remove('is-invalid');
        }
    }

    validateQuantityOnBlur() {
        const input = document.getElementById('quantityInput');
        if (input && (!input.value || input.value === '0')) input.value = '1';
        this.validateQuantity();
    }

    async buyNow(productId) {
        const input = document.getElementById('quantityInput');
        const quantity = input ? (parseInt(input.value || '1', 10) || 1) : 1;
        const modal = document.getElementById('quickViewModal');
        const bs = modal ? bootstrap.Modal.getInstance(modal) : null;
        if (bs) bs.hide();
        if (window.app && typeof window.app.buyNowBackend === 'function') {
            try {
                await window.app.buyNowBackend(productId, quantity);
            } catch (e) {
                console.error('buyNow error', e);
                alert('Không thể thực hiện Mua ngay. Vui lòng thử lại.');
            }
        } else {
            alert('Chức năng đang được tải...');
        }
    }

    async addToCartWithQuantity(productId) {
        const input = document.getElementById('quantityInput');
        const quantity = input ? (parseInt(input.value || '1', 10) || 1) : 1;
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(productId, quantity, true);
                await window.app.refreshCartBadge?.();
            } else {
                alert('Chức năng đang được tải...');
            }
        } catch (e) {
            console.error('add to cart error', e);
            alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
        }

        const modal = document.getElementById('quickViewModal');
        const bs = modal ? bootstrap.Modal.getInstance(modal) : null;
        if (bs) bs.hide();
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
        if (!resultsCount) return;
        const n = this.totalElements || this.products.length || 0;
        resultsCount.textContent = `Hiển thị ${n} sản phẩm`;
    }

    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        pagination.style.display = 'block';
        const ul = pagination.querySelector('.pagination');
        if (!ul) return;

        let html = '';
        const prevDisabled = this.currentPage === 0 ? 'disabled' : '';
        html += `
            <li class="page-item ${prevDisabled}">
                <a class="page-link" href="#" onclick="window.newestProductsPageManager.goToPage(${this.currentPage - 1}); return false;">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>`;

        const start = Math.max(0, this.currentPage - 2);
        const end = Math.min(this.totalPages - 1, this.currentPage + 2);
        for (let i = start; i <= end; i++) {
            const active = i === this.currentPage ? 'active' : '';
            html += `
                <li class="page-item ${active}">
                    <a class="page-link" href="#" onclick="window.newestProductsPageManager.goToPage(${i}); return false;">${i + 1}</a>
                </li>`;
        }

        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        html += `
            <li class="page-item ${nextDisabled}">
                <a class="page-link" href="#" onclick="window.newestProductsPageManager.goToPage(${this.currentPage + 1}); return false;">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>`;

        ul.innerHTML = html;
    }

    goToPage(page) {
        if (page < 0 || page >= this.totalPages) return;
        this.currentPage = page;
        this.loadProducts();
    }

    async loadBrands() {
        try {
            const [brandsRes, countsRes] = await Promise.all([
                fetch('/api/products/newest-brands'),
                fetch('/api/products/newest-brands-with-count')
            ]);

            let brands = [];
            let counts = {};
            if (brandsRes.ok) {
                const bd = await brandsRes.json();
                if (bd && (bd.code === 1000 || bd.code === 200) && bd.result) brands = bd.result;
            }
            if (countsRes.ok) {
                const cd = await countsRes.json();
                if (cd && (cd.code === 1000 || cd.code === 200) && cd.result) counts = cd.result;
            }

            const el = document.getElementById('brandFilters');
            if (!el) return;
            if ((!brands || brands.length === 0) && (!counts || Object.keys(counts).length === 0)) {
                el.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>';
                return;
            }

            if (brands && brands.length > 0) {
                el.innerHTML = brands.map(b => {
                    const name = b.name || b.brandName;
                    const count = counts && name ? (counts[name] || 0) : 0;
                    return `
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="checkbox" value="${b.brandId}" id="brand-${b.brandId}">
                            <label class="form-check-label" for="brand-${b.brandId}">${name} (${count})</label>
                        </div>`;
                }).join('');
                return;
            }

            if (counts && Object.keys(counts).length > 0) {
                el.innerHTML = Object.entries(counts).map(([name, count]) => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" value="${name}" id="brand-${name}">
                        <label class="form-check-label" for="brand-${name}">${name} (${count})</label>
                    </div>`).join('');
            }
        } catch (_) { }
    }

    // Helpers for Quick View
    getMainImageUrl(product) {
        if (product && product.mainImageUrl) return product.mainImageUrl;
        if (product && Array.isArray(product.images) && product.images.length > 0) {
            const first = product.images[0];
            return (first && (first.imageUrl || first)) || '/user/img/default-product.jpg';
        }
        return '/user/img/default-product.jpg';
    }

    generateImageThumbnails(product) {
        let images = [];
        if (product && Array.isArray(product.images) && product.images.length > 0) {
            images = product.images;
        } else if (product && product.mainImageUrl) {
            images = [{ imageUrl: product.mainImageUrl }];
        } else {
            images = [{ imageUrl: '/user/img/default-product.jpg' }];
        }
        return images.map((img, idx) => `
            <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" style="cursor:pointer;">
                <img src="${img.imageUrl || img}" class="thumbnail-img" alt="${product.name}" onerror="this.src='/user/img/default-product.jpg'" style="width:60px;height:60px;object-fit:cover;border:2px solid ${idx === 0 ? '#0d6efd' : 'transparent'};border-radius:4px;"/>
            </div>
        `).join('');
    }

    getProductStatus(product) {
        if (!product) return 'out_of_stock';
        if (product.deactivated || product.isActive === false) return 'deactivated';
        if (product.available === false) return 'out_of_stock';
        if (typeof product.stock === 'number' && product.stock <= 0) return 'out_of_stock';
        return 'available';
    }

    getProductStatusBadge(product) {
        const status = this.getProductStatus(product);
        if (status === 'deactivated') return '<span class="badge bg-warning text-dark">Ngừng kinh doanh</span>';
        if (status === 'out_of_stock') return '<span class="badge bg-danger">Hết hàng</span>';
        return '<span class="badge bg-success">Còn hàng</span>';
    }

    generateStarsForModal(rating, reviewCount = 0) {
        const r = Number(rating) || 0;
        if (r <= 0) return '<i class="far fa-star" style="color:#ccc"></i>'.repeat(5);
        const full = Math.floor(r);
        const half = (r % 1) >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        return `${'<i class="fas fa-star text-warning"></i>'.repeat(full)}${half ? '<i class="fas fa-star-half-alt text-warning"></i>' : ''}${'<i class=\"far fa-star\" style=\"color:#ccc\"></i>'.repeat(empty)}`;
    }

    getQuickViewActions(product) {
        const status = this.getProductStatus(product);
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
            <div class="row g-2">
                <div class="col-6">
                    <button class="btn btn-danger btn-lg w-100" onclick="window.newestProductsPageManager.buyNow(${product.productId})">
                        <i class="fas fa-bolt me-1"></i> Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" onclick="window.newestProductsPageManager.addToCartWithQuantity(${product.productId})">
                        <i class="fas fa-shopping-cart me-1"></i> Thêm vào giỏ
                    </button>
                </div>
            </div>
        `;
    }

    setupSliderNavigation(product) {
        setTimeout(() => {
            const prevBtn = document.getElementById('homepageBestsellerModalPrevBtn');
            const nextBtn = document.getElementById('homepageBestsellerModalNextBtn');
            const mainImage = document.getElementById('homepageBestsellerModalMainProductImage');
            const thumbnails = document.querySelectorAll('#homepageBestsellerQuickViewModal .thumbnail-item');

            console.log('Setting up newest page slider navigation:', {
                prevBtn: !!prevBtn,
                nextBtn: !!nextBtn,
                mainImage: !!mainImage,
                thumbnails: thumbnails.length,
                productImages: product.images ? product.images.length : 0
            });

            if (!product || !Array.isArray(product.images) || product.images.length <= 1) {
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
                return;
            }

            let currentImageIndex = 0;

            // Update main image and thumbnail selection
            const updateMainImage = (index) => {
                if (product.images && product.images[index] && mainImage) {
                    mainImage.src = product.images[index].imageUrl || product.images[index];
                    mainImage.alt = product.name || '';

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
        }, 100);
    }

    // Quantity management methods for quick view modal
    decQty() { const i = document.getElementById('quickQty'); if (!i) return; const v = parseInt(i.value || '1', 10); if (v > 1) i.value = String(v - 1); this.valQty(); }
    incQty() { const i = document.getElementById('quickQty'); if (!i) return; const v = parseInt(i.value || '1', 10); const m = parseInt(i.getAttribute('max') || '99', 10); if (v < m) i.value = String(v + 1); this.valQty(); }
    valQty() { const i = document.getElementById('quickQty'); const e = document.getElementById('quickQtyErr'); const m = document.getElementById('quickQtyMsg'); if (!i || !e || !m) return; const v = parseInt(i.value || '1', 10); const mx = parseInt(i.getAttribute('max') || '99', 10); if (isNaN(v) || v < 1) { i.value = '1'; e.style.display = 'none'; i.classList.remove('is-invalid'); return; } if (v > mx) { i.value = String(mx); e.style.display = 'block'; m.textContent = `Số lượng tối đa là ${mx} sản phẩm.`; i.classList.add('is-invalid'); } else { e.style.display = 'none'; i.classList.remove('is-invalid'); } }
    valQtyBlur() { const i = document.getElementById('quickQty'); if (i && (!i.value || i.value === '0')) i.value = '1'; this.valQty(); }

    // Helper method to format numbers (e.g., 1000 -> 1.000)
    formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    // Helper method to calculate sales progress percentage
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
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid')) {
        window.newestProductsPageManager = new NewestProductsPageManager();
        window.newestProductsPageManager.init();
    }
});


