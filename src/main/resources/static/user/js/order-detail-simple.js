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

            // Kiểm tra review đã tồn tại cho từng sản phẩm
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    product.hasReview = reviewData.exists;
                    product.existingReview = reviewData.review;
                } else {
                    product.hasReview = false;
                }
            }

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
        const isReviewed = product.hasReview;
        const existingReview = product.existingReview;
        
        const productHtml = `
            <div class="card mb-4 ${isReviewed ? 'border-success' : ''}" data-order-product-id="${product.idOrderProduct}">
                <div class="card-body">
                    <!-- Hình ảnh và tên sản phẩm -->
                    <div class="row align-items-center mb-3">
                        <div class="col-md-2">
                            <img src="${product.mainImageUrl || '/uploads/products/placeholder.jpg'}" 
                                 alt="${product.productName}" 
                                 class="img-thumbnail" 
                                 style="width: 100px; height: 100px; object-fit: cover;">
                        </div>
                        <div class="col-md-10">
                            <h6 class="mb-1 fw-bold">${product.productName}</h6>
                            <small class="text-muted">${product.brandName || ''}</small>
                            ${isReviewed ? '<span class="badge bg-success ms-2">Đã đánh giá</span>' : ''}
                        </div>
                    </div>
                    
                    <!-- Phần đánh giá sao -->
                    <div class="mb-3">
                        <label class="form-label fw-medium">Đánh giá:</label>
                        <div class="star-rating">
                            <div class="star" data-rating="1">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star" data-rating="2">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star" data-rating="3">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star" data-rating="4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                            <div class="star" data-rating="5">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ô nhập nội dung -->
                    <div class="mb-3">
                        <label class="form-label fw-medium">Nhận xét:</label>
                        <textarea class="form-control" 
                                  rows="3" 
                                  placeholder="${isReviewed ? 'Đã đánh giá' : 'Nhập nhận xét của bạn...'}" 
                                  data-order-product-id="${product.idOrderProduct}"
                                  ${isReviewed ? 'readonly' : ''}>${isReviewed && existingReview ? existingReview.content : ''}</textarea>
                    </div>
                    
                    <!-- Checkbox ẩn danh -->
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               id="anonymous_${product.idOrderProduct}" 
                               data-order-product-id="${product.idOrderProduct}"
                               ${isReviewed && existingReview && existingReview.anonymous ? 'checked' : ''}
                               ${isReviewed ? 'disabled' : ''}>
                        <label class="form-check-label text-muted small" 
                               for="anonymous_${product.idOrderProduct}">
                            Ẩn danh khi đánh giá
                        </label>
                    </div>
                    
                    ${isReviewed ? `
                        <div class="mt-3">
                            <button type="button" class="btn btn-outline-primary btn-sm" 
                                    onclick="editReview(${product.idOrderProduct})">
                                <i class="fas fa-edit me-1"></i> Sửa đánh giá
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        container.append(productHtml);
    });

    // Add star rating functionality
    $('.star-rating .star').click(function() {
        const card = $(this).closest('.card');
        if (card.hasClass('border-success')) return; // Đã đánh giá rồi
        
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');
        
        // Update star states
        stars.each(function(index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });
        
        // Store rating
        card.data('rating', rating);
    });

    // Nếu đã có review, hiển thị sao đã được chọn
    $('.card[data-order-product-id]').each(function() {
        const card = $(this);
        const orderProductId = card.data('order-product-id');

        // Tìm existingReview cho sản phẩm này
        const product = products.find(p => p.idOrderProduct === orderProductId);
        if (product && product.hasReview && product.existingReview) {
            const rating = product.existingReview.rating;
            const stars = card.find('.star');
            stars.each(function(index) {
                if (index < rating) {
                    $(this).addClass('filled');
                }
            });
        }
    });
}

// Thêm function kiểm tra review status
async function checkReviewStatusAndOpen(orderId) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Vui lòng đăng nhập');
            return;
        }
        
        // Lấy danh sách sản phẩm
        const response = await fetch(`/api/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const products = await response.json();
            let hasAnyReview = false;
            
            // Kiểm tra từng sản phẩm
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    if (reviewData.exists) {
                        hasAnyReview = true;
                        break; // Chỉ cần 1 sản phẩm có review là đủ
                    }
                }
            }
            
            if (hasAnyReview) {
                // Có review -> mở modal xem đánh giá (có thể xem và sửa)
                openViewReviewModal(orderId);
            } else {
                // Chưa có review -> mở modal đánh giá mới
                openReviewModal(orderId);
            }
        }
    } catch (error) {
        console.error('Error checking review status:', error);
        openReviewModal(orderId); // Fallback
    }
}

// Thêm function xem review
async function openViewReviewModal(orderId) {
    currentOrderId = orderId;
    
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`/api/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const products = await response.json();
            
            // Load existing reviews
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    product.hasReview = reviewData.exists;
                    product.existingReview = reviewData.review;
                }
            }
            
            renderViewReviewProducts(products);
            $('#reviewModal').modal('show');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        alert('Lỗi khi tải đánh giá');
    }
}

function renderViewReviewProducts(products) {
    const container = $('#reviewProductsList');
    container.empty();
    
    products.forEach((product, index) => {
        const existingReview = product.existingReview;
        const hasReview = product.hasReview;
        
        const productHtml = `
            <div class="card mb-4 ${hasReview ? 'border-success' : 'border-warning'}" data-order-product-id="${product.idOrderProduct}">
                <div class="card-body">
                    <div class="row align-items-center mb-3">
                        <div class="col-auto">
                            <img src="${product.mainImageUrl || 'https://placehold.co/80x80'}" 
                                 alt="${product.productName}" 
                                 class="rounded" 
                                 style="width: 80px; height: 80px; object-fit: cover;">
                        </div>
                        <div class="col">
                            <h6 class="mb-1">${product.productName}</h6>
                            <p class="text-muted mb-0">Số lượng: ${product.quantity}</p>
                        </div>
                    </div>
                    
                    ${hasReview ? `
                    <!-- Hiển thị review đã có -->
                    <div class="review-display">
                        <div class="mb-3">
                            <label class="form-label fw-medium">Đánh giá:</label>
                            <div class="star-rating-display">
                                ${[1,2,3,4,5].map(star => `
                                    <div class="star-display ${star <= existingReview.rating ? 'filled' : ''}">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                        </svg>
                                    </div>
                                `).join('')}
                                <span class="ms-2 text-muted">(${existingReview.rating}/5)</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label fw-medium">Nhận xét:</label>
                            <div class="review-content p-3 bg-light rounded">
                                ${existingReview.content || '<em class="text-muted">Không có nhận xét</em>'}
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" ${existingReview.anonymous ? 'checked' : ''} disabled>
                                <label class="form-check-label text-muted small">
                                    Đánh giá ẩn danh
                                </label>
                            </div>
                        </div>
                        
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="editReview(${product.idOrderProduct})">
                                <i class="fas fa-edit"></i> Sửa
                            </button>
                        </div>
                    </div>
                    ` : `
                    <!-- Chưa có review -->
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-star fa-2x mb-2"></i>
                        <p>Chưa đánh giá sản phẩm này</p>
                    </div>
                    `}
                </div>
            </div>
        `;
        container.append(productHtml);
    });
    
    // Update modal title and buttons
    $('#reviewModalLabel').html('<i class="fas fa-eye me-2"></i>Xem đánh giá');
    $('.modal-footer').html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
    `);
}

// Thêm function render view review
function renderViewReviewProducts(products) {
    const container = $('#reviewProductsList');
    container.empty();
    
    products.forEach((product, index) => {
        const existingReview = product.existingReview;
        const hasReview = product.hasReview;
        
        const productHtml = `
            <div class="card mb-4 ${hasReview ? 'border-success' : 'border-warning'}" data-order-product-id="${product.idOrderProduct}">
                <div class="card-body">
                    <div class="row align-items-center mb-3">
                        <div class="col-auto">
                            <img src="${product.mainImageUrl || 'https://placehold.co/80x80'}" 
                                 alt="${product.productName}" 
                                 class="rounded" 
                                 style="width: 80px; height: 80px; object-fit: cover;">
                        </div>
                        <div class="col">
                            <h6 class="mb-1">${product.productName}</h6>
                            <p class="text-muted mb-0">Số lượng: ${product.quantity}</p>
                        </div>
                    </div>
                    
                    ${hasReview ? `
                    <!-- Hiển thị review đã có -->
                    <div class="review-display">
                        <div class="mb-3">
                            <label class="form-label fw-medium">Đánh giá:</label>
                            <div class="star-rating-display">
                                ${[1,2,3,4,5].map(star => `
                                    <div class="star-display ${star <= existingReview.rating ? 'filled' : ''}">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                        </svg>
                                    </div>
                                `).join('')}
                                <span class="ms-2 text-muted">(${existingReview.rating}/5)</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label fw-medium">Nhận xét:</label>
                            <div class="review-content p-3 bg-light rounded">
                                ${existingReview.content || '<em class="text-muted">Không có nhận xét</em>'}
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" ${existingReview.anonymous ? 'checked' : ''} disabled>
                                <label class="form-check-label text-muted small">
                                    Đánh giá ẩn danh
                                </label>
                            </div>
                        </div>
                        
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="editReview(${product.idOrderProduct})">
                                <i class="fas fa-edit"></i> Sửa
                            </button>
                        </div>
                    </div>
                    ` : `
                    <!-- Chưa có review -->
                    <div class="text-center text-muted py-3">
                        <i class="fas fa-star fa-2x mb-2"></i>
                        <p>Chưa đánh giá sản phẩm này</p>
                    </div>
                    `}
                </div>
            </div>
        `;
        container.append(productHtml);
    });
    
    // Update modal title and buttons
    $('#reviewModalLabel').html('<i class="fas fa-eye me-2"></i>Xem đánh giá');
    $('.modal-footer').html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
    `);
}

// Thêm function edit review
function editReview(orderProductId) {
    const card = $(`.card[data-order-product-id="${orderProductId}"]`);
    const existingReview = card.data('existing-review');
    
    // Chuyển sang edit mode
    card.find('.review-display').html(`
        <div class="review-edit">
            <div class="mb-3">
                <label class="form-label fw-medium">Đánh giá:</label>
                <div class="star-rating">
                    <div class="star" data-rating="1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                    </div>
                    <!-- ... 4 stars khác ... -->
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label fw-medium">Nhận xét:</label>
                <textarea class="form-control" rows="3" placeholder="Nhập nhận xét của bạn...">${existingReview.content || ''}</textarea>
            </div>
            
            <div class="mb-3">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" ${existingReview.anonymous ? 'checked' : ''}>
                    <label class="form-check-label text-muted small">
                        Đánh giá ẩn danh
                    </label>
                </div>
            </div>
            
            <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm" onclick="saveReview(${orderProductId})">
                    <i class="fas fa-save"></i> Lưu
                </button>
                <button class="btn btn-secondary btn-sm" onclick="cancelEdit(${orderProductId})">
                    <i class="fas fa-times"></i> Hủy
                </button>
            </div>
        </div>
    `);
    
    // Set existing rating
    const stars = card.find('.star');
    stars.each(function(index) {
        if (index < existingReview.rating) {
            $(this).addClass('filled');
        }
    });
    card.data('rating', existingReview.rating);
    
    // Add click handlers
    card.find('.star').click(function() {
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');
        
        stars.each(function(index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });
        card.data('rating', rating);
    });
}

// Thêm function save review
async function saveReview(orderProductId) {
    const card = $(`.card[data-order-product-id="${orderProductId}"]`);
    const rating = card.data('rating');
    const content = card.find('textarea').val().trim();
    const anonymous = card.find('input[type="checkbox"]').is(':checked');
    
    if (!rating || rating < 1) {
        alert('Vui lòng chọn ít nhất 1 sao');
        return;
    }
    
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderProductId: orderProductId,
                rating: rating,
                content: content,
                anonymous: anonymous
            })
        });
        
        if (response.ok) {
            alert('Cập nhật đánh giá thành công!');
            // Reload view
            openViewReviewModal(currentOrderId);
        } else {
            alert('Lỗi khi cập nhật đánh giá');
        }
    } catch (error) {
        console.error('Error saving review:', error);
        alert('Lỗi khi cập nhật đánh giá');
    }
}

// Thêm function cancel edit
function cancelEdit(orderProductId) {
    // Reload view
    openViewReviewModal(currentOrderId);
}

async function updateReviewButtonStatus(orderId) {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        const response = await fetch(`/api/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const products = await response.json();
            let hasAnyReview = false;
            
            // Kiểm tra xem có sản phẩm nào đã được đánh giá chưa
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    if (reviewData.exists) {
                        hasAnyReview = true;
                        break;
                    }
                }
            }
            
            // Cập nhật nút đánh giá
            const reviewButton = document.getElementById(`reviewButton_${orderId}`);
            const reviewButtonText = document.getElementById('reviewButtonText');
            
            if (reviewButton && reviewButtonText) {
                if (hasAnyReview) {
                    // Có review -> "Xem đánh giá" (màu vàng warning)
                    reviewButtonText.textContent = 'Xem đánh giá';
                    // reviewButton.className = 'btn btn-warning me-2';
                    // reviewButton.disabled = false;
                } else {
                    // Chưa có review -> "Đánh giá" (màu xanh primary)
                    reviewButtonText.textContent = 'Đánh giá';
                    // reviewButton.className = 'btn btn-primary me-2';
                    // reviewButton.disabled = false;
                }
            }
        }
    } catch (error) {
        console.error('Error updating review button status:', error);
    }
}

// Gọi function này khi trang load
$(document).ready(function() {
    // Lấy order ID từ URL
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    if (orderId && !isNaN(orderId)) {
        // Cập nhật trạng thái nút đánh giá
        updateReviewButtonStatus(parseInt(orderId));
    }
    
    // Check if URL has #review hash
    if (window.location.hash === '#review') {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            openReviewModal(parseInt(orderId));
        }, 500);
    }
});

async function submitAllReviews() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Vui lòng đăng nhập để đánh giá');
        return;
    }

    const reviews = [];
    let hasValidReview = false;
    let hasInvalidReview = false;

    $('.card[data-order-product-id]').each(function() {
        const orderProductId = $(this).data('order-product-id');
        const rating = $(this).data('rating');
        const content = $(this).find('textarea').val().trim();
        const anonymous = $(this).find('input[type="checkbox"]').is(':checked');

        // Kiểm tra nếu có nội dung mà không có rating
        if (content && (!rating || rating < 1 || rating > 5)) {
            hasInvalidReview = true;
            return;
        }

        // Chỉ submit nếu có rating
        if (rating && rating >= 1 && rating <= 5) {
            reviews.push({
                orderProductId: orderProductId,
                rating: rating,
                content: content || '',
                anonymous: anonymous
            });
            hasValidReview = true;
        }
    });

    // Validation
    if (hasInvalidReview) {
        alert('Lỗi: Bạn không thể ghi nội dung mà không đánh giá sao. Vui lòng chọn số sao hoặc xóa nội dung.');
        return;
    }

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
        // Đóng modal trước
        $('#reviewModal').modal('hide');

        // Hiển thị thông báo thành công
        alert('Đánh giá thành công! Cảm ơn bạn đã đánh giá sản phẩm.');

        // Reload trang sau một chút để đảm bảo modal đã đóng
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error('Error submitting reviews:', error);
        alert('Lỗi: ' + error.message);
    }
}