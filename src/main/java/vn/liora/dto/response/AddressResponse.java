package vn.liora.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressResponse {
    Long idAddress;
    String name;
    String phone;
    String addressDetail;
    String ward;
    String province;
    Boolean isDefault;
    Long idUser;


}
