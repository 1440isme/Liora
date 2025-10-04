package vn.liora.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.CategoryCreationRequest;
import vn.liora.dto.request.CategoryUpdateRequest;
import vn.liora.dto.response.CategoryResponse;
import vn.liora.entity.Category;
import vn.liora.service.impl.CategoryServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {
    @Autowired
    private CategoryServiceImpl categoryService;

    @PostMapping
    ApiResponse<Category> createCategory(@RequestBody CategoryCreationRequest request){
        ApiResponse<Category> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.createCategory(request));
        return apiResponse;
    }

    // GET /categories - Lấy tất cả categories (có phân trang)
    @GetMapping
    ApiResponse<Page<Category>> getAllCategoriesWithoutPagination(Pageable pageable){
        ApiResponse<Page<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findAll(pageable));
        return apiResponse;
    }

    // GET /categories/all - Lấy tất cả categories (không phân trang)
    @GetMapping("/all")
    ApiResponse<List<Category>> getAllCategoriesWithoutPagination(){
        ApiResponse<List<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findAll());
        return apiResponse;
    }

    @GetMapping("/{id}")
    ApiResponse<CategoryResponse> getCategoryById(@PathVariable Long id){
        ApiResponse<CategoryResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findById(id));
        return apiResponse;
    }

    // GET /categories/search - Tìm kiếm category theo tên
    @GetMapping("/search")
    ApiResponse<Page<Category>> searchCategories(@RequestParam String name, Pageable pageable) {
        ApiResponse<Page<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findByNameContaining(name, pageable));
        return apiResponse;
    }

    @PutMapping("/{id}")
    ApiResponse<CategoryResponse> updateCategory(@PathVariable Long id, @RequestBody CategoryUpdateRequest request){
        ApiResponse<CategoryResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.updateCategory(id, request));
        return apiResponse;
    }

    @DeleteMapping("/{id}")
    ApiResponse<String> deleteCategory(@PathVariable Long id){
        ApiResponse<String> apiResponse = new ApiResponse<>();
        categoryService.deleteById(id);
        apiResponse.setResult("Category deleted successfully");
        return apiResponse;
    }

    @GetMapping("/root")
    ApiResponse<List<Category>> getRootCategories(){
        ApiResponse<List<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findRootCategories());
        return apiResponse;
    }

    @GetMapping("/{id}/children")
    ApiResponse<List<Category>> getChildrenCategories(@PathVariable Long id){
        ApiResponse<List<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findChildCategories(id));
        return apiResponse;
    }

    @GetMapping("/children")
    ApiResponse<List<Category>> getAllChildrenCategories(){
        ApiResponse<List<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findAllChildCategories());
        return apiResponse;
    }

    // Thêm endpoints
    @GetMapping("/active/root")
    ApiResponse<List<Category>> getActiveRootCategories() {
        ApiResponse<List<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findActiveRootCategories());
        return apiResponse;
    }

    @GetMapping("/active/{id}/children")
    ApiResponse<List<Category>> getActiveChildCategories(@PathVariable Long id) {
        ApiResponse<List<Category>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(categoryService.findActiveChildCategories(id));
        return apiResponse;
    }

    @PutMapping("/{id}/deactivate")
    ApiResponse<String> deactivateCategory(@PathVariable Long id) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        categoryService.deactivateCategory(id);
        apiResponse.setResult("Category deactivated successfully");
        return apiResponse;
    }

    @PutMapping("/{id}/activate")
    ApiResponse<String> activateCategory(@PathVariable Long id) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        categoryService.activateCategory(id);
        apiResponse.setResult("Category activated successfully");
        return apiResponse;
    }

}
