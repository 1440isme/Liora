# Hướng Dẫn Sử Dụng API Upload File

## Tổng Quan
API upload file được thiết kế để xử lý việc upload và tối ưu hóa ảnh cho ứng dụng Liora. Hệ thống tự động tạo cấu trúc thư mục có tổ chức và tối ưu hóa ảnh.

## Cấu Trúc Thư Mục Upload
```
uploads/
├── brands/
│   ├── 2024/01/15/
│   │   ├── [filename].jpg
│   │   └── thumbnails/
│   │       └── [filename].jpg
├── products/
│   ├── 2024/01/15/
│   │   ├── [filename].jpg
│   │   └── thumbnails/
│   │       └── [filename].jpg
├── categories/
│   ├── 2024/01/15/
│   │   ├── [filename].jpg
│   │   └── thumbnails/
│   │       └── [filename].jpg
├── users/
│   └── avatars/
│       └── 2024/01/15/
│           └── [filename].jpg
├── temp/
└── backup/
```

## API Endpoints

### 1. Upload Ảnh Thương Hiệu
**POST** `/admin/api/upload/brands`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (MultipartFile)

**Response:**
```json
{
  "code": 1000,
  "message": "Upload thành công",
  "result": {
    "originalUrl": "/uploads/brands/2024/01/15/uuid.jpg",
    "thumbnailUrl": "/uploads/brands/2024/01/15/thumbnails/uuid.jpg",
    "filename": "uuid.jpg"
  }
}
```

### 2. Upload Ảnh Sản Phẩm
**POST** `/admin/api/upload/products`

**Request:**
- Content-Type: `multipart/form-data`
- Body: 
  - `files` (MultipartFile[]) - Mảng các file ảnh
  - `productId` (Long, optional) - ID sản phẩm để lưu vào database

**Response:**
```json
{
  "code": 1000,
  "message": "Upload thành công",
  "result": {
    "images": [
      {
        "originalUrl": "/uploads/products/2024/01/15/uuid1.jpg",
        "thumbnailUrl": "/uploads/products/2024/01/15/thumbnails/uuid1.jpg",
        "filename": "uuid1.jpg"
      }
    ],
    "count": 1
  }
}
```

### 3. Upload Ảnh Danh Mục
**POST** `/admin/api/upload/categories`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (MultipartFile)

**Response:**
```json
{
  "code": 1000,
  "message": "Upload thành công",
  "result": {
    "originalUrl": "/uploads/categories/2024/01/15/uuid.jpg",
    "thumbnailUrl": "/uploads/categories/2024/01/15/thumbnails/uuid.jpg",
    "filename": "uuid.jpg"
  }
}
```

### 4. Upload Avatar Người Dùng
**POST** `/admin/api/upload/users/avatar`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (MultipartFile)

**Response:**
```json
{
  "code": 1000,
  "message": "Upload avatar thành công",
  "result": {
    "avatarUrl": "/uploads/users/avatars/2024/01/15/uuid.jpg",
    "filename": "uuid.jpg"
  }
}
```

### 5. Xóa Ảnh
**DELETE** `/admin/api/upload/{filename}`

**Response:**
```json
{
  "code": 1000,
  "message": "Xóa ảnh thành công",
  "result": null
}
```

### 6. Lấy Thông Tin Ảnh
**GET** `/admin/api/upload/info/{filename}`

**Response:**
```json
{
  "code": 1000,
  "message": "Thông tin ảnh",
  "result": {
    "filename": "uuid.jpg",
    "size": 1024000,
    "lastModified": "2024-01-15T10:30:00Z",
    "url": "/uploads/brands/2024/01/15/uuid.jpg"
  }
}
```

## Tính Năng Tối Ưu Hóa

### 1. Tự Động Nén Ảnh
- Kích thước tối đa: 1200x1200px
- Chất lượng: 80%
- Hỗ trợ định dạng: JPG, PNG, GIF, BMP, WebP

### 2. Tạo Thumbnail
- Kích thước thumbnail: 300x300px
- Chất lượng: 70%
- Tự động tạo cho tất cả ảnh (trừ avatar)

### 3. Validation
- Kích thước file tối đa: 10MB
- Chỉ chấp nhận file ảnh hợp lệ
- Tự động kiểm tra định dạng file

### 4. Cấu Trúc Thư Mục Thông Minh
- Tổ chức theo ngày (yyyy/MM/dd)
- Tách biệt theo loại nội dung
- Tự động tạo thư mục khi cần

## Cấu Hình

### application.properties
```properties
# Cấu hình upload file
storage.location=D:\\LTWEB\\upload

# Cấu hình upload file tối ưu
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
spring.servlet.multipart.enabled=true

# Cấu hình static resources cho upload
spring.web.resources.static-locations=classpath:/static/,file:${storage.location}/
spring.mvc.static-path-pattern=/uploads/**

# Cấu hình tối ưu ảnh
image.optimization.max-width=1200
image.optimization.max-height=1200
image.optimization.thumbnail-size=300
image.optimization.quality=0.8
image.optimization.max-file-size=10485760
```

## Xử Lý Lỗi

### Lỗi Thường Gặp
1. **File quá lớn**: Kích thước file vượt quá 10MB
2. **Định dạng không hỗ trợ**: File không phải là ảnh hợp lệ
3. **Lỗi tối ưu hóa**: Không thể xử lý file ảnh
4. **Lỗi lưu trữ**: Không thể lưu file vào thư mục

### Mã Lỗi
- `1000`: Thành công
- `1001`: Lỗi chung
- `400`: Bad Request (file không hợp lệ)
- `500`: Internal Server Error

## Ví Dụ Sử Dụng

### JavaScript (Frontend)
```javascript
// Upload ảnh thương hiệu
const uploadBrandImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/admin/api/upload/brands', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};

// Upload nhiều ảnh sản phẩm
const uploadProductImages = async (files, productId) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (productId) formData.append('productId', productId);
  
  const response = await fetch('/admin/api/upload/products', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
};
```

### cURL
```bash
# Upload ảnh thương hiệu
curl -X POST \
  http://localhost:8080/admin/api/upload/brands \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@brand-image.jpg'

# Upload ảnh sản phẩm
curl -X POST \
  http://localhost:8080/admin/api/upload/products \
  -H 'Content-Type: multipart/form-data' \
  -F 'files=@product1.jpg' \
  -F 'files=@product2.jpg' \
  -F 'productId=123'
```

## Lưu Ý Quan Trọng

1. **Bảo mật**: API chỉ dành cho admin, cần xác thực
2. **Hiệu suất**: Ảnh được tối ưu hóa tự động để giảm kích thước
3. **Tổ chức**: Thư mục được sắp xếp theo ngày để dễ quản lý
4. **Backup**: Có thể cấu hình backup tự động
5. **Monitoring**: Log chi tiết cho việc debug và monitoring
