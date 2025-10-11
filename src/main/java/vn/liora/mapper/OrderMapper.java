package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.OrderCreationRequest;
import vn.liora.dto.request.OrderUpdateRequest;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.Order;

import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    // Map từ request khi tạo đơn hàng → entity Order
    @Mapping(target = "idOrder", ignore = true)
    @Mapping(target = "orderDate", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "orderStatus", ignore = true)
    @Mapping(target = "discount", ignore = true)
    Order toOrder(OrderCreationRequest request);
    @Mapping(target = "idAddress", source = "address.idAddress")
    @Mapping(target = "userId", source = "user.userId")



    OrderResponse toOrderResponse(Order order);

    // Map list entity → list response
    List<OrderResponse> toOrderResponseList(List<Order> orders);
    @Mapping(target = "paymentStatus", source = "paymentStatus")
    @Mapping(target = "orderStatus", source = "orderStatus")
    @Mapping(target = "discount", ignore = true)
    void updateOrder(@MappingTarget Order order, OrderUpdateRequest request);
}
