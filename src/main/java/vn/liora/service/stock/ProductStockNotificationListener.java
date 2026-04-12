package vn.liora.service.stock;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductStockNotificationListener implements ProductStockObserver {

    private final ProductStockNotificationService productStockNotificationService;

    @Override
    @Async
    public void update(ProductStockChangedEvent event) {
        if (event == null || event.productId() == null || event.eventType() == null) {
            return;
        }

        log.info("Processing stock notification event {} for product {} ({} -> {})",
                event.eventType(), event.productId(), event.oldStock(), event.newStock());
        productStockNotificationService.notifySubscribers(event);
    }
}
