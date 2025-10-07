package vn.liora.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "Orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdOrder")
    Long idOrder;
    @Column(name = "OrderDate", nullable = false)
    LocalDateTime orderDate;
    @Column(name = "ShippingFee", nullable = false)
    BigDecimal shippingFee;
    @Column(name = "TotalDiscount", nullable = false)
    BigDecimal totalDiscount;
    @Column(name = "Total", nullable = false)
    BigDecimal total ;

    @Column(name = "PaymentMethod", nullable = false)
    String paymentMethod;

    @Column(name = "PaymentStatus", nullable = false)
    Boolean paymentStatus = false;

    @Column(name = "OrderStatus", nullable = false)
    Boolean orderStatus = true;

    @ManyToOne
    @JoinColumn(name = "IdAddress", nullable = false)
    @JsonIgnore
    private Address address;


    @ManyToOne
    @JoinColumn(name = "IdUser")
    @JsonIgnore
    private User user;

}
