// Order Detail JavaScript
function cancelOrder(orderId) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Vui lòng đăng nhập để thực hiện thao tác này');
            return;
        }

        fetch(`/order/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Hủy đơn hàng thành công!');
                window.location.reload();
            } else {
                return response.json().then(errorData => {
                    alert('Lỗi: ' + (errorData.message || 'Không thể hủy đơn hàng'));
                });
            }
        })
        .catch(error => {
            alert('Có lỗi xảy ra khi hủy đơn hàng');
        });
    }
}

async function reorderOrder(orderId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Vui lòng đăng nhập để thực hiện thao tác này');
        return;
    }

    try {
        const response = await fetch(`/api/orders/${orderId}/items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            alert('Không thể tải thông tin đơn hàng');
            return;
        }

        const orderProducts = await response.json();
        
        // Kiểm tra từng sản phẩm có hợp lệ không
        const validProducts = [];
        const invalidProducts = [];

        for (const orderProduct of orderProducts) {
            // Kiểm tra thông tin sản phẩm hiện tại
            const productResponse = await fetch(`/api/products/${orderProduct.idProduct}`);
            if (productResponse.ok) {
                const productInfo = await productResponse.json();
                
                // Kiểm tra sản phẩm còn hàng và đang bán
                if (productInfo.available && productInfo.isActive && productInfo.stock > 0) {
                    validProducts.push({
                        idProduct: orderProduct.idProduct,
                        quantity: orderProduct.quantity,
                        productName: orderProduct.productName
                    });
                } else {
                    invalidProducts.push({
                        productName: orderProduct.productName,
                        reason: !productInfo.available ? 'không còn bán' : 
                                !productInfo.isActive ? 'đã ngừng bán' : 'hết hàng'
                    });
                }
            } else {
                invalidProducts.push({
                    productName: orderProduct.productName,
                    reason: 'không tìm thấy'
                });
            }
        }

        // Hiển thị thông báo về sản phẩm không hợp lệ
        if (invalidProducts.length > 0) {
            let message = 'Một số sản phẩm không thể mua lại:\n';
            invalidProducts.forEach(product => {
                message += `• ${product.productName}: ${product.reason}\n`;
            });
            
            if (validProducts.length === 0) {
                alert(message + '\nKhông có sản phẩm nào hợp lệ để mua lại.');
                return;
            } else {
                if (!confirm(message + '\n\nBạn có muốn thêm các sản phẩm hợp lệ vào giỏ hàng không?')) {
                    return;
                }
            }
        }

        // Lấy thông tin giỏ hàng hiện tại
        const cartResponse = await fetch('/api/user/cart', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!cartResponse.ok) {
            alert('Không thể lấy thông tin giỏ hàng');
            return;
        }

        const cartInfo = await cartResponse.json();
        const cartId = cartInfo.idCart;

        // Thêm từng sản phẩm hợp lệ vào giỏ hàng
        let successCount = 0;
        for (const product of validProducts) {
            try {
                const addToCartResponse = await fetch(`/CartProduct/${cartId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idProduct: product.idProduct,
                        quantity: product.quantity
                    })
                });

                if (addToCartResponse.ok) {
                    successCount++;
                }
            } catch (error) {
                console.error(`Error adding ${product.productName} to cart:`, error);
            }
        }

        // Hiển thị kết quả
        if (successCount === validProducts.length) {
            showReorderSuccess(successCount);
        } else {
            alert(`Đã thêm ${successCount}/${validProducts.length} sản phẩm vào giỏ hàng.`);
        }

        // Refresh giỏ hàng nếu có cartManager
        if (window.cartManager && typeof window.cartManager.refreshCart === 'function') {
            window.cartManager.refreshCart();
        }

    } catch (error) {
        console.error('Error reordering:', error);
        alert('Có lỗi xảy ra khi thực hiện mua lại');
    }
}

function showReorderSuccess(count) {
    // Tạo modal thông báo thành công với tick
    const modalHtml = `
        <div class="modal fade" id="reorderSuccessModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center py-4">
                        <div class="mb-3">
                            <i class="fas fa-check-circle text-success" style="font-size: 3rem;"></i>
                        </div>
                        <h5 class="text-success mb-3">Mua lại thành công!</h5>
                        <p class="mb-3">Đã thêm ${count} sản phẩm vào giỏ hàng của bạn.</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Tiếp tục mua sắm
                            </button>
                            <a href="/cart" class="btn btn-primary">
                                <i class="fas fa-shopping-cart me-1"></i> Xem giỏ hàng
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('reorderSuccessModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Thêm modal mới
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('reorderSuccessModal'));
    modal.show();
    
    // Tự động ẩn modal sau 5 giây
    setTimeout(() => {
        modal.hide();
    }, 5000);
}

// Review functionality
let currentOrderId = null;
let orderProducts = [];

// Check if we should open review modal on page load
$(document).ready(function() {
    // Check if URL has #review hash
    if (window.location.hash === '#review') {
        // Get order ID from URL path
        const pathParts = window.location.pathname.split('/');
        const orderId = pathParts[pathParts.length - 1];
        if (orderId && !isNaN(orderId)) {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                openReviewModal(parseInt(orderId));
            }, 500);
        }
    }
});

function openReviewModal(orderId) {
    currentOrderId = orderId;
    loadOrderProductsForReview(orderId);
}

async function loadOrderProductsForReview(orderId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Vui lòng đăng nhập để đánh giá');
        return;
    }

    try {
        const response = await fetch(`/api/orders/${orderId}/items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const products = await response.json();
            orderProducts = products;
            renderReviewProducts(products);
            $('#reviewModal').modal('show');
        } else {
            alert('Không thể tải danh sách sản phẩm');
        }
    } catch (error) {
        console.error('Error loading order products:', error);
        alert('Có lỗi xảy ra khi tải danh sách sản phẩm');
    }
}

function renderReviewProducts(products) {
    const container = $('#reviewProductsList');
    container.empty();

    if (!products || products.length === 0) {
        container.html('<p class="text-muted">Không có sản phẩm nào để đánh giá</p>');
        return;
    }

    products.forEach((product, index) => {
        const productHtml = `
            <div class="card mb-3" data-order-product-id="${product.idOrderProduct}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="${product.mainImageUrl || '/uploads/products/placeholder.jpg'}" 
                                 alt="${product.productName}" 
                                 class="img-thumbnail" 
                                 style="width: 80px; height: 80px; object-fit: cover;">
                        </div>
                        <div class="col-md-4">
                            <h6 class="mb-1">${product.productName}</h6>
                            <small class="text-muted">${product.brandName || ''}</small>
                        </div>
                        <div class="col-md-3">
                            <div class="rating-section">
                                <label class="form-label small">Đánh giá:</label>
                                <div class="star-rating">
                                    ${[1,2,3,4,5].map(star => `
                                        <i class="fas fa-star star" data-rating="${star}" style="cursor: pointer; color: #ddd; font-size: 1.2em;"></i>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="review-content">
                                <label class="form-label small">Nhận xét:</label>
                                <textarea class="form-control form-control-sm" 
                                          rows="2" 
                                          placeholder="Nhập nhận xét của bạn..." 
                                          data-order-product-id="${product.idOrderProduct}"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.append(productHtml);
    });

    // Add star rating functionality
    $('.star-rating .star').click(function() {
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');
        
        // Update star colors
        stars.each(function(index) {
            if (index < rating) {
                $(this).css('color', '#ffc107');
            } else {
                $(this).css('color', '#ddd');
            }
        });
        
        // Store rating
        $(this).closest('.card').data('rating', rating);
    });
}

async function submitAllReviews() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Vui lòng đăng nhập để đánh giá');
        return;
    }

    const reviews = [];
    let hasValidReview = false;

    $('.card[data-order-product-id]').each(function() {
        const orderProductId = $(this).data('order-product-id');
        const rating = $(this).data('rating');
        const content = $(this).find('textarea').val().trim();

        if (rating && rating >= 1 && rating <= 5) {
            reviews.push({
                orderProductId: orderProductId,
                rating: rating,
                content: content || '',
                anonymous: false
            });
            hasValidReview = true;
        }
    });

    if (!hasValidReview) {
        alert('Vui lòng đánh giá ít nhất một sản phẩm');
        return;
    }

    try {
        // Submit each review
        for (const review of reviews) {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(review)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể gửi đánh giá');
            }
        }

        alert('Đánh giá thành công! Cảm ơn bạn đã đánh giá sản phẩm.');
        $('#reviewModal').modal('hide');
        
    } catch (error) {
        console.error('Error submitting reviews:', error);
        alert('Lỗi: ' + error.message);
    }
}
