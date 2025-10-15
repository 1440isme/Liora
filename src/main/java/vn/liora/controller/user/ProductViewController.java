package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import vn.liora.entity.Product;
import vn.liora.dto.response.ProductResponse;
import vn.liora.service.ICategoryService;
import vn.liora.service.IProductService;

import java.util.List;

@Controller
@RequestMapping("/product")
@RequiredArgsConstructor
public class ProductViewController {

    private final ICategoryService categoryService;
    private final IProductService productService;

    @GetMapping("/view/category/{categoryId}")
    public String getProductsByCategory(@PathVariable Long categoryId, Model model) {
        try {
            // Get category info for display
            var category = categoryService.findById(categoryId);
            model.addAttribute("categoryId", categoryId);
            model.addAttribute("categoryName", category.getName());
            model.addAttribute("categoryDescription", "Sản phẩm trong danh mục " + category.getName());
            
            return "user/categories/category-products";
        } catch (Exception e) {
            // If category not found, redirect to home
            return "redirect:/";
        }
    }

    @GetMapping("/{id}")
    public String productDetail(@PathVariable Long id, 
                               @RequestParam(required = false) String from,
                               @RequestParam(required = false) Long brandId,
                               @RequestParam(required = false) Long categoryId,
                               Model model) {
        try {
            ProductResponse productResponse = productService.findById(id);
            if (productResponse == null) {
                return "redirect:/";
            }
            
            model.addAttribute("product", productResponse);
            
            // DEBUG: Log parameters
            System.out.println("=== PRODUCT DETAIL DEBUG ===");
            System.out.println("Product ID: " + id);
            System.out.println("From: " + from);
            System.out.println("Brand ID: " + brandId);
            System.out.println("Category ID: " + categoryId);
            System.out.println("Product Brand Name: " + productResponse.getBrandName());
            System.out.println("Product Category Name: " + productResponse.getCategoryName());
            
            // Add navigation context for breadcrumb
            if ("brand".equals(from) && brandId != null) {
                System.out.println("Setting fromBrand = true for brandId: " + brandId + ", brandName: " + productResponse.getBrandName());
                model.addAttribute("fromBrand", true);
                model.addAttribute("brandId", brandId);
                model.addAttribute("brandName", productResponse.getBrandName());
            } else if ("category".equals(from) && categoryId != null) {
                System.out.println("Setting fromCategory = true for categoryId: " + categoryId + ", categoryName: " + productResponse.getCategoryName());
                model.addAttribute("fromCategory", true);
                model.addAttribute("categoryId", categoryId);
                model.addAttribute("categoryName", productResponse.getCategoryName());
            } else {
                System.out.println("No specific navigation context (fromBrand or fromCategory) set.");
            }
            System.out.println("=== END DEBUG ===");
            return "user/products/product-detail";
        } catch (Exception e) {
            return "redirect:/";
        }
    }

    // API endpoint for related products
    @GetMapping("/api/related/{productId}")
    public ResponseEntity<List<Product>> getRelatedProducts(@PathVariable Long productId) {
        try {
            // Get the current product
            ProductResponse currentProductResponse = productService.findById(productId);
            if (currentProductResponse == null) {
                return ResponseEntity.notFound().build();
            }

            // Get related products from the same category, excluding current product
            List<Product> relatedProducts = productService.findByCategoryAndIdNot(
                currentProductResponse.getCategoryId(), 
                productId
            );

            // Limit to 4 products
            if (relatedProducts.size() > 4) {
                relatedProducts = relatedProducts.subList(0, 4);
            }

            return ResponseEntity.ok(relatedProducts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
