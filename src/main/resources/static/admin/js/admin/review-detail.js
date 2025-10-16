/**
 * Review Detail Management JavaScript
 * Chi tiết đánh giá - Liora Admin
 */

class ReviewDetailManager {
    constructor() {
        this.baseUrl = '/admin/api/reviews';
        this.reviewId = window.reviewIdFromServer || this.getReviewIdFromUrl();
        this.reviewData = null;
        this.init();
    }

    init() {
        if (this.reviewId) {
            this.loadReviewDetail();
            this.bindEvents();
        } else {
            this.showAlert('error', 'Lỗi', 'Không tìm thấy mã đánh giá');
            setTimeout(() => {
                window.location.href = '/admin/reviews';
            }, 2000);
        }
    }

    bindEvents() {
        // Update visibility button
        $('#btnUpdateVisibility').on('click', () => {
            this.showUpdateVisibilityModal();
        });

        // Print review button
        $('#btnPrintReview').on('click', () => {
            this.printReview();
        });

        // Modal events
        $('#updateVisibilityModal').on('hidden.bs.modal', () => {
            this.clearModal();
        });
    }

    getReviewIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart && !isNaN(lastPart)) {
                console.log('ReviewId from path:', lastPart);
                return lastPart;
            }
        }

        console.log('No reviewId found in URL');
        return null;
    }

    async loadReviewDetail() {
        try {
            this.showLoading();

            console.log('Loading review detail for ID:', this.reviewId);

            const response = await fetch(`${this.baseUrl}/${this.reviewId}`);

            if (!response.ok) {
                throw new Error('Không thể tải thông tin đánh giá');
            }

            this.reviewData = await response.json();
            console.log('Found review:', this.reviewData);

            this.renderReviewDetail();

        } catch (error) {
            console.error('Error loading review detail:', error);
            this.showAlert('error', 'Lỗi', error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderReviewDetail() {
        const review = this.reviewData;
        
        // Update page title
        document.title = `Chi tiết đánh giá #${review.reviewId} - Liora Admin`;
        $('#pageReviewId').text(`#${review.reviewId}`);
        
        // Review content
        $('#reviewContent').text(review.content || 'Không có nội dung');
        $('#reviewStars').html(this.generateStars(review.rating));
        $('#ratingText').text(`${review.rating}/5 sao`);
        
        // Review information
        $('#reviewIdDetail').text(`#${review.reviewId}`);
        
        // Format dates
        try {
            const createdAt = new Date(review.createdAt);
            const updatedAt = new Date(review.lastUpdate || review.createdAt);
            
            $('#reviewCreatedAt').text(this.formatDateTime(createdAt));
            $('#reviewUpdatedAt').text(this.formatDateTime(updatedAt));
        } catch (error) {
            console.error('Error formatting dates:', error);
            $('#reviewCreatedAt').text('Không có thông tin');
            $('#reviewUpdatedAt').text('Không có thông tin');
        }
        
        // Review status - Cập nhật hiển thị Ẩn danh
        $('#reviewStatus').html(`<span class="${this.getVisibilityClass(review.isVisible)}">${this.getVisibilityText(review.isVisible)}</span>`);
        $('#reviewAnonymous').html(`<span class="${this.getAnonymousClass(review.anonymous)}">${this.getAnonymousText(review.anonymous)}</span>`);
        
        // User information - Hiển thị email và số điện thoại
        $('#userName').text(review.userDisplayName || 'Không xác định');
        $('#userId').text(review.userId || 'N/A');
        $('#userEmail').text(review.userEmail || 'N/A');
        $('#userPhone').text(review.userPhone || 'N/A');
        
        // Set user avatar if available
        if (review.userAvatar) {
            $('#userAvatar').attr('src', review.userAvatar).show();
        } else {
            $('#userAvatar').hide();
        }
        
        // Product information - Hiển thị đầy đủ thông tin sản phẩm
        $('#productName').text(review.productName || 'Không xác định');
        $('#productId').text(review.productId || 'N/A');
        $('#productBrand').text(review.productBrandName || 'N/A');
        $('#productCategory').text(review.productCategoryName || 'N/A');
        
        // Format product price
        if (review.productPrice && review.productPrice > 0) {
            $('#productPrice').text(new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(review.productPrice));
        } else {
            $('#productPrice').text('N/A');
        }
        
        // Set product image
        if (review.productThumbnail) {
            $('#productImage').attr('src', review.productThumbnail).show();
        } else {
            // Hiển thị ảnh placeholder nếu không có ảnh
            $('#productImage').attr('src', '/admin/images/no-image.png').show();
        }
        
        // Order information - Thay thế phần thống kê
        if (review.orderId) {
            // Tạo link clickable cho mã đơn hàng
            const orderCode = review.orderCode || `#${review.orderId}`;
            const orderLink = `<a href="/admin/orders/detail/${review.orderId}" class="text-decoration-none fw-bold text-primary" title="Xem chi tiết đơn hàng">${orderCode}</a>`;
            $('#orderCode').html(orderLink);
            
            $('#orderDate').text(review.orderDate ? this.formatDateTime(new Date(review.orderDate)) : 'N/A');
            $('#orderUserId').text(review.userId || 'N/A');
        } else {
            $('#orderCode').text('N/A');
            $('#orderDate').text('N/A');
            $('#orderUserId').text('N/A');
        }
    }

    // Cập nhật method getAnonymousText để hiển thị "Có" hoặc "Không"
    getAnonymousText(isAnonymous) {
        return isAnonymous ? 'Có' : 'Không';
    }

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="mdi mdi-star"></i>';
            } else {
                stars += '<i class="mdi mdi-star-outline"></i>';
            }
        }
        return stars;
    }

    getVisibilityClass(isVisible) {
        return isVisible ? 'text-success fw-bold' : 'text-danger fw-bold';
    }

    getVisibilityText(isVisible) {
        return isVisible ? 'Hiển thị' : 'Ẩn';
    }

    getAnonymousClass(isAnonymous) {
        return isAnonymous ? 'text-info fw-bold' : 'text-secondary fw-bold';
    }

    getAnonymousText(isAnonymous) {
        return isAnonymous ? 'Ẩn danh' : 'Hiển thị tên';
    }

    showUpdateVisibilityModal() {
        if (!this.reviewData) return;

        $('#updateReviewId').val(this.reviewData.reviewId);
        $('#updateReviewVisibility').val(this.reviewData.isVisible ? 'true' : 'false');

        $('#updateVisibilityModal').modal('show');
    }

    async saveReviewVisibility() {
        try {
            const reviewId = $('#updateReviewId').val();
            const isVisible = $('#updateReviewVisibility').val() === 'true';

            const response = await fetch(`${this.baseUrl}/${reviewId}/visibility?isVisible=${isVisible}`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Không thể cập nhật trạng thái đánh giá');
            }

            $('#updateVisibilityModal').modal('hide');
            this.showAlert('success', 'Thành công', 'Cập nhật trạng thái đánh giá thành công');

            // Reload review detail
            await this.loadReviewDetail();

        } catch (error) {
            console.error('Error updating review visibility:', error);
            this.showAlert('error', 'Lỗi', 'Không thể cập nhật trạng thái đánh giá');
        }
    }

    printReview() {
        const printWindow = window.open('', '_blank');
        const review = this.reviewData;

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Đánh giá #${review.reviewId}</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info-section { margin-bottom: 20px; }
                    .info-title { font-weight: bold; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .stars { color: #ffc107; font-size: 18px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LIORA FASHION</h1>
                    <h2>ĐÁNH GIÁ #${review.reviewId}</h2>
                    <p>Ngày: ${this.formatDateTime(new Date(review.createdAt))}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Nội dung đánh giá:</div>
                    <p><strong>Điểm đánh giá:</strong> <span class="stars">${this.generateStars(review.rating)}</span> (${review.rating}/5)</p>
                    <p><strong>Nội dung:</strong> ${review.content || 'Không có nội dung'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Thông tin người đánh giá:</div>
                    <p><strong>Tên:</strong> ${review.userDisplayName || 'Không xác định'}</p>
                    <p><strong>Mã người dùng:</strong> ${review.userId || 'N/A'}</p>
                    <p><strong>Ẩn danh:</strong> ${review.anonymous ? 'Có' : 'Không'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Thông tin sản phẩm:</div>
                    <p><strong>Tên sản phẩm:</strong> ${review.productName || 'Không xác định'}</p>
                    <p><strong>Mã sản phẩm:</strong> ${review.productId || 'N/A'}</p>
                    <p><strong>Thương hiệu:</strong> ${review.brandName || 'N/A'}</p>
                </div>
                
                <div class="info-section">
                    <div class="info-title">Trạng thái:</div>
                    <p><strong>Hiển thị:</strong> ${review.isVisible ? 'Có' : 'Không'}</p>
                    <p><strong>Ngày tạo:</strong> ${this.formatDateTime(new Date(review.createdAt))}</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    formatDateTime(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    showLoading() {
        $('#loadingSpinner').removeClass('d-none');
    }

    hideLoading() {
        $('#loadingSpinner').addClass('d-none');
    }

    clearModal() {
        $('#updateVisibilityForm')[0].reset();
    }

    showAlert(type, title, message) {
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alert = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <strong>${title}:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        $('#alertContainer').html(alert);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            $('.alert').fadeOut();
        }, 5000);
    }
}

// Initialize when document is ready
$(document).ready(function() {
    window.reviewDetailManager = new ReviewDetailManager();
});

// Save review visibility function for modal
function saveReviewVisibility() {
    if (window.reviewDetailManager) {
        window.reviewDetailManager.saveReviewVisibility();
    }
}