/**
 * Product Detail Page JavaScript
 * Handles product detail page functionality
 */

class ProductDetailManager {
    constructor() {
        this.productId = this.getProductIdFromUrl();
        this.product = null;
        this.quantity = 1;
        this.maxStock = parseInt(document.getElementById('quantityInput')?.getAttribute('max') || '10');
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRelatedProducts();
        this.setupImageLightbox();
        this.initProgressBar();
    }

    getProductIdFromUrl() {
        const path = window.location.pathname;
        const matches = path.match(/\/products\/(\d+)/);
        return matches ? parseInt(matches[1]) : null;
    }

    bindEvents() {
        // Quantity validation events
        const quantityInput = document.getElementById('quantityInput');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => this.validateQuantity());
            quantityInput.addEventListener('change', () => this.validateQuantity());
            quantityInput.addEventListener('blur', () => this.validateQuantityOnBlur());
        }

        // Image lightbox
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.addEventListener('click', () => this.openImageLightbox());
        }
    }

    // Image Gallery Functions
    changeMainImage(thumbnail, imageUrl) {
        // Update main image
        const mainImage = document.getElementById('productDetailMainImage');
        if (mainImage) {
            mainImage.src = imageUrl;
        }

        // Update active thumbnail
        document.querySelectorAll('.product-detail-thumbnail-item').forEach(item => {
            item.classList.remove('active');
        });
        thumbnail.classList.add('active');
    }

    scrollImages(direction) {
        const thumbnails = document.querySelectorAll('.product-detail-thumbnail-item');
        const mainImage = document.getElementById('productDetailMainImage');
        
        if (thumbnails.length === 0 || !mainImage) {
            console.error('Required elements not found!');
            return;
        }
        
        // Find current active thumbnail
        let currentIndex = -1;
        thumbnails.forEach((thumb, index) => {
            if (thumb.classList.contains('active')) {
                currentIndex = index;
            }
        });
        
        if (currentIndex === -1) currentIndex = 0;
        
        // Calculate new index
        let newIndex;
        if (direction === 'up') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : thumbnails.length - 1;
        } else {
            newIndex = currentIndex < thumbnails.length - 1 ? currentIndex + 1 : 0;
        }
        
        // Update image and active state
        const targetThumbnail = thumbnails[newIndex];
        const targetImageUrl = targetThumbnail.dataset.imageUrl;
        
        mainImage.src = targetImageUrl;
        thumbnails.forEach(thumb => thumb.classList.remove('active'));
        targetThumbnail.classList.add('active');
    }

    openImageLightbox() {
        const mainImage = document.getElementById('mainProductImage');
        const lightboxImage = document.getElementById('lightboxImage');
        
        if (mainImage && lightboxImage) {
            lightboxImage.src = mainImage.src;
            lightboxImage.alt = mainImage.alt;
            
            const lightbox = new bootstrap.Modal(document.getElementById('imageLightbox'));
            lightbox.show();
        }
    }

    setupImageLightbox() {
        const lightbox = document.getElementById('imageLightbox');
        if (lightbox) {
            lightbox.addEventListener('show.bs.modal', () => {
                document.body.style.overflow = 'hidden';
            });
            
            lightbox.addEventListener('hide.bs.modal', () => {
                document.body.style.overflow = 'auto';
            });
        }
    }

    // Quantity Management
    validateQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        const errorDiv = document.getElementById('quantityError');
        const errorMessage = document.getElementById('quantityErrorMessage');
        
        if (!quantityInput || !errorDiv || !errorMessage) return;
        
        const currentValue = parseInt(quantityInput.value) || 0;
        
        // Allow empty input for better UX
        if (quantityInput.value === '' || quantityInput.value === '0') {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
            return;
        }
        
        if (currentValue > this.maxStock) {
            errorDiv.style.display = 'block';
            errorMessage.textContent = `Số lượng tối đa bạn có thể mua là ${this.maxStock}.`;
            quantityInput.classList.add('is-invalid');
            quantityInput.value = this.maxStock;
        } else if (currentValue < 1) {
            errorDiv.style.display = 'block';
            errorMessage.textContent = 'Số lượng tối thiểu là 1.';
            quantityInput.classList.add('is-invalid');
            quantityInput.value = 1;
        } else {
            errorDiv.style.display = 'none';
            quantityInput.classList.remove('is-invalid');
        }
    }

    validateQuantityOnBlur() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;
        
        const currentValue = parseInt(quantityInput.value) || 0;
        
        if (quantityInput.value === '' || currentValue < 1) {
            quantityInput.value = 1;
            this.validateQuantity();
        }
    }

    incrementQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;
        
        const currentValue = parseInt(quantityInput.value) || 0;
        
        if (currentValue < this.maxStock) {
            quantityInput.value = currentValue + 1;
            this.validateQuantity();
        }
    }

    decrementQuantity() {
        const quantityInput = document.getElementById('quantityInput');
        if (!quantityInput) return;
        
        const currentValue = parseInt(quantityInput.value) || 0;
        
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            this.validateQuantity();
        }
    }

    // Cart Functions
    addToCart() {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        
        if (quantity > this.maxStock) {
            this.showNotification(`Số lượng bạn chọn (${quantity}) vượt quá số lượng tồn kho hiện có (${this.maxStock} sản phẩm). Vui lòng chọn số lượng phù hợp.`, 'error');
            return;
        }

        // Add to global cart if available
        if (window.app && window.app.cartItems) {
            const existingItem = window.app.cartItems.find(item => item.id === this.productId);
            
            if (existingItem) {
                const newTotalQuantity = existingItem.quantity + quantity;
                if (newTotalQuantity > this.maxStock) {
                    this.showNotification(`Tổng số lượng trong giỏ hàng (${newTotalQuantity}) vượt quá tồn kho hiện có (${this.maxStock} sản phẩm). Vui lòng giảm số lượng.`, 'error');
                    return;
                }
                existingItem.quantity = newTotalQuantity;
            } else {
                // Get product data from page
                const productData = this.getProductDataFromPage();
                if (productData) {
                    window.app.cartItems.push({
                        ...productData,
                        quantity: quantity
                    });
                }
            }
            
            // Update cart display
            if (window.app.updateCartDisplay) {
                window.app.updateCartDisplay();
            }
        }

        this.showNotification(`${quantity} x ${document.querySelector('.product-name').textContent} đã được thêm vào giỏ hàng thành công! 🛍️`, 'success');
    }

    buyNow() {
        const quantityInput = document.getElementById('quantityInput');
        const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
        
        if (quantity > this.maxStock) {
            this.showNotification(`Số lượng bạn chọn (${quantity}) vượt quá số lượng tồn kho hiện có (${this.maxStock} sản phẩm). Vui lòng chọn số lượng phù hợp.`, 'error');
            return;
        }

        // Add to cart silently
        if (window.app && window.app.cartItems) {
            const existingItem = window.app.cartItems.find(item => item.id === this.productId);
            
            if (existingItem) {
                const newTotalQuantity = existingItem.quantity + quantity;
                if (newTotalQuantity > this.maxStock) {
                    this.showNotification(`Tổng số lượng trong giỏ hàng (${newTotalQuantity}) vượt quá tồn kho hiện có (${this.maxStock} sản phẩm). Vui lòng giảm số lượng.`, 'error');
                    return;
                }
                existingItem.quantity = newTotalQuantity;
            } else {
                const productData = this.getProductDataFromPage();
                if (productData) {
                    window.app.cartItems.push({
                        ...productData,
                        quantity: quantity
                    });
                }
            }
            
            if (window.app.updateCartDisplay) {
                window.app.updateCartDisplay();
            }
        }
        
        this.showNotification(`${quantity} x ${document.querySelector('.product-name').textContent} đã được thêm vào giỏ hàng! Đang chuyển đến trang thanh toán...`, 'success');
        
        // Redirect to checkout
        setTimeout(() => {
            window.location.href = '/checkout';
        }, 1500);
    }

    toggleWishlist() {
        // Toggle wishlist functionality
        const wishlistBtn = document.querySelector('[onclick="toggleWishlist()"]');
        const icon = wishlistBtn.querySelector('i');
        
        if (icon.classList.contains('fas')) {
            // Remove from wishlist
            icon.classList.remove('fas');
            icon.classList.add('far');
            wishlistBtn.innerHTML = '<i class="far fa-heart me-2"></i>Thêm vào yêu thích';
            this.showNotification('Đã xóa khỏi danh sách yêu thích', 'info');
        } else {
            // Add to wishlist
            icon.classList.remove('far');
            icon.classList.add('fas');
            wishlistBtn.innerHTML = '<i class="fas fa-heart me-2"></i>Đã thêm vào yêu thích';
            this.showNotification('Đã thêm vào danh sách yêu thích! 💕', 'success');
        }
    }

    getProductDataFromPage() {
        const productName = document.querySelector('.product-name')?.textContent;
        const productPrice = document.querySelector('.current-price')?.textContent;
        const productImage = document.querySelector('#mainProductImage')?.src;
        
        if (productName && productPrice) {
            return {
                id: this.productId,
                name: productName,
                price: parseFloat(productPrice.replace(/[^\d]/g, '')) / 1000, // Convert from VND format
                image: productImage,
                stock: this.maxStock
            };
        }
        return null;
    }

    // Related Products
    async loadRelatedProducts() {
        try {
            const response = await fetch(`/product/api/related/${this.productId}`);
            if (response.ok) {
                const products = await response.json();
                this.renderRelatedProducts(products);
            }
        } catch (error) {
            console.error('Error loading related products:', error);
        }
    }

    renderRelatedProducts(products) {
        const container = document.getElementById('relatedProducts');
        if (!container || !products || products.length === 0) return;

        const productsHTML = products.slice(0, 4).map(product => `
            <div class="col-lg-3 col-md-6">
                <div class="card h-100">
                    <img src="${product.image || '/uploads/products/default.jpg'}" 
                         class="card-img-top" 
                         alt="${product.name}">
                    <div class="card-body">
                        <h6 class="card-title">${product.name}</h6>
                        <p class="card-text">${this.formatPrice(product.price)}</p>
                        <a href="/product/${product.id}" class="btn btn-outline-pink btn-sm">
                            Xem chi tiết
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHTML;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        const toastId = 'toast-' + Date.now();
        
        const toastHTML = `
            <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0" 
                 id="${toastId}" role="alert">
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

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }
}

// Global functions for HTML onclick events
function changeMainImage(thumbnail, imageUrl) {
    if (window.productDetailManager) {
        window.productDetailManager.changeMainImage(thumbnail, imageUrl);
    }
}

function productDetailScroll(direction) {
    if (window.productDetailManager) {
        window.productDetailManager.scrollImages(direction);
    }
}

function incrementQuantity() {
    if (window.productDetailManager) {
        window.productDetailManager.incrementQuantity();
    }
}

function decrementQuantity() {
    if (window.productDetailManager) {
        window.productDetailManager.decrementQuantity();
    }
}

function validateQuantity() {
    if (window.productDetailManager) {
        window.productDetailManager.validateQuantity();
    }
}

function validateQuantityOnBlur() {
    if (window.productDetailManager) {
        window.productDetailManager.validateQuantityOnBlur();
    }
}

// Add methods to ProductDetailManager class
ProductDetailManager.prototype.initProgressBar = function() {
        const progressBar = document.querySelector('.product-detail-progress-bar');
        if (!progressBar) {
            console.log('Progress bar not found');
            return;
        }

        console.log('Initializing progress bar...');
        
        // Force the background
        progressBar.style.background = 'linear-gradient(90deg, #E8A2B0 0%, #C97089 100%)';
        progressBar.style.backgroundColor = '#E8A2B0';
        progressBar.style.display = 'block';
        progressBar.style.height = '100%';
        
        // Calculate width dynamically from soldCount
        const soldCountElement = document.querySelector('.product-detail-sales-count');
        if (soldCountElement) {
            const soldCount = parseInt(soldCountElement.textContent) || 0;
            console.log('Found soldCount:', soldCount);
            
            // Calculate progress using same logic as Java SalesProgressUtil
            let progress = this.calculateSalesProgress(soldCount);
            const widthPercent = progress.toFixed(1) + '%';
            
            progressBar.style.width = widthPercent;
            console.log('Calculated width for soldCount', soldCount, ':', widthPercent);
        } else {
            console.log('soldCount element not found');
        }
        
        console.log('Progress bar initialized with width:', progressBar.style.width);
};

ProductDetailManager.prototype.calculateSalesProgress = function(soldCount) {
        const thresholds = [
            { max: 50, percentage: 30 },      // 0-50: 0-30%
            { max: 100, percentage: 40 },     // 50-100: 30-40%
            { max: 500, percentage: 55 },     // 100-500: 40-55%
            { max: 1000, percentage: 70 },    // 500-1000: 55-70%
            { max: 5000, percentage: 85 },    // 1000-5000: 70-85%
            { max: 10000, percentage: 95 },   // 5000-10000: 85-95%
            { max: Infinity, percentage: 100 } // >10000: 95-100%
        ];
        
        for (let i = 0; i < thresholds.length; i++) {
            const { max, percentage } = thresholds[i];
            
            if (soldCount <= max) {
                // Get previous threshold percentage
                const basePercentage = (i > 0) ? thresholds[i-1].percentage : 0;
                
                // Calculate progress within this threshold
                const prevMax = (i > 0) ? thresholds[i-1].max : 0;
                const range = max - prevMax;
                
                if (range > 0) {
                    const progress = ((soldCount - prevMax) / range) * (percentage - basePercentage);
                    return Math.min(100, Math.max(0, basePercentage + progress));
                } else {
                    return basePercentage;
                }
            }
        }
        
        return 100; // For very high sales
};

function addToCart() {
    if (window.productDetailManager) {
        window.productDetailManager.addToCart();
    }
}

function buyNow() {
    if (window.productDetailManager) {
        window.productDetailManager.buyNow();
    }
}

function toggleWishlist() {
    if (window.productDetailManager) {
        window.productDetailManager.toggleWishlist();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productDetailManager = new ProductDetailManager();
});
