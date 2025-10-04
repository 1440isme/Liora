package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.liora.entity.Image;

import java.util.List;

public interface ImageRepository extends JpaRepository<Image,Long> {
    List<Image> findByProductId(Long productId);
    void deleteByProductId(Long productId);
}
