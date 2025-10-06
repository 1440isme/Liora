# Hướng Dẫn Setup Cho Team

## 📁 Cấu Trúc Thư Mục Upload

Sau khi cập nhật, ảnh sẽ được lưu trong project:

```
D:\WebSpringBoot\Liora\
├── src\main\resources\static\          ← Static content
├── uploads\                            ← Upload files (tự động tạo)
│   ├── brands\2024\01\15\
│   ├── products\2024\01\15\
│   ├── categories\2024\01\15\
│   ├── users\avatars\2024\01\15\
│   ├── temp\
│   └── backup\
└── target\
```

## 🔧 Setup Cho Từng Thành Viên

### **1. Clone Project**
```bash
git clone [repository-url]
cd Liora
```

### **2. Cấu Hình Upload Path**
File `application.properties` đã được cập nhật:
```properties
storage.location=./uploads
```

### **3. Chạy Ứng Dụng**
```bash
mvn spring-boot:run
```

Thư mục `uploads/` sẽ được **tự động tạo** khi ứng dụng khởi động.

## 📋 Quản Lý File Upload

### **Sử dụng Git LFS (Khuyến nghị)**
- File `.gitattributes` đã được cấu hình để track file ảnh
- Ảnh được commit và chia sẻ giữa các thành viên
- Repository không bị nặng vì sử dụng Git LFS

### **Setup Git LFS cho từng thành viên:**

#### **Bước 1: Cài đặt Git LFS (QUAN TRỌNG - chỉ cần làm 1 lần)**
```bash
# Cài đặt Git LFS
git lfs install

# Kiểm tra cài đặt
git lfs version
```

#### **Bước 2: Clone project (nếu chưa có)**
```bash
git clone [repository-url]
cd Liora
```

#### **Bước 3: Pull latest changes**
```bash
git pull origin main
# Ảnh sẽ được tự động download từ Git LFS
```

#### **Bước 4: Chạy ứng dụng**
```bash
mvn spring-boot:run
```

### **⚠️ Lưu Ý Quan Trọng:**
- **Phải cài Git LFS** trước khi clone/pull project
- Nếu không cài, ảnh sẽ không được download
- Mỗi máy chỉ cần cài 1 lần duy nhất

### **Workflow với Git LFS:**
```bash
# Upload ảnh qua API → Ảnh được lưu trong uploads/
# Commit và push
git add .
git commit -m "Add new images"
git push origin main

# Các thành viên khác pull để lấy ảnh
git pull origin main
```

## 🌐 Truy Cập Ảnh

### **URL Pattern**
```
http://localhost:8080/uploads/[đường-dẫn-ảnh]
```

### **Ví Dụ**
```
# Ảnh thương hiệu
http://localhost:8080/uploads/brands/2024/01/15/uuid.jpg

# Thumbnail
http://localhost:8080/uploads/brands/2024/01/15/thumbnails/uuid.jpg

# Avatar
http://localhost:8080/uploads/users/avatars/2024/01/15/uuid.jpg
```

## 🔄 Workflow Cho Team

### **Development**
1. Mỗi thành viên chạy ứng dụng local
2. Upload ảnh test qua API
3. Ảnh được lưu trong `uploads/` local
4. Không commit ảnh (đã có .gitignore)

### **Testing**
1. Sử dụng ảnh test có sẵn
2. Hoặc tạo ảnh test riêng
3. Test các API upload

### **Production**
1. Cấu hình đường dẫn production
2. Sử dụng cloud storage (AWS S3, etc.)
3. Backup dữ liệu thường xuyên

## ⚠️ Lưu Ý Quan Trọng

1. **Không commit ảnh** trừ khi cần thiết
2. **Backup dữ liệu** trước khi deploy
3. **Test API** trước khi merge code
4. **Cấu hình production** khác với development

## 🚀 API Endpoints

### **Upload Ảnh Thương Hiệu**
```bash
POST /admin/api/upload/brands
Content-Type: multipart/form-data
Body: file
```

### **Upload Ảnh Sản Phẩm**
```bash
POST /admin/api/upload/products
Content-Type: multipart/form-data
Body: files[] + productId (optional)
```

### **Upload Ảnh Danh Mục**
```bash
POST /admin/api/upload/categories
Content-Type: multipart/form-data
Body: file
```

### **Upload Avatar**
```bash
POST /admin/api/upload/users/avatar
Content-Type: multipart/form-data
Body: file
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra thư mục `uploads/` có được tạo không
2. Kiểm tra quyền ghi file
3. Kiểm tra cấu hình `application.properties`
4. Liên hệ team lead để được hỗ trợ
