// Product Rating Utilities
class ProductRatingUtils {
    static async loadReviewStatistics(productIds) {
        if (!productIds || productIds.length === 0) {
            console.log('No product IDs provided');
            return {};
        }

        console.log('Loading review statistics for product IDs:', productIds);

        try {
            const response = await fetch('/api/reviews/products/statistics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productIds)
            });

            console.log('API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('API response data:', data);
                return data;
            } else {
                const errorText = await response.text();
                console.warn('Failed to load review statistics:', response.status, errorText);
                return {};
            }
        } catch (error) {
            console.error('Error loading review statistics:', error);
            return {};
        }
    }

    static createStarRatingHTML(averageRating, reviewCount) {
        const rating = averageRating || 0;
        const count = reviewCount || 0;
        
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const decimalPart = rating % 1;
        const hasHalfStar = decimalPart > 0;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                // Full star
                starsHTML += `
                    <div class="star filled">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                `;
            } else if (i === fullStars + 1 && hasHalfStar) {
                // Half star
                starsHTML += `
                    <div class="star half">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffc107" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                `;
            } else {
                // Empty star
                starsHTML += `
                    <div class="star empty">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                `;
            }
        }

        return `
            <div class="product-rating">
                <div class="star-rating">
                    ${starsHTML}
                </div>
                <span class="rating-count">(${count})</span>
            </div>
        `;
    }

    static updateProductCardRating(cardElement, productId, statistics) {
        const productStats = statistics[productId.toString()];
        if (!productStats) {
            console.log('No stats found for product:', productId);
            return;
        }

        const averageRating = productStats.averageRating || 0;
        const reviewCount = productStats.totalReviews || 0;

        console.log('Updating rating for product', productId, ':', averageRating, 'stars,', reviewCount, 'reviews');

        // Tìm rating container
        let ratingContainer = cardElement.querySelector('.product-rating');
        console.log('Found rating container:', ratingContainer);
        
        if (!ratingContainer) {
            console.log('No rating container found, creating new one');
            // Tạo rating container mới
            const cardBody = cardElement.querySelector('.card-body');
            if (cardBody) {
                const title = cardBody.querySelector('.card-title, .product-title');
                if (title) {
                    ratingContainer = document.createElement('div');
                    ratingContainer.className = 'product-rating mb-2';
                    title.insertAdjacentElement('afterend', ratingContainer);
                    console.log('Created new rating container');
                }
            }
        }

        if (ratingContainer) {
            const newHTML = this.createStarRatingHTML(averageRating, reviewCount);
            console.log('Updating rating HTML:', newHTML);
            ratingContainer.innerHTML = newHTML;
        } else {
            console.error('Could not find or create rating container for product:', productId);
        }
    }

    static async loadAndUpdateProductCards(productCards) {
        if (!productCards || productCards.length === 0) return;

        console.log('Loading ratings for', productCards.length, 'product cards');

        // Lấy danh sách product IDs
        const productIds = Array.from(productCards).map(card => {
            const productId = card.dataset.productId || 
                            card.querySelector('[data-product-id]')?.dataset.productId ||
                            card.querySelector('a[href*="/product/"]')?.href.match(/\/product\/(\d+)/)?.[1];
            console.log('Product ID detected:', productId, 'from card:', card);
            return productId ? parseInt(productId) : null;
        }).filter(id => id !== null);

        console.log('Product IDs to load:', productIds);

        if (productIds.length === 0) {
            console.log('No valid product IDs found');
            return;
        }

        // Load review statistics
        const statistics = await this.loadReviewStatistics(productIds);
        console.log('Loaded statistics:', statistics);

        // Update each card
        productCards.forEach(card => {
            const productId = card.dataset.productId || 
                            card.querySelector('[data-product-id]')?.dataset.productId ||
                            card.querySelector('a[href*="/product/"]')?.href.match(/\/product\/(\d+)/)?.[1];
            
            if (productId) {
                console.log('Updating rating for product:', productId);
                this.updateProductCardRating(card, parseInt(productId), statistics);
            }
        });
    }
}

// Auto-load ratings for product cards on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('ProductRatingUtils: DOM loaded, starting auto-load...');
    
    // Delay để đảm bảo các script khác đã load xong
    setTimeout(function() {
        loadExistingProductCards();
        setupMutationObserver();
    }, 1000);
});

function loadExistingProductCards() {
    console.log('ProductRatingUtils: Loading existing product cards...');
    const productCards = document.querySelectorAll('.product-card, .card.product-card');
    console.log('ProductRatingUtils: Found', productCards.length, 'existing product cards');
    
    if (productCards.length > 0) {
        ProductRatingUtils.loadAndUpdateProductCards(productCards);
    }
}

function setupMutationObserver() {
    console.log('ProductRatingUtils: Setting up mutation observer...');
    
    // Observer để load ratings cho product cards được thêm động
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    const newProductCards = node.querySelectorAll ? 
                        node.querySelectorAll('.product-card, .card.product-card') : [];
                    
                    if (newProductCards.length > 0) {
                        console.log('ProductRatingUtils: Found', newProductCards.length, 'new product cards');
                        ProductRatingUtils.loadAndUpdateProductCards(newProductCards);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Export function để có thể gọi từ bên ngoài
window.loadProductRatings = loadExistingProductCards;
