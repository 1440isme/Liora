package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "OrderItem")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdOrderItem")
    private Long idOrderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdOrder", nullable = false)
    @JsonIgnore
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "IdProductItem", nullable = false)
    @JsonIgnore
    private ProductItem productItem;

    @Column(name = "CreatedDate", columnDefinition = "DATETIME")
    private LocalDateTime createdDate;

    @OneToOne(mappedBy = "orderItem", fetch = FetchType.LAZY)
    @JsonIgnore
    private Review review;
}
