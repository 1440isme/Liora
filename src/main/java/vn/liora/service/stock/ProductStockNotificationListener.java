package vn.liora.service.stock;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductStockNotificationListener {

    private final ProductStockNotificationService productStockNotificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onProductStockChanged(ProductStockChangedEvent event) {
        if (event == null || event.productId() == null || event.eventType() == null) {
            return;
        }

        log.info("Processing stock notification event {} for product {} ({} -> {})",
                event.eventType(), event.productId(), event.oldStock(), event.newStock());
        productStockNotificationService.notifySubscribers(event);
    }
}
