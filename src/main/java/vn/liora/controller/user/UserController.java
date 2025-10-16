package vn.liora.controller.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.response.UserResponse;
import vn.liora.dto.response.OrderResponse;
import vn.liora.dto.response.OrderProductResponse;
import vn.liora.dto.response.PaginatedResponse;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.UserRepository;
import vn.liora.mapper.UserMapper;
import vn.liora.service.IOrderService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final IOrderService orderService;

    @GetMapping("/myInfo")
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            UserResponse userResponse = userMapper.toUserResponse(user);

            ApiResponse<UserResponse> response = new ApiResponse<>();
            response.setResult(userResponse);
            response.setMessage("Lấy thông tin người dùng thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @GetMapping("/myOrders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            List<OrderResponse> orders = orderService.getMyOrders(user.getUserId());

            ApiResponse<List<OrderResponse>> response = new ApiResponse<>();
            response.setResult(orders);
            response.setMessage("Lấy lịch sử đơn hàng thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @GetMapping("/myOrdersWithProducts")
    public ResponseEntity<ApiResponse<PaginatedResponse<Object>>> getMyOrdersWithProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            List<OrderResponse> orders = orderService.getMyOrdersPaginated(user.getUserId(), page, size);
            
            // Tạo response với thông tin sản phẩm đầu tiên
            List<Object> ordersWithProducts = orders.stream().map(order -> {
                try {
                    List<OrderProductResponse> products = orderService.getProductsByOrderId(order.getIdOrder());
                    OrderProductResponse firstProduct = products.isEmpty() ? null : products.get(0);
                    
                    class OrderWithProduct {
                        @SuppressWarnings("unused")
                        public final OrderResponse order;
                        @SuppressWarnings("unused")
                        public final OrderProductResponse firstProduct;
                        @SuppressWarnings("unused")
                        public final Integer totalProducts;
                        
                        public OrderWithProduct(OrderResponse order, OrderProductResponse firstProduct, Integer totalProducts) {
                            this.order = order;
                            this.firstProduct = firstProduct;
                            this.totalProducts = totalProducts;
                        }
                    }
                    
                    return new OrderWithProduct(order, firstProduct, products.size());
                } catch (Exception e) {
                    // Nếu không lấy được sản phẩm, trả về order không có sản phẩm
                    class OrderWithProduct {
                        @SuppressWarnings("unused")
                        public final OrderResponse order;
                        @SuppressWarnings("unused")
                        public final OrderProductResponse firstProduct = null;
                        @SuppressWarnings("unused")
                        public final Integer totalProducts = 0;
                        
                        public OrderWithProduct(OrderResponse order, OrderProductResponse firstProduct, Integer totalProducts) {
                            this.order = order;
                        }
                    }
                    return new OrderWithProduct(order, null, 0);
                }
            }).collect(java.util.stream.Collectors.toList());

            // Tính toán thông tin phân trang
            long totalElements = orderService.countMyOrders(user.getUserId());
            int totalPages = (int) Math.ceil((double) totalElements / size);
            
            PaginatedResponse<Object> paginatedResponse = PaginatedResponse.<Object>builder()
                    .content(ordersWithProducts)
                    .currentPage(page)
                    .pageSize(size)
                    .totalElements(totalElements)
                    .totalPages(totalPages)
                    .hasNext(page < totalPages - 1)
                    .hasPrevious(page > 0)
                    .isFirst(page == 0)
                    .isLast(page >= totalPages - 1)
                    .build();

            ApiResponse<PaginatedResponse<Object>> response = new ApiResponse<>();
            response.setResult(paginatedResponse);
            response.setMessage("Lấy lịch sử đơn hàng với sản phẩm thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @GetMapping("/orderStats")
    public ResponseEntity<ApiResponse<Object>> getOrderStats() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

            Long totalOrders = orderService.countByUser(user);
            BigDecimal totalSpent = orderService.getTotalRevenueByUser(user);

            // Create stats object
            class OrderStats {
                @SuppressWarnings("unused")
                public final Long totalOrders;
                @SuppressWarnings("unused")
                public final BigDecimal totalSpent;
                
                public OrderStats(Long totalOrders, BigDecimal totalSpent) {
                    this.totalOrders = totalOrders;
                    this.totalSpent = totalSpent;
                }
            }
            
            OrderStats stats = new OrderStats(totalOrders, totalSpent);

            ApiResponse<Object> response = new ApiResponse<>();
            response.setResult(stats);
            response.setMessage("Lấy thống kê đơn hàng thành công");

            return ResponseEntity.ok(response);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}