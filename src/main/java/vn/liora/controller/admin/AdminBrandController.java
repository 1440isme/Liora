package vn.liora.controller.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.BrandCreationRequest;
import vn.liora.dto.request.BrandUpdateRequest;
import vn.liora.dto.response.BrandResponse;
import vn.liora.entity.Brand;
import vn.liora.mapper.BrandMapper;
import vn.liora.service.impl.BrandServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/admin/api/brands")
public class AdminBrandController {

    @Autowired
    private BrandServiceImpl brandService;

    @Autowired
    private BrandMapper brandMapper;

    @PostMapping
    public ResponseEntity<ApiResponse<BrandResponse>> addBrand(@Valid @RequestBody BrandCreationRequest request) {
        ApiResponse<BrandResponse> response = new ApiResponse<>();
        try {
            Brand brand = brandService.createBrand(request);
            BrandResponse brandResponse = brandMapper.toBrandResponse(brand);
            response.setResult(brandResponse);
            response.setMessage("Tạo thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi tạo thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BrandResponse>>> getAllBrands(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String sortBy,
        Pageable pageable) {
    ApiResponse<Page<BrandResponse>> response = new ApiResponse<>();
    try {
        Page<Brand> brands;
        
        // Xử lý sort
        if (sortBy != null && !sortBy.isEmpty()) {
            pageable = this.createSortedPageable(pageable, sortBy);
        }
        
        // Nếu có search, dùng search method
        if (search != null && !search.trim().isEmpty()) {
            brands = brandService.findByNameContaining(search.trim(), pageable);
        }
        // Nếu có filter status
        else if (status != null && !status.isEmpty()) {
            if ("ACTIVE".equals(status)) {
                brands = brandService.findActiveBrands(pageable);
            } else if ("INACTIVE".equals(status)) {
                brands = brandService.findInactiveBrands(pageable);
            } else {
                brands = brandService.findAll(pageable);
            }
        }
        // Mặc định
        else {
            brands = brandService.findAll(pageable);
        }
        
        // Convert to BrandResponse
        Page<BrandResponse> brandResponses = brands.map(brandMapper::toBrandResponse);
        response.setResult(brandResponses);
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        response.setCode(500);
        response.setMessage("Lỗi khi lấy danh sách thương hiệu: " + e.getMessage());
        return ResponseEntity.internalServerError().body(response);
    }
}
    
    private Pageable createSortedPageable(Pageable pageable, String sortBy) {
        switch (sortBy) {
            case "name_desc":
                return org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(), 
                    pageable.getPageSize(), 
                    org.springframework.data.domain.Sort.by("name").descending()
                );
            case "name":
            default:
                return org.springframework.data.domain.PageRequest.of(
                    pageable.getPageNumber(), 
                    pageable.getPageSize(), 
                    org.springframework.data.domain.Sort.by("name").ascending()
                );
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getAllBrands() {
        ApiResponse<List<BrandResponse>> response = new ApiResponse<>();
        try {
            List<Brand> brands = brandService.findAll();
            List<BrandResponse> brandResponses = brands.stream()
                    .map(brandMapper::toBrandResponse)
                    .toList();
            response.setResult(brandResponses);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi lấy danh sách thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponse>> getBrandById(@PathVariable Long id) {
        ApiResponse<BrandResponse> response = new ApiResponse<>();
        try {
            BrandResponse brandResponse = brandService.findById(id);
            response.setResult(brandResponse);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(404);
            response.setMessage("Không tìm thấy thương hiệu với ID: " + id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BrandResponse>>> searchBrands(@RequestParam String name, Pageable pageable) {
        ApiResponse<Page<BrandResponse>> response = new ApiResponse<>();
        try {
            Page<Brand> brands = brandService.findByNameContaining(name, pageable);
            Page<BrandResponse> brandResponses = brands.map(brandMapper::toBrandResponse);
            response.setResult(brandResponses);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi tìm kiếm thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandResponse>> updateBrand(
            @PathVariable Long id, 
            @Valid @RequestBody BrandUpdateRequest request) {
        ApiResponse<BrandResponse> response = new ApiResponse<>();
        try {
            BrandResponse brandResponse = brandService.updateBrand(id, request);
            response.setResult(brandResponse);
            response.setMessage("Cập nhật thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi cập nhật thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteBrand(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            brandService.deleteById(id);
            response.setResult("Xóa thương hiệu thành công");
            response.setMessage("Xóa thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi xóa thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<String>> activateBrand(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            brandService.activateBrand(id);
            response.setResult("Kích hoạt thương hiệu thành công");
            response.setMessage("Kích hoạt thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi kích hoạt thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<String>> deactivateBrand(@PathVariable Long id) {
        ApiResponse<String> response = new ApiResponse<>();
        try {
            brandService.deactivateBrand(id);
            response.setResult("Vô hiệu hóa thương hiệu thành công");
            response.setMessage("Vô hiệu hóa thương hiệu thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.setCode(500);
            response.setMessage("Lỗi khi vô hiệu hóa thương hiệu: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Thêm endpoints cho user (read-only)
    @GetMapping("/public/active")
    public ResponseEntity<ApiResponse<List<BrandResponse>>> getActiveBrandsForUser() {
    ApiResponse<List<BrandResponse>> response = new ApiResponse<>();
    try {
        // Tạo Pageable để lấy tất cả brands
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        Page<Brand> brandPage = brandService.findActiveBrands(pageable);
        List<Brand> brands = brandPage.getContent();
        
        List<BrandResponse> brandResponses = brands.stream()
                .map(brandMapper::toBrandResponse)
                .toList();
        response.setResult(brandResponses);
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        response.setCode(500);
        response.setMessage("Lỗi khi lấy danh sách thương hiệu: " + e.getMessage());
        return ResponseEntity.internalServerError().body(response);
    }
}

}