package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.OrderProductCreationRequest;
import vn.liora.dto.request.OrderProductUpdateRequest;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.entity.*;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.OrderMapper;
import vn.liora.mapper.OrderProductMapper;
import vn.liora.repository.*;
import vn.liora.service.IOrderProductService;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderProductServiceImpl implements IOrderProductService {

    OrderProductRepository orderProductRepository;
    OrderProductMapper orderProductMapper;
    OrderRepository orderRepository;
    CartProductRepository cartProductRepository;
    CartRepository cartRepository;
    UserRepository userRepository;
    OrderMapper orderMapper;
    @Override
    @Transactional
    public OrderProductResponse updateOrderProduct(Long idOrderProduct, OrderProductUpdateRequest request) {
        OrderProduct orderProduct = orderProductRepository.findById(idOrderProduct)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_PRODUCT_NOT_FOUND));
        orderProductMapper.updateOrderProduct(orderProduct, request);

        orderProduct = orderProductRepository.save(orderProduct);

        return orderProductMapper.toOrderProductResponse(orderProduct);    }
}
