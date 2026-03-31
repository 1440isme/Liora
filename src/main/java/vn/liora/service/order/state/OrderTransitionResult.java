package vn.liora.service.order.state;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderTransitionResult {
    private final boolean rollbackDiscount;
    private final boolean restoreStock;
    private final boolean increaseSoldCount;
    private final boolean decreaseSoldCount;
    private final boolean createShippingOrder;
    private final boolean sendCancellationEmail;

    public static OrderTransitionResult none() {
        return OrderTransitionResult.builder().build();
    }

    public boolean shouldRollbackDiscount() {
        return rollbackDiscount;
    }

    public boolean shouldRestoreStock() {
        return restoreStock;
    }

    public boolean shouldIncreaseSoldCount() {
        return increaseSoldCount;
    }

    public boolean shouldDecreaseSoldCount() {
        return decreaseSoldCount;
    }

    public boolean shouldCreateShippingOrder() {
        return createShippingOrder;
    }

    public boolean shouldSendCancellationEmail() {
        return sendCancellationEmail;
    }
}
