class SearchResultsManager {
    constructor() {
        this.currentQuery = '';
        this.currentPage = 0;
        this.pageSize = 12;
        this.currentFilters = { minPrice: null, maxPrice: null, brands: [], ratings: [], sort: '' };
        this.products = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.init();
    }

    init() {
        this.parseUrl();
        this.bindEvents();
        this.loadBrands().finally(() => this.loadResults());
    }

    parseUrl() {
        const params = new URLSearchParams(window.location.search);
        this.currentQuery = params.get('q') || '';
        const qEl = document.getElementById('searchQueryDisplay');
        if (qEl) qEl.textContent = this.currentQuery;
    }

    bindEvents() {
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) sortSelect.addEventListener('change', () => { this.currentPage = 0; this.loadResults(); });
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) applyFilters.addEventListener('click', () => { this.currentPage = 0; this.loadResults(); });
        document.addEventListener('change', (e) => {
            if (e.target && e.target.closest && e.target.closest('#brandFilters')) this.onBrandChange(e);
            if (e.target && String(e.target.id || '').startsWith('rating')) this.onRatingChange(e);
        });
    }

    onBrandChange(e) {
        const el = e.target;
        if (!el || el.type !== 'checkbox') return;
        const val = String(el.value);
        const i = this.currentFilters.brands.indexOf(val);
        if (el.checked && i === -1) this.currentFilters.brands.push(val);
        if (!el.checked && i !== -1) this.currentFilters.brands.splice(i, 1);
    }

    onRatingChange(e) {
        const el = e.target;
        if (!el || el.type !== 'checkbox') return;
        const rating = parseInt(el.value, 10);
        if (isNaN(rating)) return;
        const i = this.currentFilters.ratings.indexOf(rating);
        if (el.checked && i === -1) this.currentFilters.ratings.push(rating);
        if (!el.checked && i !== -1) this.currentFilters.ratings.splice(i, 1);
    }

    async loadResults() {
        this.showLoading();
        try {
            const sortValue = (document.getElementById('sortSelect')?.value) || '';
            const [sortBy, sortDir] = sortValue ? sortValue.split(',') : ['', ''];
            const params = new URLSearchParams({ q: this.currentQuery, page: String(this.currentPage), size: String(this.pageSize) });
            if (sortBy) params.append('sortBy', sortBy);
            if (sortDir) params.append('sortDir', sortDir);
            if (this.currentFilters.minPrice != null && this.currentFilters.minPrice !== '') params.append('minPrice', String(this.currentFilters.minPrice));
            if (this.currentFilters.maxPrice != null && this.currentFilters.maxPrice !== '') params.append('maxPrice', String(this.currentFilters.maxPrice));
            if (this.currentFilters.brands.length > 0) params.append('brands', this.currentFilters.brands.join(','));
            if (this.currentFilters.ratings.length > 0) params.append('ratings', this.currentFilters.ratings.join(','));

            const url = `/api/products/search?${params.toString()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data && (data.code === 1000 || data.code === 200)) {
                const result = data.result || {};
                const items = Array.isArray(result) ? result : (result.content || []);
                this.products = items || [];
                this.totalElements = Array.isArray(result) ? this.products.length : (result.totalElements || this.products.length);
                this.totalPages = Array.isArray(result) ? 1 : (result.totalPages || 1);

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
        } catch (e) {
            console.error('Search load error:', e);
            this.showEmptyState();
        }
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const empty = document.getElementById('emptyState');
        if (!grid) return;
        if (empty) empty.style.display = 'none';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        grid.style.gap = '0.8rem';
        grid.style.padding = '2rem 1rem';
        grid.innerHTML = this.products.map(p => this.createCard(p)).join('');
    }

    createCard(product) {
        const productId = product.productId || product.id;
        const name = product.name || 'Sản phẩm';
        const brandName = product.brandName || 'Thương hiệu';
        const brandId = product.brandId || '';
        const price = product.price || 0;
        const imageUrl = product.mainImageUrl || '/user/img/default-product.jpg';
        return `
            <div class="product-card">
                <div class="position-relative">
                    <img src="${imageUrl}" class="card-img-top" alt="${name}" onerror="this.src='/user/img/default-product.jpg'"
                         style="cursor:pointer" onclick="window.location.href='/product/${productId}?from=search'">
                    <div class="product-actions">
                        <button class="quick-view-btn" title="Xem nhanh"
                            onclick="window.searchResultsManager && window.searchResultsManager.showQuickView(${productId})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title" title="${name}"><a href="/product/${productId}?from=search" class="text-decoration-none text-dark product-name-link">${name}</a></h6>
                    <p class="brand-name"><a href="/brand/${brandId}" class="text-decoration-none text-muted brand-link">${brandName}</a></p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="current-price">${this.formatPrice(price)}</span>
                        <button class="add-to-cart-icon" title="Thêm vào giỏ"
                            onclick="event.preventDefault(); event.stopPropagation(); window.searchResultsManager.addToCart(${productId}, '${name.replace(/'/g, "\\'")}', ${price})">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    formatPrice(price) {
        const num = Number(price);
        if (!isFinite(num)) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
    }

    async addToCart(productId, productName, price) {
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(productId, 1, true);
                await window.app.refreshCartBadge?.();
                return;
            }
        } catch (e) { console.error('Add to cart error:', e); }
        alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    }

    async showQuickView(productId) {
        const product = this.products.find(p => (p.productId || p.id) === productId);
        if (!product) return;
        if (!product.images && Array.isArray(product.imageUrls)) product.images = product.imageUrls.map(u => ({ imageUrl: u }));
        this.createQuickViewModal(product);
    }

    createQuickViewModal(product) {
        const existing = document.getElementById('quickViewModal');
        if (existing) existing.remove();
        const images = (product.images && product.images.length > 0) ? product.images : [{ imageUrl: product.mainImageUrl || '/user/img/default-product.jpg' }];
        const thumbs = images.map((img, i) => `<div class="thumbnail-item ${i === 0 ? 'active' : ''}"><img src="${img.imageUrl}" class="thumbnail-img" alt="${product.name}" onerror="this.src='/user/img/default-product.jpg'"></div>`).join('');
        const html = `
            <div class="modal fade" id="quickViewModal" tabindex="-1" aria-labelledby="quickViewModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
                    <div class="modal-header border-0"><h5 class="modal-title" id="quickViewModalLabel">Xem nhanh sản phẩm</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
                    <div class="modal-body"><div class="row">
                        <div class="col-md-6"><div class="product-image-slider"><div class="main-image-container mb-3">
                            <button class="slider-nav slider-prev" id="quickPrev"><i class="fas fa-chevron-left"></i></button>
                            <img id="quickMain" src="${images[0].imageUrl}" class="img-fluid rounded" alt="${product.name}" onerror="this.src='/user/img/default-product.jpg'">
                            <button class="slider-nav slider-next" id="quickNext"><i class="fas fa-chevron-right"></i></button>
                        </div><div class="thumbnail-slider"><div class="thumbnail-container d-flex gap-2">${thumbs}</div></div></div></div>
                        <div class="col-md-6">
                            <h4 class="product-name mb-3"><a href="/product/${product.productId || product.id}" class="text-decoration-none text-dark">${product.name}</a></h4>
                            <p class="brand-name text-muted mb-2">${product.brandName || 'Thương hiệu'}</p>
                            <div class="price-section mb-4"><span class="current-price h4 text-primary">${this.formatPrice(product.price)}</span></div>
                            <div class="quantity-selector mb-4"><div class="d-flex align-items-center">
                                <label class="form-label mb-0" style="margin-right: 2rem;">Số lượng:</label>
                                <div class="input-group" style="max-width: 150px;">
                                    <button class="btn btn-outline-secondary" type="button" onclick="window.searchResultsManager.decQty()">-</button>
                                    <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="quickQty" onchange="window.searchResultsManager.valQty()" oninput="window.searchResultsManager.valQty()" onblur="window.searchResultsManager.valQtyBlur()">
                                    <button class="btn btn-outline-secondary" type="button" onclick="window.searchResultsManager.incQty()">+</button>
                                </div>
                            </div><div id="quickQtyErr" class="text-danger mt-2" style="display:none;"><i class="fas fa-info-circle me-1"></i><span id="quickQtyMsg">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span></div></div>
                            <div class="d-grid gap-2"><div class="row g-2"><div class="col-6">
                                <button class="btn btn-danger btn-lg w-100" onclick="window.searchResultsManager.buyNow(${product.productId || product.id})"><i class="fas fa-bolt me-1"></i>Mua ngay</button>
                            </div><div class="col-6">
                                <button class="btn btn-primary btn-lg w-100" onclick="event.preventDefault(); event.stopPropagation(); window.searchResultsManager.addToCartWithQuantity(${product.productId || product.id})"><i class="fas fa-shopping-cart me-1"></i>Thêm vào giỏ</button>
                            </div></div>
                            <a href="/product/${product.productId || product.id}" class="btn btn-outline-primary btn-lg"><i class="fas fa-info-circle me-2"></i>Xem chi tiết sản phẩm</a></div>
                        </div>
                    </div></div>
                </div></div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = new bootstrap.Modal(document.getElementById('quickViewModal'));
        modal.show();
        setTimeout(() => {
            const main = document.getElementById('quickMain');
            const t = Array.from(document.querySelectorAll('.thumbnail-item'));
            let i = 0; const upd = (k) => { i = (k + images.length) % images.length; if (main) main.src = images[i].imageUrl; t.forEach((n, idx) => n.classList.toggle('active', idx === i)); };
            document.getElementById('quickPrev')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); upd(i - 1); });
            document.getElementById('quickNext')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); upd(i + 1); });
            t.forEach((n, idx) => n.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); upd(idx); }));
        }, 50);
        document.getElementById('quickViewModal').addEventListener('hidden.bs.modal', function () { this.remove(); });
    }

    decQty() { const i = document.getElementById('quickQty'); if (!i) return; const v = parseInt(i.value || '1', 10); if (v > 1) i.value = String(v - 1); this.valQty(); }
    incQty() { const i = document.getElementById('quickQty'); if (!i) return; const v = parseInt(i.value || '1', 10); const m = parseInt(i.getAttribute('max') || '99', 10); if (v < m) i.value = String(v + 1); this.valQty(); }
    valQty() { const i = document.getElementById('quickQty'); const e = document.getElementById('quickQtyErr'); const m = document.getElementById('quickQtyMsg'); if (!i || !e || !m) return; const v = parseInt(i.value || '1', 10); const mx = parseInt(i.getAttribute('max') || '99', 10); if (isNaN(v) || v < 1) { i.value = '1'; e.style.display = 'none'; i.classList.remove('is-invalid'); return; } if (v > mx) { i.value = String(mx); e.style.display = 'block'; m.textContent = `Số lượng tối đa là ${mx} sản phẩm.`; i.classList.add('is-invalid'); } else { e.style.display = 'none'; i.classList.remove('is-invalid'); } }
    valQtyBlur() { const i = document.getElementById('quickQty'); if (i && (!i.value || i.value === '0')) i.value = '1'; this.valQty(); }

    async buyNow(productId) {
        const i = document.getElementById('quickQty');
        const quantity = i ? (parseInt(i.value || '1', 10) || 1) : 1;
        const modalEl = document.getElementById('quickViewModal');
        const bs = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        if (bs) bs.hide();
        if (window.app && typeof window.app.buyNowBackend === 'function') {
            try { await window.app.buyNowBackend(productId, quantity); } catch (e) { console.error('buyNow error', e); alert('Không thể thực hiện Mua ngay. Vui lòng thử lại.'); }
        } else { alert('Chức năng đang được tải...'); }
    }

    async addToCartWithQuantity(productId) {
        const i = document.getElementById('quickQty');
        const quantity = i ? (parseInt(i.value || '1', 10) || 1) : 1;
        try {
            if (window.app && typeof window.app.addProductToCartBackend === 'function') {
                await window.app.addProductToCartBackend(productId, quantity, true);
                await window.app.refreshCartBadge?.();
            } else { alert('Chức năng đang được tải...'); }
        } catch (e) { console.error('add to cart error', e); alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại.'); }
        const modalEl = document.getElementById('quickViewModal');
        const bs = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
        if (bs) bs.hide();
    }

    showLoading() { const l = document.getElementById('loadingSpinner'); const g = document.getElementById('productsGrid'); const e = document.getElementById('emptyState'); if (l) l.style.display = 'block'; if (g) g.style.display = 'none'; if (e) e.style.display = 'none'; }
    hideLoading() { const l = document.getElementById('loadingSpinner'); const g = document.getElementById('productsGrid'); if (l) l.style.display = 'none'; if (g) g.style.display = 'block'; }
    showEmptyState() { const l = document.getElementById('loadingSpinner'); const g = document.getElementById('productsGrid'); const e = document.getElementById('emptyState'); if (l) l.style.display = 'none'; if (g) g.style.display = 'none'; if (e) e.style.display = 'block'; this.updateResultsCount(); }

    updatePagination() {
        const pagination = document.getElementById('pagination'); if (!pagination) return; if (this.totalPages <= 1) { pagination.style.display = 'none'; return; }
        pagination.style.display = 'block'; const ul = pagination.querySelector('.pagination'); if (!ul) return; let html = '';
        const prevDisabled = this.currentPage === 0 ? 'disabled' : '';
        html += `<li class="page-item ${prevDisabled}"><a class="page-link" href="#" onclick="window.searchResultsManager.goToPage(${this.currentPage - 1}); return false;"><i class=\"fas fa-chevron-left\"></i></a></li>`;
        const start = Math.max(0, this.currentPage - 2); const end = Math.min(this.totalPages - 1, this.currentPage + 2);
        for (let i = start; i <= end; i++) { const active = i === this.currentPage ? 'active' : ''; html += `<li class=\"page-item ${active}\"><a class=\"page-link\" href=\"#\" onclick=\"window.searchResultsManager.goToPage(${i}); return false;\">${i + 1}</a></li>`; }
        const nextDisabled = this.currentPage >= this.totalPages - 1 ? 'disabled' : '';
        html += `<li class=\"page-item ${nextDisabled}\"><a class=\"page-link\" href=\"#\" onclick=\"window.searchResultsManager.goToPage(${this.currentPage + 1}); return false;\"><i class=\"fas fa-chevron-right\"></i></a></li>`;
        ul.innerHTML = html;
    }

    goToPage(page) { if (page < 0 || page >= this.totalPages) return; this.currentPage = page; this.loadResults(); }

    updateResultsCount() { const el = document.getElementById('resultsCount'); if (!el) return; const n = this.totalElements || this.products.length || 0; el.textContent = `Hiển thị ${n} sản phẩm`; }

    async loadBrands() {
        try {
            const url = this.currentQuery ? `/api/products/search-brands?q=${encodeURIComponent(this.currentQuery)}` : '/api/products/search-brands';
            const res = await fetch(url);
            const data = res.ok ? await res.json() : null;
            const brands = (data && (data.code === 1000 || data.code === 200) && data.result) ? data.result : [];
            const el = document.getElementById('brandFilters'); if (!el) return;
            if (!brands || brands.length === 0) { el.innerHTML = '<p class="text-muted">Không có thương hiệu nào</p>'; return; }
            el.innerHTML = brands.map(b => `<div class=\"form-check mb-2\"><input class=\"form-check-input\" type=\"checkbox\" value=\"${b.brandId}\" id=\"brand-${b.brandId}\"><label class=\"form-check-label\" for=\"brand-${b.brandId}\">${b.name || b.brandName}</label></div>`).join('');
        } catch (_) { }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.searchResultsManager = new SearchResultsManager();
});


