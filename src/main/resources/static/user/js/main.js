// Main JavaScript functionality
class LioraApp {
    constructor() {
        this.currentPage = 'home';
        this.cartItems = [];
        this.wishlistItems = [];
        this.currentUser = null;

        this.init();
    }

    init() {
        this.bindEvents();
        // Make initialization resilient across pages (e.g., /info)
        try {
            this.loadInitialData();
        } catch (_) { /* ignore to continue auth/header render */ }
        this.checkAuthState();
        this.updateCartDisplay();

        // Listen for login/logout events to update header immediately
        document.addEventListener('user:login', (e) => {
            this.currentUser = e.detail;
            this.updateUserDisplay();
        });
        document.addEventListener('user:logout', () => {
            this.currentUser = null;
            this.updateUserDisplay();
        });
    }

    bindEvents() {
        // Navigation events
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-page]')) {
                e.preventDefault();
                const page = e.target.closest('[data-page]').dataset.page;
                this.showPage(page);
            }
        });

        // Category filter events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.category-tabs .btn')) {
                e.preventDefault();
                this.handleCategoryFilter(e.target);
            }
        });

        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        });

        // Newsletter subscription
        const newsletterForms = document.querySelectorAll('.newsletter-form');
        newsletterForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubscription(form);
            });
        });

        // Cart and wishlist events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart')) {
                e.preventDefault();
                const productId = e.target.closest('.add-to-cart').dataset.productId;
                this.addToCart(productId);
            }

            if (e.target.closest('.add-to-wishlist')) {
                e.preventDefault();
                const productId = e.target.closest('.add-to-wishlist').dataset.productId;
                this.toggleWishlist(productId);
            }
        });

        // Prevent opening auth modal if already authenticated
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-bs-target="#authModal"]');
            if (trigger && this.currentUser) {
                e.preventDefault();
                // Ensure header shows dropdown (in case not yet rendered)
                this.updateUserDisplay();
            }
        });
    }

    showPage(pageName) {
        // Update navigation active state
        document.querySelectorAll('.nav-btn, .nav-btn-mobile').forEach(btn => {
            btn.classList.remove('active');
        });

        document.querySelectorAll(`[data-page="${pageName}"]`).forEach(btn => {
            btn.classList.add('active');
        });

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.loadPageContent(pageName);
        }

        this.currentPage = pageName;

        // Close mobile menu if open
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse.classList.contains('show')) {
            bootstrap.Collapse.getInstance(navbarCollapse).hide();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    loadPageContent(pageName) {
        const pageElement = document.getElementById(`${pageName}-page`);

        switch (pageName) {
            case 'skincare':
                this.loadCategoryPage(pageElement, 'skincare', 'Skincare Products', 'Discover our complete skincare collection for healthy, glowing skin');
                break;
            case 'makeup':
                this.loadCategoryPage(pageElement, 'makeup', 'Makeup Collection', 'Express your beauty with our vibrant makeup selection');
                break;
            case 'bestsellers':
                this.loadCategoryPage(pageElement, 'bestsellers', 'Bestselling Products', 'Our most loved products chosen by thousands of customers');
                break;
            case 'new-arrivals':
                this.loadCategoryPage(pageElement, 'new-arrivals', 'New Arrivals', 'Be the first to try our latest K-beauty discoveries');
                break;
        }
    }

    loadCategoryPage(pageElement, category, title, subtitle) {
        const products = ProductManager.getProductsByCategory(category);

        pageElement.innerHTML = `
            <div class="category-hero bg-gradient-pink text-white py-5">
                <div class="container text-center">
                    <h1 class="display-4 fw-bold mb-3">${title}</h1>
                    <p class="lead">${subtitle}</p>
                </div>
            </div>
            
            <div class="container py-5">
                <div class="row">
                    <div class="col-lg-3 mb-4">
                        <div class="filter-sidebar bg-white rounded-4 p-4 box-shadow-soft">
                            <h5 class="fw-bold mb-3">Filter Products</h5>
                            
                            <div class="mb-4">
                                <h6 class="fw-semibold mb-2">Price Range</h6>
                                <div class="d-flex gap-2">
                                    <input type="number" class="form-control form-control-sm" placeholder="Min" id="priceMin">
                                    <input type="number" class="form-control form-control-sm" placeholder="Max" id="priceMax">
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h6 class="fw-semibold mb-2">Brand</h6>
                                <div class="filter-brands">
                                    ${this.getBrandFilters(products)}
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h6 class="fw-semibold mb-2">Rating</h6>
                                <div class="filter-ratings">
                                    ${this.getRatingFilters()}
                                </div>
                            </div>
                            
                            <button class="btn btn-pink-primary w-100 rounded-pill" onclick="app.applyFilters()">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                    
                    <div class="col-lg-9">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <p class="text-muted mb-0">Showing <span id="productCount">${products.length}</span> products</p>
                            <select class="form-select w-auto" id="sortProducts" onchange="app.sortProducts(this.value)">
                                <option value="default">Sort by: Default</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                                <option value="newest">Newest First</option>
                            </select>
                        </div>
                        
                        <div class="row g-4" id="categoryProductsGrid">
                            ${this.renderProductGrid(products)}
                        </div>
                        
                        <!-- Pagination -->
                        <nav class="mt-5">
                            <ul class="pagination justify-content-center">
                                <li class="page-item disabled">
                                    <span class="page-link">Previous</span>
                                </li>
                                <li class="page-item active">
                                    <span class="page-link">1</span>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">2</a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">3</a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">Next</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    getBrandFilters(products) {
        const brands = [...new Set(products.map(p => p.brand))];
        return brands.map(brand => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brand}" id="brand-${brand.replace(/\s+/g, '-')}">
                <label class="form-check-label" for="brand-${brand.replace(/\s+/g, '-')}">
                    ${brand}
                </label>
            </div>
        `).join('');
    }

    getRatingFilters() {
        return [4, 3, 2, 1].map(rating => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${rating}" id="rating-${rating}">
                <label class="form-check-label" for="rating-${rating}">
                    ${this.renderStars(rating)} & up
                </label>
            </div>
        `).join('');
    }

    renderProductGrid(products) {
        return products.map(product => `
            <div class="col-md-6 col-xl-4">
                <div class="card product-card h-100">
                    <div class="position-relative overflow-hidden">
                        <img src="${product.image}" class="product-image" alt="${product.name}">
                        <div class="position-absolute top-0 end-0 p-2">
                            <button class="btn btn-light btn-sm rounded-circle add-to-wishlist" data-product-id="${product.id}">
                                <i class="fas fa-heart ${this.isInWishlist(product.id) ? 'text-danger' : 'text-muted'}"></i>
                            </button>
                        </div>
                        ${product.discount ? `
                            <div class="position-absolute top-0 start-0 p-2">
                                <span class="badge bg-danger">-${product.discount}%</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-body">
                        <div class="product-brand">${product.brand}</div>
                        <h5 class="product-title">${product.name}</h5>
                        <div class="rating-stars mb-2">
                            ${this.renderStars(product.rating)}
                            <span class="rating-text ms-1">(${product.reviewCount})</span>
                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <span class="product-price">$${product.price.toFixed(2)}</span>
                                ${product.originalPrice ? `<span class="product-original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
                            </div>
                            <button class="btn btn-pink-primary btn-sm rounded-pill add-to-cart" data-product-id="${product.id}">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return [
            ...Array(fullStars).fill('<i class="fas fa-star"></i>'),
            ...(hasHalfStar ? ['<i class="fas fa-star-half-alt"></i>'] : []),
            ...Array(emptyStars).fill('<i class="far fa-star"></i>')
        ].join('');
    }

    handleCategoryFilter(button) {
        // Update active state
        document.querySelectorAll('.category-tabs .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Filter products
        const category = button.dataset.category;
        const products = category === 'all' ? ProductManager.getAllProducts() : ProductManager.getProductsByCategory(category);

        // Update products grid
        const grid = document.getElementById('featured-products-grid');
        if (grid) {
            grid.innerHTML = this.renderProductGrid(products.slice(0, 8)); // Show first 8 products
        }
    }

    handleSearch(query) {
        if (query.length < 2) return;

        // Implement search functionality
        const results = ProductManager.searchProducts(query);
        console.log('Search results:', results);

        // You can implement search results display here
        this.showToast(`Found ${results.length} products for "${query}"`, 'info');
    }

    handleNewsletterSubscription(form) {
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();

        if (!email) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Simulate newsletter subscription
        setTimeout(() => {
            this.showToast('Thank you for subscribing! 🎉 Check your email for a welcome discount.', 'success');
            emailInput.value = '';
        }, 500);
    }

    addToCart(productId) {
        const product = ProductManager.getProductById(productId);
        if (!product) return;

        // Check if product already in cart
        const existingItem = this.cartItems.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cartItems.push({
                ...product,
                quantity: 1
            });
        }

        this.updateCartDisplay();
        this.showToast(`${product.name} added to cart! 🛍️`, 'success');
    }

    toggleWishlist(productId) {
        const index = this.wishlistItems.indexOf(productId);

        if (index > -1) {
            this.wishlistItems.splice(index, 1);
            this.showToast('Removed from wishlist', 'info');
        } else {
            this.wishlistItems.push(productId);
            this.showToast('Added to wishlist! 💕', 'success');
        }

        // Update wishlist button states
        document.querySelectorAll(`[data-product-id="${productId}"] .fas.fa-heart`).forEach(icon => {
            icon.className = this.isInWishlist(productId) ? 'fas fa-heart text-danger' : 'fas fa-heart text-muted';
        });
    }

    isInWishlist(productId) {
        return this.wishlistItems.includes(productId);
    }

    updateCartDisplay() {
        const totalItems = this.cartItems.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = totalItems;
        });
    }

    applyFilters() {
        // Get filter values
        const priceMin = document.getElementById('priceMin')?.value || 0;
        const priceMax = document.getElementById('priceMax')?.value || Infinity;

        const selectedBrands = Array.from(document.querySelectorAll('.filter-brands input:checked')).map(cb => cb.value);
        const selectedRatings = Array.from(document.querySelectorAll('.filter-ratings input:checked')).map(cb => parseInt(cb.value));

        // Apply filters
        let filteredProducts = ProductManager.getProductsByCategory(this.currentPage);

        // Price filter
        filteredProducts = filteredProducts.filter(product =>
            product.price >= priceMin && product.price <= priceMax
        );

        // Brand filter
        if (selectedBrands.length > 0) {
            filteredProducts = filteredProducts.filter(product =>
                selectedBrands.includes(product.brand)
            );
        }

        // Rating filter
        if (selectedRatings.length > 0) {
            filteredProducts = filteredProducts.filter(product =>
                selectedRatings.some(rating => product.rating >= rating)
            );
        }

        // Update display
        const grid = document.getElementById('categoryProductsGrid');
        const countElement = document.getElementById('productCount');

        if (grid) {
            grid.innerHTML = this.renderProductGrid(filteredProducts);
        }

        if (countElement) {
            countElement.textContent = filteredProducts.length;
        }

        this.showToast(`Applied filters - ${filteredProducts.length} products found`, 'info');
    }

    sortProducts(sortBy) {
        let products = ProductManager.getProductsByCategory(this.currentPage);

        switch (sortBy) {
            case 'price-low':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                products.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                products.sort((a, b) => new Date(b.dateAdded || '2024-01-01') - new Date(a.dateAdded || '2024-01-01'));
                break;
            default:
                // Default sort
                break;
        }

        const grid = document.getElementById('categoryProductsGrid');
        if (grid) {
            grid.innerHTML = this.renderProductGrid(products);
        }
    }

    loadInitialData() {
        // Load featured products (only if ProductManager exists on this page)
        const grid = document.getElementById('featured-products-grid');
        if (grid && window.ProductManager && typeof ProductManager.getFeaturedProducts === 'function') {
            const featuredProducts = ProductManager.getFeaturedProducts();
            grid.innerHTML = this.renderProductGrid(featuredProducts);
        }

        // Load reviews (only if ReviewManager exists on this page)
        if (window.ReviewManager && typeof ReviewManager.loadReviews === 'function') {
            ReviewManager.loadReviews();
        }
    }

    checkAuthState() {
        // Check if user is logged in (from localStorage)
        const userData = localStorage.getItem('liora_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            // Hydrate roles/isAdmin from access_token if missing
            const lacksRoles = !Array.isArray(this.currentUser.roles) || this.currentUser.roles.length === 0;
            const notAdminFlag = this.currentUser.isAdmin !== true;
            if (lacksRoles || notAdminFlag) {
                try {
                    const token = localStorage.getItem('access_token');
                    if (token) {
                        const payload = this.parseJwt(token);
                        const roles = this.extractRolesFromPayload(payload);
                        const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
                        this.currentUser = { ...this.currentUser, roles, isAdmin };
                        localStorage.setItem('liora_user', JSON.stringify(this.currentUser));
                    }
                } catch (_) { }
            }
            this.updateUserDisplay();
        } else {
            this.updateUserDisplay();
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join(''));
            return JSON.parse(jsonPayload);
        } catch (_) { return {}; }
    }

    extractRolesFromPayload(payload) {
        try {
            if (!payload) return [];
            if (Array.isArray(payload.roles)) return payload.roles.map(r => String(r).toUpperCase());
            if (Array.isArray(payload.authorities)) return payload.authorities.map(r => String(r).toUpperCase());
            if (typeof payload.scope === 'string') return payload.scope.split(' ').map(r => r.toUpperCase());
            if (payload.realm_access && Array.isArray(payload.realm_access.roles)) return payload.realm_access.roles.map(r => r.toUpperCase());
            return [];
        } catch (_) { return []; }
    }

    updateUserDisplay() {
        const userSection = document.getElementById('user-section');
        const mobileUserSection = document.getElementById('mobile-user-section');

        if (this.currentUser) {
            const displayName = this.currentUser.name || this.currentUser.username || 'User';
            const rolesArr = Array.isArray(this.currentUser.roles) ? this.currentUser.roles.map(r => String(r).toUpperCase()) : [];
            const isAdmin = this.currentUser.isAdmin === true || rolesArr.includes('ADMIN') || rolesArr.includes('ROLE_ADMIN');
            const adminLink = isAdmin ? `<li><a class="dropdown-item" href="/admin" id="adminPanelLink"><i class="fas fa-tools me-2"></i>Trang quản trị</a></li>` : '';

            const userHTML = `
                <div class="dropdown">
                    <button class="btn btn-link text-dark p-2 nav-icon-btn dropdown-toggle" type="button" id="userMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle me-1"></i>${displayName}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
                        <li class="dropdown-header">Xin chào, ${displayName}</li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="/info" onclick="app.openUserInfo()"><i class="fas fa-id-card me-2"></i>Thông tin cá nhân</a></li>
                        ${adminLink}
                        <li><a class="dropdown-item" href="/home" onclick="app.signOut()"><i class="fas fa-sign-out-alt me-2"></i>Đăng xuất</a></li>
                    </ul>
                </div>
            `;

            const mobileUserHTML = `
                <div class="text-dark fw-medium mb-2">Hi, ${displayName}! 💕</div>
                <button class="btn btn-outline-pink w-100 rounded-pill mb-2" href="/info" onclick="app.openUserInfo()">
                    <i class="fas fa-id-card me-2"></i>Thông tin cá nhân
                </button>
                ${isAdmin ? '<a class="btn btn-outline-pink w-100 rounded-pill mb-2" href="/admin"><i class="fas fa-tools me-2"></i>Trang quản trị</a>' : ''}
                <button class="btn btn-outline-pink w-100 rounded-pill" href="/home" onclick="app.signOut()">
                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                </button>
            `;

            if (userSection) userSection.innerHTML = userHTML;
            if (mobileUserSection) mobileUserSection.innerHTML = mobileUserHTML;
        } else {
            const userHTML = `
                <button class="btn btn-link text-dark p-2 nav-icon-btn" data-bs-toggle="modal" data-bs-target="#authModal">
                    <i class="fas fa-user"></i>
                </button>
            `;

            const mobileUserHTML = `
                <button class="btn btn-pink-primary w-100 rounded-pill" data-bs-toggle="modal" data-bs-target="#authModal">
                    Sign In / Sign Up
                </button>
            `;

            if (userSection) userSection.innerHTML = userHTML;
            if (mobileUserSection) mobileUserSection.innerHTML = mobileUserHTML;
        }
    }

    signOut() {
        localStorage.removeItem('liora_user');
        localStorage.removeItem('access_token');
        try { document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=Lax'; } catch (_) { }
        this.currentUser = null;
        this.updateUserDisplay();
        this.showToast('Signed out successfully', 'success');
        document.dispatchEvent(new CustomEvent('user:logout'));

        // Always redirect to /home (works across pages like /info)
        try {
            if (window && window.location && window.location.pathname !== '/home') {
                window.location.href = '/home';
                return;
            }
        } catch (_) { }
        // Fallback for SPA context
        this.showPage('home');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();

        const toastHTML = `
            <div id="${toastId}" class="toast ${type}" role="alert">
                <div class="toast-header">
                    <i class="fas fa-${type === 'success' ? 'check-circle text-success' : type === 'error' ? 'exclamation-circle text-danger' : 'info-circle text-info'} me-2"></i>
                    <strong class="me-auto">Liora Cosmetic</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
        toast.show();

        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Open user info (placeholder: show toast; integrate profile modal/page later)
    openUserInfo() {
        if (!this.currentUser) {
            this.showToast('Bạn chưa đăng nhập', 'error');
            return;
        }
        const name = this.currentUser.name || this.currentUser.username || 'User';
        this.showToast(`Tài khoản: ${name}`, 'info');
        // TODO: navigate to profile page or open profile modal
        // window.location.href = '/profile';
    }
}

// Global function for page navigation (called from HTML onclick)
function showPage(pageName) {
    app.showPage(pageName);
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new LioraApp();
    // Ensure user UI renders after all fragments load
    setTimeout(() => {
        app.updateUserDisplay();
    }, 0);
});

// Export for use in other scripts
window.LioraApp = LioraApp;