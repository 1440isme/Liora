package vn.liora.payment.vnpay;

import lombok.extern.slf4j.Slf4j;
import vn.liora.entity.Order;
import vn.liora.entity.VnpayPayment;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.payment.PaymentProvider;
import vn.liora.payment.api.PaymentIpnProcessor;
import vn.liora.payment.api.PaymentIpnResult;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.VnpayPaymentRepository;
import vn.liora.util.VnpayUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
class VnpayIpnProcessor implements PaymentIpnProcessor {
    private final OrderRepository orderRepository;
    private final VnpayPaymentRepository vnpayPaymentRepository;
    private final String vnpHashSecret;

    VnpayIpnProcessor(
            OrderRepository orderRepository,
            VnpayPaymentRepository vnpayPaymentRepository,
            String vnpHashSecret
    ) {
        this.orderRepository = orderRepository;
        this.vnpayPaymentRepository = vnpayPaymentRepository;
        this.vnpHashSecret = vnpHashSecret;
    }

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.VNPAY;
    }

    @Override
    public PaymentIpnResult process(Map<String, ?> params) {
        @SuppressWarnings("unchecked")
        Map<String, String> p = (Map<String, String>) params;

        String receivedHash = p.get("vnp_SecureHash");
        Map<String, String> dataForSign = new HashMap<>(p);
        dataForSign.remove("vnp_SecureHash");
        dataForSign.remove("vnp_SecureHashType");
        String signData = VnpayUtil.buildQuery(dataForSign);
        String expectedHash = VnpayUtil.hmacSHA512(vnpHashSecret, signData);

        if (log.isInfoEnabled()) {
            try {
                String maskedSecret = vnpHashSecret == null
                        ? "null"
                        : ("***" + vnpHashSecret.substring(Math.max(0, vnpHashSecret.length() - 4)));
                log.info("[VNPAY IPN] SignData={}, LocalHash(secret={}):{}, ReceivedHash={}", signData, maskedSecret,
                        expectedHash, receivedHash);
            } catch (Exception ignore) {
            }
        }

        if (receivedHash == null || !receivedHash.equalsIgnoreCase(expectedHash)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String txnRef = p.get("vnp_TxnRef");
        String responseCode = p.get("vnp_ResponseCode");
        String transactionNo = p.get("vnp_TransactionNo");
        String bankCode = p.get("vnp_BankCode");
        String amountStr = p.get("vnp_Amount");

        VnpayPayment vnpayPayment = vnpayPaymentRepository.findByVnpTxnRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Order order = orderRepository.findById(vnpayPayment.getIdOrder())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Order {} already PAID, ignore IPN", order.getIdOrder());
            return new PaymentIpnResult(
                    PaymentProvider.VNPAY,
                    order.getIdOrder(),
                    PaymentIpnResult.PaymentIpnAction.IGNORED,
                    Optional.empty(),
                    Optional.empty()
            );
        }

        BigDecimal paidAmount = BigDecimal.ZERO;
        try {
            if (amountStr != null) {
                paidAmount = new BigDecimal(amountStr).divide(BigDecimal.valueOf(100));
            }
        } catch (NumberFormatException e) {
            log.warn("Invalid vnp_Amount: {}", amountStr);
        }

        if ("00".equals(responseCode)) {
            vnpayPayment.setVnpTransactionNo(transactionNo);
            vnpayPayment.setVnpBankCode(bankCode);
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setPaidAmount(paidAmount);
            vnpayPayment.setPaidAt(LocalDateTime.now());
            vnpayPayment.setFailureReason(null);
            vnpayPaymentRepository.save(vnpayPayment);

            return new PaymentIpnResult(
                    PaymentProvider.VNPAY,
                    order.getIdOrder(),
                    PaymentIpnResult.PaymentIpnAction.PAID,
                    Optional.of(paidAmount),
                    Optional.empty()
            );
        }

        if ("24".equals(responseCode)) {
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setFailureReason("VNPAY user cancelled (code=24)");
            vnpayPaymentRepository.save(vnpayPayment);

            return new PaymentIpnResult(
                    PaymentProvider.VNPAY,
                    order.getIdOrder(),
                    PaymentIpnResult.PaymentIpnAction.CANCELLED,
                    Optional.empty(),
                    Optional.of("VNPAY user cancelled (code=24)")
            );
        }

        vnpayPayment.setVnpResponseCode(responseCode);
        vnpayPayment.setFailureReason("VNPAY code=" + responseCode);
        vnpayPaymentRepository.save(vnpayPayment);

        return new PaymentIpnResult(
                PaymentProvider.VNPAY,
                order.getIdOrder(),
                PaymentIpnResult.PaymentIpnAction.FAILED,
                Optional.empty(),
                Optional.of("VNPAY code=" + responseCode)
        );
    }
}

