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
$(document).ready(function () {
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
    console.log('openReviewModal called with orderId:', orderId);
    currentOrderId = orderId;
    loadOrderProductsForReview(orderId);
}

async function loadOrderProductsForReview(orderId) {
    console.log('loadOrderProductsForReview called with orderId:', orderId);

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
            console.log('Loaded products:', products);

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
            console.log('Rendering review products:', products);
            renderReviewProducts(products);
            console.log('Showing modal');

            // Đảm bảo modal được khởi tạo trước khi show
            if (ensureModalInitialized()) {
                $('#reviewModal').modal('show');
            } else {
                console.error('Cannot show modal - not properly initialized');
                alert('Không thể mở modal đánh giá. Vui lòng tải lại trang.');
            }
        } else {
            console.error('Failed to fetch order items');
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
                            <img src="${product.mainImageUrl || 'https://placehold.co/300x300'}" 
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

    // Add star rating functionality - sử dụng event delegation để tránh gán nhiều lần
    $(document).off('click', '.star-rating .star').on('click', '.star-rating .star', function () {
        const card = $(this).closest('.card');
        if (card.hasClass('border-success')) return; // Đã đánh giá rồi

        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');

        console.log('Star clicked, rating:', rating);

        // Update star states
        stars.each(function (index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });

        // Store rating
        card.data('rating', rating);
        console.log('Rating stored:', card.data('rating'));
    });

    // Nếu đã có review, hiển thị sao đã được chọn
    $('.card[data-order-product-id]').each(function () {
        const card = $(this);
        const orderProductId = card.data('order-product-id');

        // Tìm existingReview cho sản phẩm này
        const product = products.find(p => p.idOrderProduct === orderProductId);
        if (product && product.hasReview && product.existingReview) {
            const rating = product.existingReview.rating;
            const stars = card.find('.star');
            stars.each(function (index) {
                if (index < rating) {
                    $(this).addClass('filled');
                }
            });
        }
    });
}

// Thêm function kiểm tra review status
async function checkReviewStatusAndOpen(orderId) {
    console.log('checkReviewStatusAndOpen called with orderId:', orderId);

    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Vui lòng đăng nhập');
            return;
        }

        // Đảm bảo currentOrderId được set
        currentOrderId = orderId;

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
                console.log('Opening view review modal');
                openViewReviewModal(orderId);
            } else {
                // Chưa có review -> mở modal đánh giá mới
                console.log('Opening new review modal');
                openReviewModal(orderId);
            }
        } else {
            console.error('Failed to fetch order items');
            alert('Không thể tải thông tin đơn hàng');
        }
    } catch (error) {
        console.error('Error checking review status:', error);
        openReviewModal(orderId); // Fallback
    }
}

// Thêm function xem review
async function openViewReviewModal(orderId) {
    console.log('openViewReviewModal called with orderId:', orderId);
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
            console.log('Showing modal');

            // Đảm bảo modal được khởi tạo trước khi show
            if (ensureModalInitialized()) {
                $('#reviewModal').modal('show');
            } else {
                console.error('Cannot show modal - not properly initialized');
                alert('Không thể mở modal đánh giá. Vui lòng tải lại trang.');
            }
        } else {
            console.error('Failed to fetch order items for view modal');
            alert('Không thể tải thông tin đơn hàng');
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
                            ${hasReview ? '<span class="badge bg-success ms-2">Đã đánh giá</span>' : ''}
                        </div>
                    </div>
                    
                    ${hasReview ? `
                    <!-- Hiển thị review đã có -->
                    <div class="review-display">
                        <div class="mb-3">
                            <label class="form-label fw-medium">Đánh giá:</label>
                            <div class="star-rating-display">
                                ${[1, 2, 3, 4, 5].map(star => `
                                    <div class="star-display ${star <= existingReview.rating ? 'filled' : ''}">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2">
                                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                                        </svg>
                                    </div>
                                `).join('')}
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
                            <button class="btn btn-outline-primary btn-sm edit-btn" onclick="editReview(${product.idOrderProduct})">
                                <i class="fas fa-edit"></i> Sửa
                            </button>
                        </div>
                    </div>
                    ` : `
                    <!-- Form đánh giá cho sản phẩm chưa đánh giá -->
                    <div class="review-form">
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
                        
                        <div class="mb-3">
                            <label class="form-label fw-medium">Nhận xét:</label>
                            <textarea class="form-control" 
                                      rows="3" 
                                      placeholder="Nhập nhận xét của bạn..."
                                      data-order-product-id="${product.idOrderProduct}"></textarea>
                        </div>
                        
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" 
                                   id="anonymous_${product.idOrderProduct}" 
                                   data-order-product-id="${product.idOrderProduct}">
                            <label class="form-check-label text-muted small" 
                                   for="anonymous_${product.idOrderProduct}">
                                Ẩn danh khi đánh giá
                            </label>
                        </div>
                    </div>
                    `}
                </div>
            </div>
        `;
        container.append(productHtml);

        // ✅ FIX: Lưu existing review data vào data attribute của card
        if (hasReview && existingReview) {
            const card = $(`.card[data-order-product-id="${product.idOrderProduct}"]`);
            card.data('existing-review', existingReview);
        }
    });

    // Add star rating functionality for new reviews - sử dụng event delegation
    $(document).off('click', '.star-rating .star').on('click', '.star-rating .star', function () {
        const card = $(this).closest('.card');
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');

        console.log('Star clicked in view modal, rating:', rating);

        // Update star states
        stars.each(function (index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });

        // Store rating
        card.data('rating', rating);
        console.log('Rating stored in view modal:', card.data('rating'));
    });

    // Update modal title and buttons
    $('#reviewModalLabel').html('<i class="fas fa-star me-2"></i>Đánh giá sản phẩm');
    $('.modal-footer').html(`
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" onclick="submitAllReviews()">Gửi đánh giá</button>
    `);

    // Đảm bảo tất cả nút "Sửa" đều hiển thị khi reload
    $('.edit-btn').show();
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
                <button class="btn btn-secondary btn-sm" onclick="cancelEdit(${orderProductId})">
                    <i class="fas fa-times"></i> Hủy
                </button>
            </div>
        </div>
    `);

    // Set existing rating
    const stars = card.find('.star');
    stars.each(function (index) {
        if (index < existingReview.rating) {
            $(this).addClass('filled');
        }
    });
    card.data('rating', existingReview.rating);

    // Add click handlers - sử dụng event delegation
    card.off('click', '.star').on('click', '.star', function () {
        const rating = $(this).data('rating');
        const stars = $(this).parent().find('.star');

        console.log('Star clicked in edit mode, rating:', rating);

        stars.each(function (index) {
            const starElement = $(this);
            if (index < rating) {
                starElement.addClass('filled');
            } else {
                starElement.removeClass('filled');
            }
        });
        card.data('rating', rating);
        console.log('Rating stored in edit mode:', card.data('rating'));

        // Lưu thay đổi rating
        saveReviewChanges(orderProductId);
    });

    // Add change handlers để lưu thay đổi vào pending-changes
    card.find('textarea').on('input', function () {
        saveReviewChanges(orderProductId);
    });

    card.find('input[type="checkbox"]').on('change', function () {
        saveReviewChanges(orderProductId);
    });

    // Ẩn nút "Sửa" khi đang edit
    card.find('.edit-btn').hide();
}

// Function để lưu thay đổi review (chỉ lưu vào data, không gửi API)
function saveReviewChanges(orderProductId) {
    const card = $(`.card[data-order-product-id="${orderProductId}"]`);
    const rating = card.data('rating');
    const content = card.find('textarea').val().trim();
    const anonymous = card.find('input[type="checkbox"]').is(':checked');

    if (!rating || rating < 1) {
        alert('Vui lòng chọn ít nhất 1 sao');
        return false;
    }

    // Lưu thay đổi vào data của card
    card.data('pending-changes', {
        rating: rating,
        content: content,
        anonymous: anonymous
    });

    return true;
}

// Thêm function cancel edit review
function cancelEdit(orderProductId) {
    const card = $(`.card[data-order-product-id="${orderProductId}"]`);

    // Xóa pending changes
    card.removeData('pending-changes');

    // Hiện lại nút "Sửa"
    card.find('.edit-btn').show();

    // Reload view để quay về trạng thái ban đầu
    openViewReviewModal(currentOrderId);
}

function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        // Tạo container nếu chưa có để tránh lỗi trên các trang không có sẵn
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
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
            let allReviewed = true;

            // Kiểm tra trạng thái review của tất cả sản phẩm
            for (let product of products) {
                const reviewCheckResponse = await fetch(`/api/reviews/check/${product.idOrderProduct}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (reviewCheckResponse.ok) {
                    const reviewData = await reviewCheckResponse.json();
                    if (reviewData.exists) {
                        hasAnyReview = true;
                    } else {
                        allReviewed = false;
                    }
                } else {
                    allReviewed = false;
                }
            }

            // Cập nhật nút đánh giá
            const reviewButton = document.getElementById('reviewButton');
            const reviewButtonText = document.getElementById('reviewButtonText');

            if (reviewButton && reviewButtonText) {
                // Trang order-detail: luôn hiển thị "Đánh giá" (đơn giản)
                reviewButtonText.textContent = 'Đánh giá';
                reviewButton.className = 'btn btn-primary me-2';
            }
        }
    } catch (error) {
        console.error('Error updating review button status:', error);
    }
}

// Function để đảm bảo modal được khởi tạo
function ensureModalInitialized() {
    const modal = document.getElementById('reviewModal');
    if (!modal) {
        console.error('Review modal not found in DOM');
        return false;
    }

    // Kiểm tra xem modal có được khởi tạo với Bootstrap không
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        // Modal đã được khởi tạo với Bootstrap
        return true;
    } else {
        console.error('Bootstrap not available or modal not initialized');
        return false;
    }
}

// Gọi function này khi trang load
$(document).ready(function () {
    console.log('Document ready - initializing order detail page');

    // Lấy order ID từ URL
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];

    if (orderId && !isNaN(orderId)) {
        console.log('Order ID found:', orderId);
        // Cập nhật trạng thái nút đánh giá
        updateReviewButtonStatus(parseInt(orderId));
    }

    // Đảm bảo modal được khởi tạo
    setTimeout(() => {
        ensureModalInitialized();
    }, 100);

    // Check if URL has #review hash
    if (window.location.hash === '#review') {
        console.log('Review hash found, opening modal');
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

    const newReviews = [];
    const updatedReviews = [];
    let hasValidReview = false;
    let hasInvalidReview = false;

    $('.card[data-order-product-id]').each(function () {
        const orderProductId = $(this).data('order-product-id');
        let rating = $(this).data('rating');
        const existingReview = $(this).data('existing-review');
        const pendingChanges = $(this).data('pending-changes');
        const card = $(this);

        // Xử lý review đã sửa (có pending changes)
        if (pendingChanges) {
            if (!pendingChanges.rating || pendingChanges.rating < 1) {
                hasInvalidReview = true;
                return;
            }

            updatedReviews.push({
                reviewId: existingReview.reviewId,
                rating: pendingChanges.rating,
                content: pendingChanges.content || '',
                anonymous: pendingChanges.anonymous
            });
            hasValidReview = true;
            return;
        }

        // Chỉ xét điều kiện với sản phẩm chưa đánh giá (không có class border-success)
        const isAlreadyReviewed = card.hasClass('border-success');
        if (isAlreadyReviewed) {
            return; // Bỏ qua sản phẩm đã đánh giá
        }

        // Chỉ xử lý sản phẩm có form đánh giá (có textarea)
        const textarea = card.find('textarea');
        if (textarea.length === 0) {
            return; // Bỏ qua sản phẩm không có form đánh giá
        }

        const content = textarea.val() ? textarea.val().trim() : '';
        const anonymous = card.find('input[type="checkbox"]').is(':checked');

        // Debug: Log để kiểm tra
        console.log('Product:', orderProductId, 'Rating:', rating, 'Content:', content);
        console.log('Card data rating:', card.data('rating'));
        console.log('Card has rating data:', card.data('rating') !== undefined);

        // Lấy rating từ card data nếu không có từ data attribute
        if (!rating && card.data('rating')) {
            rating = card.data('rating');
            console.log('Using rating from card data:', rating);
        }

        // Kiểm tra nếu có nội dung mà không có rating
        if (content && (!rating || rating < 1 || rating > 5)) {
            console.log('Invalid: có nội dung nhưng không có rating hợp lệ');
            hasInvalidReview = true;
            return;
        }

        // Chỉ submit nếu có rating (nội dung có thể để trống)
        if (rating && rating >= 1 && rating <= 5) {
            console.log('Valid review:', { orderProductId, rating, content, anonymous });
            newReviews.push({
                orderProductId: orderProductId,
                rating: rating,
                content: content || '',
                anonymous: anonymous
            });
            hasValidReview = true;
        } else if (content) {
            // Nếu có nội dung nhưng không có rating hợp lệ
            console.log('Invalid: có nội dung nhưng rating không hợp lệ:', rating);
            hasInvalidReview = true;
            return;
        }
    });

    // Validation
    if (hasInvalidReview) {
        alert('Lỗi: Bạn không thể ghi nội dung mà không đánh giá sao. Vui lòng chọn số sao hoặc xóa nội dung.');
        return;
    }

    if (!hasValidReview) {
        alert('Vui lòng đánh giá ít nhất một sản phẩm hoặc sửa đánh giá hiện có');
        return;
    }

    try {
        // Submit new reviews
        for (const review of newReviews) {
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
                throw new Error(errorData.message || 'Không thể gửi đánh giá mới');
            }
        }

        // Update existing reviews
        for (const review of updatedReviews) {
            const response = await fetch(`/api/reviews/${review.reviewId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: review.rating,
                    content: review.content,
                    anonymous: review.anonymous
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể cập nhật đánh giá');
            }
        }

        // Đóng modal
        $('#reviewModal').modal('hide');

        // Hiển thị toast thông báo thành công
        const message = newReviews.length > 0 && updatedReviews.length > 0
            ? 'Đánh giá và cập nhật thành công! ✨'
            : newReviews.length > 0
                ? 'Đánh giá thành công! ✨'
                : 'Cập nhật đánh giá thành công! ✨';
        showToast(message, 'success');

        // Cập nhật trạng thái nút đánh giá
        setTimeout(() => {
            updateReviewButtonStatus(currentOrderId);
        }, 1000);

    } catch (error) {
        console.error('Error submitting reviews:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Global functions để có thể gọi từ HTML
window.cancelOrder = cancelOrder;
window.reorderOrder = reorderOrder;
window.checkReviewStatusAndOpen = checkReviewStatusAndOpen;
window.submitAllReviews = submitAllReviews;
window.editReview = editReview;
window.cancelEdit = cancelEdit;