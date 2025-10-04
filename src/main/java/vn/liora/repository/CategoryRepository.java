package vn.liora.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Category;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category,Long> {
    List<Category> findByNameContaining(String name);
    Page<Category> findByNameContaining(String name, Pageable pageable);
    Optional<Category> findByName(String name);
    boolean existsByName(String name);

    List<Category> findByParentCategoryIsNull(); // lấy tất cả danh mục gốc (parentCategory = null)
    List<Category> findByParentCategory(Category parentCategory); // lấy danh mục con của danh mục cha cụ thể
    List<Category> findByParentCategoryId(Long id); // lấy danh mục con của danh mục cha cụ thể

    List<Category> findByParentCategoryNotNull(); // lấy tất cả danh mục con (ko phải danh mục gốc)

    @Query("SELECT c FROM Category c WHERE c.parentCategoryId IS NULL ORDER BY c.name")
    List<Category> findRootCategories();

    @Query("SELECT c FROM Category c WHERE c.parentCategoryId = :parentId ORDER BY c.name")
    List<Category> findChildCategories(@Param("parentId") Long parentId);

    // Kiểm tra danh mục có con không
    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE c.parentCategoryId = :categoryId")
    boolean hasChildren(@Param("categoryId") Long categoryId);

    List<Category> findByIsActiveTrue();
    List<Category> findByIsActiveFalse();
    List<Category> findByIsActiveTrueAndParentCategoryIsNull();
    List<Category> findByIsActiveTrueAndParentCategoryId(Long parentId);
}
