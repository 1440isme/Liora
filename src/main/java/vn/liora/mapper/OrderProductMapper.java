package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.entity.CartProduct;
import vn.liora.entity.OrderProduct;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderProductMapper {
    @Mapping(target = "idOrderProduct", ignore = true)
    @Mapping(target = "order", ignore = true)                  // set thủ công
    @Mapping(target = "product", source = "product")          // map từ CartProduct
    @Mapping(target = "totalPrice", source = "totalPrice")      // đảm bảo map
    OrderProduct toOrderProduct(CartProduct cartProduct);


    // Chuyển OrderProduct → Response
    @Mapping(target = "idOrder", source = "order.idOrder")
    @Mapping(target = "idProduct", source = "product.productId")
    OrderProductResponse toOrderProductResponse(OrderProduct orderProduct);
    List<OrderProductResponse> toOrderProductResponseList(List<OrderProduct> orderProducts);


}
