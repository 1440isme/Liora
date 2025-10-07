package vn.liora.dto.request;

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
    @NotNull(message = "VALIDATION_REQUIRED_FIELD")
    Long idAddress;
}
