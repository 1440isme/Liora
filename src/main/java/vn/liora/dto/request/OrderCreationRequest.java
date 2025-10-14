package vn.liora.dto.request;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

public class OrderCreationRequest {


    @NotBlank(message = "VALIDATION_REQUIRED_FIELD")
    String  paymentMethod;
    Long idAddress;
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    String name;
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    String phone;
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    String addressDetail;
    String email;
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    String note;

    Long discountId;
}
