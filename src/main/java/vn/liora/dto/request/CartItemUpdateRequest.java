package vn.liora.dto.request;

import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemUpdateRequest {
    @Min(value = 1, message = "VALIDATION_QUANTITY_MIN_ONE")
    Integer quantity;
    Boolean choose;
}
