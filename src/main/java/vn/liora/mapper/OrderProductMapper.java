package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.OrderProductCreationRequest;
import vn.liora.dto.request.OrderProductUpdateRequest;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.entity.OrderProduct;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderProductMapper {

    // Tạo OrderProduct mới từ request
    @Mapping(target = "idOrderProduct", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "product", ignore = true)
    OrderProduct toOrderProduct(OrderProductCreationRequest request);

    // Chuyển OrderProduct → Response
    @Mapping(target = "idOrder", source = "order.idOrder")
    @Mapping(target = "idProduct", source = "product.productId")
    OrderProductResponse toOrderProductResponse(OrderProduct orderProduct);

    List<OrderProductResponse> toOrderProductResponseList(List<OrderProduct> orderProducts);

    @Mapping(target = "idOrderProduct", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "product", ignore = true)
    void updateOrderProduct( @MappingTarget OrderProduct orderProduct,OrderProductUpdateRequest request);
}
