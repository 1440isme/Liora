package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
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

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderProductServiceImpl implements IOrderProductService {

    OrderProductRepository orderProductRepository;
    OrderRepository orderRepository;
    ProductRepository productRepository;
    OrderProductMapper orderProductMapper;
    CartProductRepository cartProductRepository;
    CartRepository cartRepository;

    UserRepository userRepository;
    private final OrderMapper orderMapper;


    @Override
    public OrderResponse createOrder() {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByUsername(currentUser)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Cart cart = cartRepository.findByUser(user);
        // Lấy các sản phẩm trong giỏ hàng đã chọn
        List<CartProduct> selectedCartProducts = cartProductRepository.findByCartAndChooseTrue(cart);
        if (selectedCartProducts.isEmpty()) {
            throw new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND);
        }

        // Tạo đơn hàng mới
        Order order = new Order();
        order.setUser(user);
        order.setPaymentStatus(false);
        order.setOrderStatus(false);
        order = orderRepository.save(order);

        List<OrderProduct> orderProducts = selectedCartProducts.stream().map(cartProduct -> {
            OrderProduct orderProduct = new OrderProduct();
            orderProduct.setProduct(cartProduct.getProduct());
            orderProduct.setQuantity(cartProduct.getQuantity());
            return orderProductRepository.save(orderProduct);
        }).toList();

        // Xóa sản phẩm đã chọn khỏi giỏ hàng
        cartProductRepository.deleteAll(selectedCartProducts);

        // Trả về DTO
        return orderMapper.toOrderResponse(order);
    }

    @Override
    public OrderProductResponse getOrderProductById(Long idOrderProduct) {
        // Lấy OrderProduct theo id
        OrderProduct orderProduct = orderProductRepository.findById(idOrderProduct)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_PRODUCT_NOT_FOUND));

        // Kiểm tra quyền user
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!orderProduct.getOrder().getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Chuyển sang DTO
        return orderProductMapper.toOrderProductResponse(orderProduct);    }

    @Override
    public List<OrderProductResponse> getOrderProducts(Long idOrder) {
        // Lấy Order theo id
        Order order = orderRepository.findById(idOrder)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Kiểm tra quyền user
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!order.getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Lấy danh sách OrderProduct
        List<OrderProduct> orderProducts = orderProductRepository.findByOrder(order);

        // Chuyển sang DTO
        return orderProductMapper.toOrderProductResponseList(orderProducts);
    }

    @Override
    public OrderProductResponse updateOrderProduct(Long idOrderProduct, OrderProductUpdateRequest request) {
        // Lấy OrderProduct theo id
        OrderProduct orderProduct = orderProductRepository.findById(idOrderProduct)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_PRODUCT_NOT_FOUND));

        // Kiểm tra quyền user
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!orderProduct.getOrder().getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Cập nhật thông tin OrderProduct (ví dụ: quantity)
        orderProductMapper.updateOrderProduct(orderProduct, request);

        // Lưu lại database
        orderProduct = orderProductRepository.save(orderProduct);

        // Trả về DTO
        return orderProductMapper.toOrderProductResponse(orderProduct);    }
}
