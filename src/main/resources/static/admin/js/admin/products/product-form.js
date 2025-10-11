// Product Form Manager
class ProductFormManager {
    constructor() {
        this.form = document.getElementById('productForm');
        this.submitBtn = document.getElementById('submitBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.submitText = document.getElementById('submitText');
        this.isEditMode = false;
        this.productId = null;
        
        this.init();
    }

    init() {
        this.loadCategories();
        this.loadBrands();
        this.setupEventListeners();
    }

    async loadCategories() {
        try {
            const response = await fetch('/admin/api/categories/all');
            const data = await response.json();
            
            if (data.result) {
                const categorySelect = document.getElementById('categoryId');
                categorySelect.innerHTML = '<option value="">Chọn danh mục</option>';
                
                data.result.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.categoryId;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showNotification('Lỗi khi tải danh mục', 'error');
        }
    }

    async loadBrands() {
        try {
            const response = await fetch('/admin/api/brands/all');
            const data = await response.json();
            
            if (data.result) {
                const brandSelect = document.getElementById('brandId');
                brandSelect.innerHTML = '<option value="">Chọn thương hiệu</option>';
                
                data.result.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.brandId;
                    option.textContent = brand.name;
                    brandSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading brands:', error);
            this.showNotification('Lỗi khi tải thương hiệu', 'error');
        }
    }

    setupEventListeners() {
        // Skip setup nếu đang ở trang add sản phẩm
        if (window.location.pathname.includes('/products/add')) {
            console.log('[PRODUCT-FORM] Skipping setup for add page');
            return;
        }
        
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    setEditMode(productId) {
        this.isEditMode = true;
        this.productId = productId;
        
        // Update submit button text
        const submitText = document.getElementById('submitText');
        if (submitText) {
            submitText.textContent = 'Cập nhật sản phẩm';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }
    
        this.setLoading(true);
    
        try {
            const formData = this.getFormData();
            const url = this.isEditMode ? `/admin/api/products/${this.productId}` : '/admin/api/products';
            const method = this.isEditMode ? 'PUT' : 'POST';
    
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
    
            const result = await response.json();
    
            if (response.ok) {
                this.showNotification(result.message || 'Thành công!', 'success');
                if (!this.isEditMode) {
                    this.resetForm();
                } else {
                    // For edit mode, reload the page to show updated data
                    setTimeout(() => location.reload(), 1000);
                }
            } else {
                this.showNotification(result.message || 'Có lỗi xảy ra', 'error');
                this.displayErrors(result.errors || {});
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Lỗi kết nối', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    getFormData() {
        return {
            name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            price: parseFloat(document.getElementById('price').value),
            brandId: parseInt(document.getElementById('brandId').value),
            categoryId: parseInt(document.getElementById('categoryId').value),
            stock: parseInt(document.getElementById('stock').value),
            isActive: document.getElementById('isActive').checked
        };
    }

    validateForm() {
        const requiredFields = ['name', 'description', 'price', 'brandId', 'categoryId', 'stock'];
        let isValid = true;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const value = field.value.trim();
            
            if (!value) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        return isValid;
    }

    displayErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');

        // Display new errors
        Object.keys(errors).forEach(field => {
            const fieldEl = document.getElementById(field);
            if (fieldEl) {
                fieldEl.classList.add('is-invalid');
                const errorEl = fieldEl.parentNode.querySelector('.invalid-feedback');
                if (errorEl) {
                    errorEl.textContent = errors[field];
                }
            }
        });
    }

    setLoading(loading) {
        if (loading) {
            this.loadingSpinner.classList.remove('d-none');
            this.submitText.textContent = 'Đang xử lý...';
            this.submitBtn.disabled = true;
        } else {
            this.loadingSpinner.classList.add('d-none');
            this.submitText.textContent = this.isEditMode ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm';
            this.submitBtn.disabled = false;
        }
    }

    resetForm() {
        this.form.reset();
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
        this.isEditMode = false;
        this.productId = null;
    }

    showNotification(message, type = 'info') {
        // Use global notification manager
        if (window.notificationManager) {
            window.notificationManager.showNotification(message, type);
        } else {
            // Fallback to alert if notification manager not loaded
            alert(message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productFormManager = new ProductFormManager();
});

// Global function for reset button
function resetForm() {
    if (window.productFormManager) {
        window.productFormManager.resetForm();
    }
}