package vn.liora.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressRequest {
    String name;         // tên người nhận
    String phone;        // số điện thoại
    String addressDetail;       // số nhà, tên đường
    String wardId;         // id xã/phường
    String provinceId;     // id tỉnh/thành phố
    Boolean isDefault;
}
