package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor

@Entity
@Table(name = "Products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdProduct")
    private Long productId;

    @Column(name = "Name", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String name;

    @Column(name = "Description", nullable = false, columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(name = "Price", precision = 10, scale = 2, nullable = false)
    @DecimalMin(value = "0.0", message = "Price must be positive")
    private BigDecimal price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdBrand")
    @JsonIgnore
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdCategory")
    @JsonIgnore
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Image> images;

    @Column(name = "Stock")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @Column(name = "SoldCount")
    private Integer soldCount;

    @Column(name = "CreatedDate", columnDefinition = "DATETIME")
    private LocalDateTime createdDate;

    @Column(name = "UpdatedDate", columnDefinition = "DATETIME")
    private LocalDateTime updatedDate;

    @Column(name = "Available")
    private Boolean available;

    @Column(name = "AverageRating", precision = 2, scale = 1)
    @DecimalMin(value = "0.0", message = "Rating must be at least 0.0")
    @DecimalMax(value = "5.0", message = "Rating must be at most 5.0")
    private BigDecimal averageRating;

    @Transient
    private Integer ratingCount;

    @Column(name = "IsActive")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CartProduct> cartProducts;
}
