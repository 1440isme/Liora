package vn.liora.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.ProductCreationRequest;
import vn.liora.dto.request.ProductUpdateRequest;
import vn.liora.dto.response.ProductResponse;
import vn.liora.entity.Brand;
import vn.liora.entity.Category;
import vn.liora.entity.Product;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.ProductMapper;
import vn.liora.repository.BrandRepository;
import vn.liora.repository.CategoryRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.service.IProductService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Service
public class ProductServiceImpl implements IProductService {
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BrandRepository brandRepository;
    @Autowired
    private ProductMapper productMapper;

    // ========== BASIC CRUD ==========
    @Override
    public Product createProduct(ProductCreationRequest request) {
        try {
            System.out.println("=== START CREATE PRODUCT ===");

            // Validate brand
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
            System.out.println("Brand OK: " + brand.getName());

            // Validate category
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            System.out.println("Category OK: " + category.getName());

            // Check name uniqueness
            if (productRepository.existsByName(request.getName())) {
                throw new AppException(ErrorCode.PRODUCT_EXISTED);
            }
            System.out.println("Name uniqueness OK");

            // Create product
            Product product = productMapper.toProduct(request);
            System.out.println("Mapper OK");

            product.setBrand(brand);
            product.setCategory(category);
            product.setCreatedDate(LocalDateTime.now());
            product.setUpdatedDate(LocalDateTime.now());
            product.setSoldCount(0);
            product.setAverageRating(BigDecimal.ZERO);
            product.setRatingCount(0);
            System.out.println("Product setup OK");

            Product savedProduct = productRepository.save(product);
            System.out.println("Save OK: " + savedProduct.getProductId());

            return savedProduct; // ← Trả về Product thay vì ProductResponse

        } catch (Exception e) {
            System.out.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    public ProductResponse findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return productMapper.toProductResponse(product);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product =  productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // validate brand
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new AppException(ErrorCode.BRAND_NOT_FOUND));
            product.setBrand(brand);
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
            product.setCategory(category);
        }
        // check name uniqueness if name is being updated
        if (request.getName() != null && !request.getName().equalsIgnoreCase(product.getName())
            && productRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.PRODUCT_EXISTED);
        }

        productMapper.updateProduct(product, request);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
        return productMapper.toProductResponse(product);

    }

    @Override
    public void deleteById(Long id) {
        if (!productRepository.existsById(id)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        productRepository.deleteById(id);
    }

    @Override
    public void deleteAll() {
        productRepository.deleteAll();
    }

    @Override
    public long count() {
        return productRepository.count();
    }
    // ========== FIND ALL ==========
    @Override
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    @Override
    public Page<Product> findAll(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    public List<Product> findAllById(Iterable<Long> ids) {
        return productRepository.findAllById(ids);
    }

    @Override
    public Optional<Product> findByIdOptional(Long id) {
        return productRepository.findById(id);
    }

    // ========== SEARCH ==========
    @Override
    public List<Product> findByNameContaining(String name) {
        return productRepository.findByNameContaining(name);
    }

    @Override
    public Page<Product> findByNameContaining(String name, Pageable pageable) {
        return productRepository.findByNameContaining(name, pageable);
    }

    @Override
    public Optional<Product> findByName(String name) {
        return productRepository.findByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return productRepository.existsByName(name);
    }
    // ========== STATUS FILTERS ==========
    @Override
    public List<Product> findActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }

    @Override
    public List<Product> findInactiveProducts() {
        return productRepository.findByIsActiveFalse();
    }

    @Override
    public List<Product> findAvailableProducts() {
        return productRepository.findByAvailableTrue();
    }

    @Override
    public List<Product> findUnavailableProducts() {
        return productRepository.findByAvailableFalse();
    }

    @Override
    public List<Product> findActiveAvailableProducts() {
        return productRepository.findByIsActiveTrueAndAvailableTrue();
    }
    // ========== BRAND & CATEGORY FILTERS ==========
    @Override
    public List<Product> findByBrand(Long brandId) {
        return productRepository.findByBrandBrandId(brandId);
    }

    @Override
    public List<Product> findByCategory(Long categoryId) {
        return productRepository.findByCategoryCategoryId(categoryId);
    }

    @Override
    public List<Product> findActiveByBrand(Long brandId) {
        return productRepository.findByBrandBrandIdAndIsActiveTrue(brandId);
    }

    @Override
    public List<Product> findActiveByCategory(Long categoryId) {
        return productRepository.findByCategoryCategoryIdAndIsActiveTrue(categoryId);
    }
    // ========== PRICE FILTERS ==========
    @Override
    public List<Product> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return productRepository.findByPriceBetween(minPrice, maxPrice);
    }

    @Override
    public List<Product> findByPriceLessThanEqual(BigDecimal maxPrice) {
        return productRepository.findByPriceLessThanEqual(maxPrice);
    }

    @Override
    public List<Product> findByPriceGreaterThanEqual(BigDecimal minPrice) {
        return productRepository.findByPriceGreaterThanEqual(minPrice);
    }

    @Override
    public List<Product> findActiveAvailableByPriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
        return productRepository.findActiveAvailableByPriceRange(minPrice, maxPrice);
    }
    // ========== STOCK FILTERS ==========
    @Override
    public List<Product> findByStockGreaterThan(Integer minStock) {
        return productRepository.findByStockGreaterThan(minStock);
    }

    @Override
    public List<Product> findByStockLessThanEqual(Integer maxStock) {
        return productRepository.findByStockLessThanEqual(maxStock);
    }

    @Override
    public List<Product> findByStockRange(Integer minStock, Integer maxStock) {
        return productRepository.findByStockBetween(minStock, maxStock);
    }

    @Override
    public List<Product> findInStockProducts() {
        return productRepository.findByStockGreaterThan(0);
    }

    @Override
    public List<Product> findOutOfStockProducts() {
        return productRepository.findByStockLessThanEqual(0);
    }
    // ========== RATING FILTERS ==========
    @Override
    public List<Product> findByRatingGreaterThanEqual(BigDecimal minRating) {
        return productRepository.findByAverageRatingGreaterThanEqual(minRating);
    }

    @Override
    public List<Product> findByRatingRange(BigDecimal minRating, BigDecimal maxRating) {
        return productRepository.findByAverageRatingBetween(minRating, maxRating);
    }

    @Override
    public List<Product> findHighRatedProducts(BigDecimal minRating) {
        return productRepository.findByAverageRatingGreaterThanEqual(minRating);
    }
    // ========== COMBINED FILTERS ==========
    @Override
    public List<Product> findActiveAvailableByBrandAndCategory(Long brandId, Long categoryId) {
        return productRepository.findActiveAvailableByBrandAndCategory(brandId, categoryId);
    }

    @Override
    public Page<Product> searchActiveAvailableProducts(String keyword, Pageable pageable) {
        return productRepository.searchActiveAvailableProducts(keyword, pageable);
    }
    // ========== SORTING ==========
    @Override
    public List<Product> findActiveAvailableOrderByPriceAsc() {
        return productRepository.findActiveAvailableOrderByPriceAsc();
    }

    @Override
    public List<Product> findActiveAvailableOrderByPriceDesc() {
        return productRepository.findActiveAvailableOrderByPriceDesc();
    }

    @Override
    public List<Product> findActiveAvailableOrderByRatingDesc() {
        return productRepository.findActiveAvailableOrderByRatingDesc();
    }

    @Override
    public List<Product> findActiveAvailableOrderBySoldCountDesc() {
        return productRepository.findActiveAvailableOrderBySoldCountDesc();
    }
    // ========== BUSINESS QUERIES ==========
    @Override
    public List<Product> findTopSellingInStockProducts(Pageable pageable) {
        return productRepository.findTopSellingInStockProducts(pageable);
    }

    @Override
    public List<Product> findHighRatedProducts(BigDecimal minRating, Pageable pageable) {
        return productRepository.findHighRatedProducts(minRating, pageable);
    }

    @Override
    public List<Product> findNewestProducts(Pageable pageable) {
        return productRepository.findNewestProducts(pageable);
    }
    // ========== ADMIN QUERIES ==========
    @Override
    public Page<Product> findActiveProductsWithPagination(Pageable pageable) {
        return productRepository.findByIsActiveWithPagination(true, pageable);
    }

    @Override
    public Page<Product> findAvailableProductsWithPagination(Pageable pageable) {
        return productRepository.findByAvailableWithPagination(true, pageable);
    }

    @Override
    public Page<Product> findInactiveProductsWithPagination(Pageable pageable) {
        return productRepository.findByIsActiveWithPagination(false, pageable);
    }
    // ========== STATUS MANAGEMENT (SOFT DELETE) ==========
    @Override
    public void activateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setIsActive(true);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Override
    public void deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setIsActive(false);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Override
    public void setAvailable(Long id, Boolean available) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setAvailable(available);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Override
    public void updateStock(Long id, Integer stock) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setStock(stock);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }

    @Override
    public void updateSoldCount(Long id, Integer soldCount) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        product.setSoldCount(soldCount);
        product.setUpdatedDate(LocalDateTime.now());
        productRepository.save(product);
    }
    // ========== STATISTICS ==========
    @Override
    public Long countActiveProducts() {
        return productRepository.countActiveProducts();
    }

    @Override
    public Long countActiveAvailableProducts() {
        return productRepository.countActiveAvailableProducts();
    }

    @Override
    public Long countOutOfStockProducts() {
        return productRepository.countOutOfStockProducts();
    }

    @Override
    public Long countByBrand(Long brandId) {
        return productRepository.countByBrand(brandId);
    }

    @Override
    public Long countByCategory(Long categoryId) {
        return productRepository.countByCategory(categoryId);
    }
}
