/**
 * Bestseller Products Manager for Homepage
 * Manages bestseller products display and interactions on homepage
 */
class BestsellerProductsHomepageManager {
    constructor() {
        this.allProducts = [];
        this.gridEl = document.getElementById('homepageBestsellerProductsGrid');
        this.loadingEl = document.getElementById('homepageBestsellerProductsLoading');
        this.emptyEl = document.getElementById('homepageBestsellerProductsEmpty');
        this.prevBtn = document.getElementById('homepageBestsellerPrevBtn');
        this.nextBtn = document.getElementById('homepageBestsellerNextBtn');

        if (!this.gridEl) {
            console.warn('Homepage bestseller products grid not found');
            return;
        }

        this.init();
    }

    init() {
        this.loadBestsellerProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.scrollLeft());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.scrollRight());
        }
    }

    async loadBestsellerProducts() {
        try {
            this.showLoading();

            console.log('Loading bestseller products...');
            const response = await fetch('/api/products/best-selling?limit=8');
            const data = await response.json();

            console.log('API Response:', data);

            if (data.code === 1000 && data.result && data.result.length > 0) {
                this.allProducts = data.result;
                console.log('Loaded products:', this.allProducts);
                this.renderBestsellerProducts(this.allProducts);

                this.gridEl.addEventListener('scroll', () => this.updateNavigationButtons());

                // Update navigation buttons immediately after rendering
                this.updateNavigationButtons();
            } else {
                console.log('No products found or API error:', data);
                this.showEmpty();
            }
        } catch (error) {
            console.error('Error loading bestseller products:', error);
            this.showEmpty();
        }
    }

    showLoading() {
        if (this.loadingEl) this.loadingEl.style.display = 'block';
        if (this.emptyEl) this.emptyEl.style.display = 'none';
        if (this.gridEl) this.gridEl.style.display = 'none';
    }

    showEmpty() {
        if (this.loadingEl) this.loadingEl.style.display = 'none';
        if (this.emptyEl) this.emptyEl.style.display = 'block';
        if (this.gridEl) this.gridEl.style.display = 'none';
    }

    renderBestsellerProducts(products) {
        if (!this.gridEl) return;

        const productsHTML = products.map(product => this.createProductCard(product)).join('');
        this.gridEl.innerHTML = productsHTML;

        if (this.loadingEl) this.loadingEl.style.display = 'none';
        if (this.emptyEl) this.emptyEl.style.display = 'none';
        if (this.gridEl) this.gridEl.style.display = 'flex';
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
            <div class="product-card ${statusClass}">
                <div class="position-relative">
                    <img src="${this.getMainImageUrl(product)}" 
                         class="card-img-top" 
                         alt="${productName}"
                         onerror="this.src='/user/img/default-product.jpg'"
                         onclick="window.location.href='/product/${productId}'"
                         style="cursor: pointer;">
                    
                    <div class="product-actions">
                        <button class="quick-view-btn" 
                                onclick="if(window.homepageBestsellerProductsManager) window.homepageBestsellerProductsManager.showQuickView(${productId}); else alert('Chức năng đang được tải...');"
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
                                <button class="add-to-cart-icon homepage-bestseller-cart-btn" 
                                        data-product-id="${productId}"
                                        data-product-name="${productName}"
                                        data-product-price="${currentPrice}"
                                        title="Thêm vào giỏ"
                                        onclick="event.preventDefault(); event.stopPropagation(); window.homepageBestsellerProductsManager.addToCart(${productId}, '${productName}', ${currentPrice})">
                                    <i class="fas fa-shopping-cart"></i>
                                </button>
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

        return '/user/img/default-product.jpg';
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

    scrollLeft() {
        if (this.gridEl) {
            const cardWidth = 280 + 24; // card width + gap
            this.gridEl.scrollBy({
                left: -cardWidth,
                behavior: 'smooth'
            });

            // Update buttons after scroll animation
            setTimeout(() => {
                this.updateNavigationButtons();
            }, 300);
        }
    }

    scrollRight() {
        if (this.gridEl) {
            const cardWidth = 280 + 24; // card width + gap
            this.gridEl.scrollBy({
                left: cardWidth,
                behavior: 'smooth'
            });

            // Update buttons after scroll animation
            setTimeout(() => {
                this.updateNavigationButtons();
            }, 300);
        }
    }

    updateNavigationButtons() {
        if (!this.gridEl || !this.allProducts) return;

        const navigationContainer = document.querySelector('.bestseller-products-homepage-section .navigation-buttons');

        if (this.allProducts.length <= 4) {
            console.log('Hiding navigation buttons - 4 or fewer products');
            if (navigationContainer) {
                navigationContainer.classList.add('hidden');
            }
            if (this.prevBtn) {
                this.prevBtn.disabled = true;
            }
            if (this.nextBtn) {
                this.nextBtn.disabled = true;
            }
            return;
        }

        console.log('Showing navigation buttons - more than 4 products');
        if (navigationContainer) {
            navigationContainer.classList.remove('hidden');
        }

        const scrollLeft = this.gridEl.scrollLeft;
        const maxScrollLeft = this.gridEl.scrollWidth - this.gridEl.clientWidth;

        // Add small tolerance for floating point precision
        const isAtStart = scrollLeft <= 1;
        const isAtEnd = scrollLeft >= (maxScrollLeft - 1);

        console.log('Bestseller navigation buttons update:', {
            scrollLeft,
            maxScrollLeft,
            scrollWidth: this.gridEl.scrollWidth,
            clientWidth: this.gridEl.clientWidth,
            productsLength: this.allProducts.length,
            isAtStart,
            isAtEnd,
            prevBtnExists: !!this.prevBtn,
            nextBtnExists: !!this.nextBtn
        });

        if (this.prevBtn) {
            this.prevBtn.disabled = isAtStart;
            console.log('Bestseller prev button disabled:', isAtStart);
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = isAtEnd;
            console.log('Bestseller next button disabled:', isAtEnd);
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
                const product = this.allProducts.find(p => (p.productId || p.id) === productId);
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
        const product = this.allProducts.find(p => (p.productId || p.id) === productId);
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
                <div class="modal-dialog modal-dialog-centered">
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
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.homepageBestsellerProductsManager.decrementQuantity('${product.productId || product.id}')">-</button>
                                                <input type="number" class="form-control text-center" value="1" min="1" max="${Math.min(product.stock || 10, 99)}" id="homepageBestsellerQuantityInput_${product.productId || product.id}" onchange="window.homepageBestsellerProductsManager.validateQuantity('${product.productId || product.id}')" oninput="window.homepageBestsellerProductsManager.validateQuantity('${product.productId || product.id}')" onblur="window.homepageBestsellerProductsManager.validateQuantityOnBlur('${product.productId || product.id}')">
                                                <button class="btn btn-outline-secondary" type="button" onclick="window.homepageBestsellerProductsManager.incrementQuantity('${product.productId || product.id}')">+</button>
                                            </div>
                                        </div>
                                        <!-- Error Message -->
                                        <div id="homepageBestsellerQuantityError_${product.productId || product.id}" class="text-danger mt-2" style="display: none;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            <span id="homepageBestsellerQuantityErrorMessage_${product.productId || product.id}">Số lượng tối đa bạn có thể mua là ${Math.min(product.stock || 10, 99)}.</span>
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
                            onclick="window.homepageBestsellerProductsManager.buyNow(${product.productId || product.id})">
                        <i class="fas fa-bolt me-1"></i>
                        Mua ngay
                    </button>
                </div>
                <div class="col-6">
                    <button class="btn btn-primary btn-lg w-100" 
                            onclick="event.preventDefault(); event.stopPropagation(); window.homepageBestsellerProductsManager.addToCartWithQuantity(${product.productId || product.id})">
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
            const prevBtn = document.getElementById('homepageBestsellerModalPrevBtn');
            const nextBtn = document.getElementById('homepageBestsellerModalNextBtn');
            const mainImage = document.getElementById('homepageBestsellerModalMainProductImage');
            const thumbnails = document.querySelectorAll('#homepageBestsellerQuickViewModal .thumbnail-item');

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
        const quantityInput = document.getElementById(`homepageBestsellerQuantityInput_${productId}`);
        if (quantityInput) {
            let currentValue = parseInt(quantityInput.value) || 0;
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.validateQuantity(productId);
            }
        }
    }

    incrementQuantity(productId) {
        const quantityInput = document.getElementById(`homepageBestsellerQuantityInput_${productId}`);
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
        const quantityInput = document.getElementById(`homepageBestsellerQuantityInput_${productId}`);
        const errorDiv = document.getElementById(`homepageBestsellerQuantityError_${productId}`);
        const errorMessage = document.getElementById(`homepageBestsellerQuantityErrorMessage_${productId}`);

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
        const quantityInput = document.getElementById(`homepageBestsellerQuantityInput_${productId}`);
        if (quantityInput && (quantityInput.value === '' || quantityInput.value === '0')) {
            quantityInput.value = 1;
        }
        this.validateQuantity(productId);
    }

    // Buy now functionality
    async buyNow(productId) {
        const product = this.allProducts.find(p => (p.productId || p.id) === productId);
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
        const product = this.allProducts.find(p => (p.productId || p.id) === productId);
        if (!product) {
            this.showNotification('Không tìm thấy sản phẩm', 'error');
            return;
        }

        // Get quantity from input using unique ID
        const quantityInput = document.getElementById(`homepageBestsellerQuantityInput_${productId}`);
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        // Add to cart with quantity
        this.addToCartWithQuantityValue(productId, product.name, product.currentPrice || product.price, quantity);

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('homepageBestsellerQuickViewModal'));
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
                    const product = this.allProducts.find(p => (p.productId || p.id) === productId);
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

        let container = document.querySelector('.homepage-bestseller-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'homepage-bestseller-toast-container';
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
    if (document.getElementById('homepageBestsellerProductsGrid')) {
        window.homepageBestsellerProductsManager = new BestsellerProductsHomepageManager();
    }
});
