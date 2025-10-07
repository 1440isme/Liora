package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.CartProductCreationRequest;
import vn.liora.dto.request.CartProductUpdateRequest;
import vn.liora.dto.response.CartProductResponse;
import vn.liora.entity.Cart;
import vn.liora.entity.CartProduct;
import vn.liora.entity.Product;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.CartProductMapper;
import vn.liora.repository.CartProductRepository;
import vn.liora.repository.CartRepository;
import vn.liora.repository.ProductRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.ICartProductService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CartProductServiceImpl implements ICartProductService {

    CartProductRepository cartProductRepository;
    CartRepository cartRepository;
    ProductRepository productRepository;
    UserRepository userRepository;
    CartProductMapper cartProductMapper;

    @Override
    public CartProductResponse addProductToCart(CartProductCreationRequest request) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();



        User user = userRepository.findByUsername(currentUser)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Cart cart = cartRepository.findByUser(user);

        // Lấy sản phẩm
        Product product = productRepository.findById(request.getIdProduct())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Kiểm tra quyền user (thường không cần nếu lấy cart theo user)
        if (!cart.getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CartProduct cartProduct = cartProductMapper.toCartProduct(request);
        cartProduct.setCart(cart);
        cartProduct.setProduct(product);

        // Lưu vào database
        cartProduct = cartProductRepository.save(cartProduct);

        // Trả về DTO
        return cartProductMapper.toCartProductResponse(cartProduct);
    }

    @Override
    public CartProductResponse updateCartProduct(Long idCartProduct, CartProductUpdateRequest request) {
        CartProduct cartProduct = cartProductRepository.findById(idCartProduct)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!cartProduct.getCart().getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        cartProductMapper.updateCartProduct(cartProduct, request);
        cartProduct = cartProductRepository.save(cartProduct);
        return cartProductMapper.toCartProductResponse(cartProduct);
    }

    @Override
    public void removeProductFromCart(Long idCartProduct) {
        CartProduct cartProduct = cartProductRepository.findById(idCartProduct)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!cartProduct.getCart().getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        cartProductRepository.delete(cartProduct);
    }

    @Override
    public CartProductResponse getCartProductById(Long idCartProduct) {
        CartProduct cartProduct = cartProductRepository.findById(idCartProduct)
                .orElseThrow(() -> new AppException(ErrorCode.CART_PRODUCT_NOT_FOUND));

        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!cartProduct.getCart().getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return cartProductMapper.toCartProductResponse(cartProduct);
    }

    @Override
    public List<CartProductResponse> getCartProducts(Long idCart) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        String currentUser= SecurityContextHolder.getContext().getAuthentication().getName();
        if (!cart.getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<CartProduct> cartProducts = cartProductRepository.findByCart(cart);
        return cartProductMapper.toCartProductResponseList(cartProducts);
    }

    @Override
    public void clearCartProducts(Long idCart) {
        Cart cart = cartRepository.findById(idCart)
                .orElseThrow(() -> new AppException(ErrorCode.CART_NOT_FOUND));

        String currentUser= SecurityContextHolder.getContext().getAuthentication().getName();
        if (!cart.getUser().getUsername().equals(currentUser)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }


        List<CartProduct> cartProducts = cartProductRepository.findByCart(cart);
        cartProductRepository.deleteAll(cartProducts);
    }
}
