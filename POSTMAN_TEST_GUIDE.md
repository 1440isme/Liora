# Hướng dẫn test Categories API với Postman

## 🚀 Cách import và sử dụng

### 1. Import Collection
1. Mở Postman
2. Click **Import** 
3. Chọn file `postman-test-categories.json`
4. Collection "Categories API Test" sẽ xuất hiện

### 2. Cấu hình Environment
1. Tạo Environment mới: **Categories Test**
2. Thêm variable:
   - **Key:** `baseUrl`
   - **Value:** `http://localhost:8080` (hoặc URL server của bạn)

### 3. Test Cases

#### 📋 **Get All Categories (Paginated)**
- **Method:** GET
- **URL:** `{{baseUrl}}/admin/api/categories`
- **Mô tả:** Lấy tất cả categories với phân trang
- **Expected Response:**
```json
{
  "result": {
    "content": [
      {
        "categoryId": 1,
        "name": "Chăm sóc da mặt",
        "isParent": true,
        "isActive": true,
        "parentCategoryId": null
      }
    ],
    "totalElements": 10,
    "totalPages": 1
  },
  "message": "Lấy danh sách danh mục thành công"
}
```

#### 🔍 **Get All Categories with Search**
- **Method:** GET
- **URL:** `{{baseUrl}}/admin/api/categories?search=chăm sóc`
- **Mô tả:** Tìm kiếm categories theo tên

#### 🎯 **Get All Categories with Status Filter**
- **Method:** GET
- **URL:** `{{baseUrl}}/admin/api/categories?status=active`
- **Mô tả:** Lọc categories theo trạng thái

#### 🌳 **Get Categories Tree**
- **Method:** GET
- **URL:** `{{baseUrl}}/admin/api/categories/tree`
- **Mô tả:** Lấy cây danh mục (chỉ root categories)
- **Expected Response:**
```json
{
  "result": [
    {
      "categoryId": 1,
      "name": "Chăm sóc da mặt",
      "isParent": true,
      "isActive": true,
      "children": [
        {
          "categoryId": 2,
          "name": "Toner",
          "isParent": false,
          "isActive": true
        }
      ]
    }
  ],
  "message": "Lấy cây danh mục thành công"
}
```

#### 📄 **Get Category by ID**
- **Method:** GET
- **URL:** `{{baseUrl}}/admin/api/categories/1`
- **Mô tả:** Lấy thông tin chi tiết một category

#### ➕ **Create New Category**
- **Method:** POST
- **URL:** `{{baseUrl}}/admin/api/categories`
- **Body:**
```json
{
  "name": "Test Category",
  "parentCategoryId": null,
  "isParent": true,
  "isActive": true
}
```

#### ✏️ **Update Category**
- **Method:** PUT
- **URL:** `{{baseUrl}}/admin/api/categories/1`
- **Body:**
```json
{
  "name": "Updated Category Name",
  "parentCategoryId": 2,
  "isParent": false,
  "isActive": true
}
```

## 🧪 Test Scenarios

### Scenario 1: Kiểm tra API trả về đủ dữ liệu
1. **GET** `/admin/api/categories`
2. Kiểm tra `result.content` có chứa tất cả categories
3. Kiểm tra mỗi category có đầy đủ fields: `categoryId`, `name`, `isParent`, `isActive`

### Scenario 2: So sánh Tree vs All Categories
1. **GET** `/admin/api/categories/tree` → Chỉ root categories
2. **GET** `/admin/api/categories` → Tất cả categories
3. So sánh số lượng: Tree < All Categories

### Scenario 3: Test Filtering
1. **GET** `/admin/api/categories?status=active` → Chỉ active categories
2. **GET** `/admin/api/categories?status=inactive` → Chỉ inactive categories
3. **GET** `/admin/api/categories?search=chăm sóc` → Tìm kiếm theo tên

## 🔍 Debug JavaScript

### Console Logs để kiểm tra:
```javascript
// Trong browser console, kiểm tra:
console.log('🔍 All categories from API:', response.result.content);
console.log('🔍 Total categories received:', categories.length);
console.log('🔍 Category: [Tên] (ID: [ID]) - isParent: [true/false]');
```

### Expected Results:
- **API `/categories`** → Trả về tất cả categories (paginated)
- **API `/categories/tree`** → Chỉ trả về root categories
- **JavaScript** → Xử lý tất cả categories từ `/categories`
- **Dropdown** → Hiển thị nhiều options hơn

## 🚨 Troubleshooting

### Lỗi thường gặp:
1. **404 Not Found** → Kiểm tra URL và port
2. **CORS Error** → Kiểm tra `@CrossOrigin` annotation
3. **Empty Response** → Kiểm tra database có dữ liệu không
4. **JavaScript Error** → Kiểm tra console logs

### Debug Steps:
1. Test API trực tiếp với Postman
2. Kiểm tra response structure
3. So sánh với JavaScript expectations
4. Check browser console for errors
