package vn.liora.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApplyDiscountRequest {
    
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    private Long orderId;
    
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    private Long discountId;
}