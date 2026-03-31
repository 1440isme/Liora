package vn.liora.service.stock;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.liora.entity.User;
import vn.liora.repository.CartProductRepository;
import vn.liora.service.EmailService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductStockNotificationServiceImpl implements ProductStockNotificationService {

    private final CartProductRepository cartProductRepository;
    private final EmailService emailService;

    @Override
    public List<User> findSubscribedUsers(Long productId) {
        return cartProductRepository.findDistinctSubscribedUsersByProductId(productId);
    }

    @Override
    public void notifySubscribers(ProductStockChangedEvent event) {
        List<User> subscribedUsers = findSubscribedUsers(event.productId());
        if (subscribedUsers.isEmpty()) {
            log.info("No subscribed users found for product {} stock event {}", event.productId(), event.eventType());
            return;
        }

        for (User user : subscribedUsers) {
            if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                continue;
            }

            try {
                String userName = ((user.getFirstname() != null ? user.getFirstname() : "") + " "
                        + (user.getLastname() != null ? user.getLastname() : "")).trim();
                if (userName.isBlank()) {
                    userName = user.getUsername() != null ? user.getUsername() : "Khách hàng";
                }

                emailService.sendProductStockNotificationEmail(
                        user.getEmail(),
                        userName,
                        event.productName(),
                        event.eventType(),
                        event.newStock());
            } catch (Exception e) {
                log.error("Failed to send stock notification to user {} for product {}: {}",
                        user.getUserId(), event.productId(), e.getMessage());
            }
        }
    }
}
