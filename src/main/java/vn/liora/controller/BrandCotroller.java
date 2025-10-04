package vn.liora.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.BrandCreationRequest;
import vn.liora.dto.request.BrandUpdateRequest;
import vn.liora.dto.response.BrandResponse;
import vn.liora.entity.Brand;
import vn.liora.service.impl.BrandServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/brands")
public class BrandCotroller {
    @Autowired
    private BrandServiceImpl brandService;

    @PostMapping
    ApiResponse<Brand> addBrand(@RequestBody BrandCreationRequest request){
        ApiResponse<Brand> apiResponse = new ApiResponse<>();
        apiResponse.setResult(brandService.createBrand(request));
        return apiResponse;
    }
    // GET /brands - Lấy tất cả brands
    @GetMapping
    ApiResponse<Page<Brand>> getAllBrands(Pageable pageable){
        ApiResponse<Page<Brand>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(brandService.findAll(pageable));
        return apiResponse;
    }

    // GET /brands/all - Lấy tất cả brands không phân trang
    @GetMapping("/all")
    ApiResponse<List<Brand>> getAllBrands(){
        ApiResponse<List<Brand>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(brandService.findAll());
        return apiResponse;
    }

    // GET /brands/{id} - lấy brand theo id
    @GetMapping("/{id}")
    ApiResponse<BrandResponse> getBrandById(@PathVariable Long id) {
        ApiResponse<BrandResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(brandService.findById(id));
        return apiResponse;
    }

    @GetMapping("/search")
    ApiResponse<Page<Brand>> searchBrands(@RequestParam String name, Pageable pageable) {
        ApiResponse<Page<Brand>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(brandService.findByNameContaining(name, pageable));
        return apiResponse;
    }

    @PutMapping("/{id}")
    ApiResponse<BrandResponse> updateBrand(@PathVariable Long id, @RequestBody BrandUpdateRequest request){
        ApiResponse<BrandResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(brandService.updateBrand(id, request));
        return apiResponse;
    }

    @DeleteMapping("/{id}")
    ApiResponse<String> deleteBrand(@PathVariable Long id){
        ApiResponse<String> apiResponse = new ApiResponse<>();
        brandService.deleteById(id);
        apiResponse.setResult("Brand deleted successfully");
        return apiResponse;
    }

    // Thêm endpoints
    @GetMapping("/active")
    ApiResponse<List<Brand>> getActiveBrands() {
        ApiResponse<List<Brand>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(brandService.findActiveBrands());
        return apiResponse;
    }

    @PutMapping("/{id}/deactivate")
    ApiResponse<String> deactivateBrand(@PathVariable Long id) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        brandService.deactivateBrand(id);
        apiResponse.setResult("Brand deactivated successfully");
        return apiResponse;
    }

    @PutMapping("/{id}/activate")
    ApiResponse<String> activateBrand(@PathVariable Long id) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        brandService.activateBrand(id);
        apiResponse.setResult("Brand activated successfully");
        return apiResponse;
    }

}
