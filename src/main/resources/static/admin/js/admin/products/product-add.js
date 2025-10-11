// Product Add Page Manager
class ProductAddManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupImagePreview();
        this.setupSlugGeneration();
        this.setupAutoResize();
    }

    setupEventListeners() {
        // Image preview handlers
        const productImagesInput = document.getElementById('productImages');
        console.log('Product images input found:', productImagesInput); // Debug log
        
        if (productImagesInput) {
            productImagesInput.addEventListener('change', (e) => {
                console.log('File input changed'); // Debug log
                this.handleImagePreview(e, 'product');
            });
        } else {
            console.error('Product images input not found!');
        }
    
        // Form submission handler
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }
    }

    setupImagePreview() {
        // Initialize image preview container
        const previewContainer = document.getElementById('imagePreview');
        previewContainer.innerHTML = '<p class="text-muted">Chọn hình ảnh để xem trước</p>';
    }


    // Auto-generate slug from name
    generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim('-'); // Remove leading/trailing hyphens
    }

    // Auto-fill slug when name changes
    setupSlugGeneration() {
        const nameInput = document.getElementById('name');
        const slugInput = document.getElementById('slug');
        
        if (nameInput && slugInput) {
            nameInput.addEventListener('input', () => {
                if (slugInput.value === '') {
                    slugInput.value = this.generateSlug(nameInput.value);
                }
            });
        }
    }

    // Setup auto-resize for textarea
    setupAutoResize() {
        const descriptionTextarea = document.getElementById('description');
        
        if (descriptionTextarea) {
            // Auto-resize on input
            descriptionTextarea.addEventListener('input', () => {
                this.autoResizeTextarea(descriptionTextarea);
            });
            
            // Auto-resize on paste
            descriptionTextarea.addEventListener('paste', () => {
                setTimeout(() => {
                    this.autoResizeTextarea(descriptionTextarea);
                }, 10);
            });
            
            // Initial resize
            this.autoResizeTextarea(descriptionTextarea);
        }
    }

    // Auto-resize textarea function
    autoResizeTextarea(textarea) {
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate new height based on content
        const newHeight = Math.min(textarea.scrollHeight, 300); // Max height 300px
        const minHeight = 100; // Min height 100px
        
        // Set the new height
        textarea.style.height = Math.max(newHeight, minHeight) + 'px';
    }

    // Form validation
    validateForm() {
        const requiredFields = ['name', 'description', 'price', 'brandId', 'categoryId', 'stock'];
        let isValid = true;
        let errors = [];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                field.classList.add('is-invalid');
                errors.push(`${this.getFieldLabel(fieldId)} là bắt buộc`);
                isValid = false;
            } else if (field) {
                field.classList.remove('is-invalid');
            }
        });

        // Price validation
        const priceField = document.getElementById('price');
        if (priceField && priceField.value && parseFloat(priceField.value) <= 0) {
            priceField.classList.add('is-invalid');
            errors.push('Giá sản phẩm phải lớn hơn 0');
            isValid = false;
        }

        // Stock validation
        const stockField = document.getElementById('stock');
        if (stockField && stockField.value && parseInt(stockField.value) < 0) {
            stockField.classList.add('is-invalid');
            errors.push('Số lượng tồn kho không được âm');
            isValid = false;
        }

        // Image validation - bắt buộc phải có ít nhất 1 ảnh
        const productImages = document.getElementById('productImages');
        if (!productImages || productImages.files.length === 0) {
            productImages.classList.add('is-invalid');
            errors.push('Hình ảnh sản phẩm là bắt buộc');
            isValid = false;
        } else {
            productImages.classList.remove('is-invalid');
        }

        if (!isValid) {
            this.showError('Vui lòng kiểm tra lại thông tin: ' + errors.join(', '));
        }

        return isValid;
    }

    getFieldLabel(fieldId) {
        const labels = {
            'name': 'Tên sản phẩm',
            'description': 'Mô tả',
            'price': 'Giá bán',
            'brandId': 'Thương hiệu',
            'categoryId': 'Danh mục',
            'stock': 'Số lượng tồn kho'
        };
        return labels[fieldId] || fieldId;
    }

    showError(message) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <strong>Lỗi!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of content
        const contentWrapper = document.querySelector('.content-wrapper');
        contentWrapper.insertBefore(alertDiv, contentWrapper.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <strong>Thành công!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of content
        const contentWrapper = document.querySelector('.content-wrapper');
        contentWrapper.insertBefore(alertDiv, contentWrapper.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
    // Form submission handler
    async submitForm() {
        console.log('Submit form called'); // Debug log
        if (!this.validateForm()) {
            console.log('Form validation failed'); // Debug log
            return;
        }
        console.log('Form validation passed'); // Debug log

        const formData = new FormData();
        const form = document.getElementById('productForm');
        
        // Add form fields
        formData.append('name', document.getElementById('name').value);
        formData.append('categoryId', document.getElementById('categoryId').value);
        formData.append('brandId', document.getElementById('brandId').value);
        formData.append('price', document.getElementById('price').value);
        formData.append('stock', document.getElementById('stock').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('isActive', document.getElementById('isActive').checked);

        // Add images
        const productImages = document.getElementById('productImages');
        
        if (productImages.files.length > 0) {
            Array.from(productImages.files).forEach(file => {
                formData.append('productImages', file);
            });
        }

        try {
            this.showLoading(true);
            
            const response = await fetch('/admin/api/products/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showSuccess('Sản phẩm đã được thêm thành công!');
                this.resetForm();
            } else {
                const error = await response.json();
                this.showError(error.message || 'Có lỗi xảy ra khi thêm sản phẩm');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showError('Có lỗi xảy ra khi kết nối server');
        } finally {
            this.showLoading(false);
        }
    }

    // Show/hide loading state
    showLoading(show) {
        const submitBtn = document.getElementById('submitBtn');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const submitText = document.getElementById('submitText');
        
        if (show) {
            submitBtn.disabled = true;
            loadingSpinner.classList.remove('d-none');
            submitText.textContent = 'Đang lưu...';
        } else {
            submitBtn.disabled = false;
            loadingSpinner.classList.add('d-none');
            submitText.textContent = 'Lưu sản phẩm';
        }
    }

    // Reset form
    resetForm() {
        console.log('Reset form called'); // Debug log
        document.getElementById('productForm').reset();
        document.getElementById('imagePreview').innerHTML = '<p class="text-muted">Chọn hình ảnh để xem trước</p>';
        console.log('Form reset completed'); // Debug log
    }

    // Enhanced image preview with remove functionality
    handleImagePreview(event, type) {
        const files = event.target.files;
        const previewContainer = document.getElementById('imagePreview');
        
        console.log('Files selected:', files.length); // Debug log
        
        if (files.length === 0) {
            previewContainer.innerHTML = `
                <div class="text-center text-muted">
                    <i class="mdi mdi-image-multiple mdi-48px"></i>
                    <p class="mt-2">Hình ảnh sẽ hiển thị ở đây</p>
                </div>
            `;
            return;
        }

        let previewHTML = '<div class="row">';
        let processedCount = 0;
        
        Array.from(files).forEach((file, index) => {
            console.log('Processing file:', file.name, file.type); // Debug log
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    console.log('File loaded:', file.name); // Debug log
                    
                    previewHTML += `
                        <div class="col-md-4 mb-2">
                            <div class="position-relative">
                                <img src="${e.target.result}" class="img-thumbnail" style="width: 100%; height: 100px; object-fit: cover;">
                                <small class="text-muted d-block">${file.name}</small>
                                <small class="text-muted">${(file.size / 1024).toFixed(1)} KB</small>
                                ${index === 0 ? '<span class="badge bg-primary position-absolute top-0 end-0">Hình chính</span>' : ''}
                            </div>
                        </div>
                    `;
                    
                    processedCount++;
                    if (processedCount === files.length) {
                        previewHTML += '</div>';
                        previewContainer.innerHTML = previewHTML;
                        console.log('Preview updated'); // Debug log
                    }
                };
                reader.readAsDataURL(file);
            } else {
                console.log('Invalid file type:', file.type); // Debug log
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productAddManager = new ProductAddManager();
});