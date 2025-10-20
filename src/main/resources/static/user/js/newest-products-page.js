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
                <div class="card h-100 product-card">
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
        const existing = document.getElementById('quickViewModal');
        if (existing) existing.remove();

        const images = (product.images && product.images.length > 0)
            ? product.images
            : [{ imageUrl: product.mainImageUrl || '/user/img/default-product.jpg' }];
        const thumbnails = images.map((img, i) => `
            <div class="thumbnail-item ${i === 0 ? 'active' : ''}">
                <img src="${img.imageUrl}" class="thumbnail-img" alt="${product.name}" onerror="this.src='/user/img/default-product.jpg'">
            </div>
        `).join('');

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
                                <div class="col-md-6">
                                    <div class="product-image-slider">
                                        <div class="main-image-container mb-3">
                                            <button class="slider-nav slider-prev" id="quickViewPrevBtn"><i class="fas fa-chevron-left"></i></button>
                                            <img id="quickViewMainImage" src="${images[0].imageUrl}" class="img-fluid rounded" alt="${product.name}" onerror="this.src='/user/img/default-product.jpg'">
                                            <button class="slider-nav slider-next" id="quickViewNextBtn"><i class="fas fa-chevron-right"></i></button>
                                        </div>
                                        <div class="thumbnail-slider">
                                            <div class="thumbnail-container d-flex gap-2">${thumbnails}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h4 class="product-name mb-3">
                                        <a href="/product/${product.productId || product.id}" class="text-decoration-none text-dark">${product.name}</a>
                                    </h4>
                                    <p class="brand-name text-muted mb-2">${product.brandName || 'Thương hiệu'}</p>
                                    <div class="price-section mb-4">
                                        <span class="current-price h4 text-primary">${this.formatPrice(product.price)}</span>
                                    </div>
                                    <div class="quantity-selector mb-4">
                                        <div class="d-flex align-items-center">
                                            <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                            <div class="input-group" style="max-width: 150px;">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsPageManager.decrementQuantity()">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quantityInput" onchange="window.newestProductsPageManager.validateQuantity()" oninput="window.newestProductsPageManager.validateQuantity()" onblur="window.newestProductsPageManager.validateQuantityOnBlur()">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.newestProductsPageManager.incrementQuantity()">+</button>
                                            </div>
                                        </div>
                                        <div id="quantityError" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="quantityErrorMessage">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
                                        </div>
                                    </div>
                                    <div class="d-grid gap-2">
                                        <div class="row g-2">
                                            <div class="col-6">
                                                <button class="btn btn-danger btn-lg w-100" onclick="window.newestProductsPageManager.buyNow(${product.productId || product.id})"><i class="fas fa-bolt me-1"></i>Mua ngay</button>
                                            </div>
                                            <div class="col-6">
                                                <button class="btn btn-primary btn-lg w-100" onclick="event.preventDefault(); event.stopPropagation(); window.newestProductsPageManager.addToCartWithQuantity(${product.productId || product.id})"><i class="fas fa-shopping-cart me-1"></i>Thêm vào giỏ</button>
                                            </div>
                                        </div>
                                        <a href="/product/${product.productId || product.id}" class="btn btn-outline-primary btn-lg"><i class="fas fa-info-circle me-2"></i>Xem chi tiết sản phẩm</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
        modal.show();

        // Slider
        setTimeout(() => {
            const main = document.getElementById('quickViewMainImage');
            const thumbs = Array.from(document.querySelectorAll('.thumbnail-item'));
            let idx = 0;
            const update = (i) => {
                idx = (i + images.length) % images.length;
                if (main) main.src = images[idx].imageUrl;
                thumbs.forEach((t, k) => t.classList.toggle('active', k === idx));
            };
            const prev = document.getElementById('quickViewPrevBtn');
            const next = document.getElementById('quickViewNextBtn');
            if (prev) prev.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); update(idx - 1); });
            if (next) next.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); update(idx + 1); });
            thumbs.forEach((t, k) => t.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); update(k); }));
        }, 50);

        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () { this.remove(); });
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
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid')) {
        window.newestProductsPageManager = new NewestProductsPageManager();
        window.newestProductsPageManager.init();
    }
});


