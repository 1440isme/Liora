package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.liora.entity.Image;

import java.util.List;

public interface ImageRepository extends JpaRepository<Image,Long> {
    List<Image> findByProductProductId(Long productId);
    @Query("DELETE FROM Image i WHERE i.product.productId = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}
