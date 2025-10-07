package vn.liora.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class OrderUpdateRequest {

    Boolean paymentStatus;
    Boolean orderStatus;
}
