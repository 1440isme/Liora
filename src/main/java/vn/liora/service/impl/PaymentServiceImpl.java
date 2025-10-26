package vn.liora.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.entity.Order;
import vn.liora.entity.VnpayPayment;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.repository.OrderRepository;
import vn.liora.repository.VnpayPaymentRepository;
import vn.liora.service.PaymentService;
import vn.liora.service.IGhnShippingService;
import vn.liora.util.VnpayUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = false)
public class PaymentServiceImpl implements PaymentService {

    final OrderRepository orderRepository;
    final VnpayPaymentRepository vnpayPaymentRepository;
    final IGhnShippingService ghnShippingService;

    @Value("${vnpay.tmnCode}")
    String vnpTmnCode;
    @Value("${vnpay.hashSecret}")
    String vnpHashSecret;
    @Value("${vnpay.payUrl}")
    String vnpPayUrl;
    @Value("${vnpay.returnUrl}")
    String vnpReturnUrl;
    @Value("${vnpay.ipnUrl}")
    String vnpIpnUrl;
    @Value("${vnpay.version}")
    String vnpVersion;
    @Value("${vnpay.command}")
    String vnpCommand;
    @Value("${vnpay.currCode}")
    String vnpCurrCode;
    @Value("${vnpay.locale:vn}")
    String vnpLocale;

    @Value("${vnpay.sendIpnParam:false}")
    boolean vnpSendIpnParam;

    @Override
    public String createVnpayPaymentUrl(Order order, String clientIp) {
        if (order == null || order.getIdOrder() == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        // Build params theo đúng sample VNPAY (TreeMap + URLEncoder US_ASCII)
        Map<String, String> fields = new TreeMap<>();
        fields.put("vnp_Version", vnpVersion);
        fields.put("vnp_Command", vnpCommand);
        fields.put("vnp_TmnCode", vnpTmnCode);
        // amount = VND x 100 (integer)
        BigDecimal amount = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
        String vnpAmount = amount.multiply(BigDecimal.valueOf(100)).setScale(0, java.math.RoundingMode.DOWN)
                .toPlainString();
        fields.put("vnp_Amount", vnpAmount);
        fields.put("vnp_CurrCode", vnpCurrCode);
        fields.put("vnp_TxnRef", generateOrReuseTxnRef(order));
        fields.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getIdOrder());
        fields.put("vnp_OrderType", "other");
        fields.put("vnp_Locale", (vnpLocale == null || vnpLocale.isBlank()) ? "vn" : vnpLocale);
        fields.put("vnp_ReturnUrl", vnpReturnUrl);
        // Chỉ gửi tham số vnp_IpnUrl khi được bật qua cấu hình để tránh lỗi không tương
        // thích cấu hình merchant
        if (vnpSendIpnParam && vnpIpnUrl != null && !vnpIpnUrl.isBlank()) {
            fields.put("vnp_IpnUrl", vnpIpnUrl);
        }
        String ip = (clientIp == null || clientIp.isBlank()) ? "127.0.0.1" : clientIp;
        fields.put("vnp_IpAddr", ip);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String create = LocalDateTime.now().format(formatter);
        fields.put("vnp_CreateDate", create);
        String expire = LocalDateTime.now().plusMinutes(15).format(formatter);
        fields.put("vnp_ExpireDate", expire);

        // Dựng hashData và query giống hệt sample JSP
        StringBuilder hashData = new StringBuilder();
        StringBuilder querySb = new StringBuilder();
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String k = e.getKey();
            String v = e.getValue();
            if (v == null || v.isEmpty())
                continue;
            if (hashData.length() > 0) {
                hashData.append('&');
                querySb.append('&');
            }
            hashData.append(k).append('=')
                    .append(java.net.URLEncoder.encode(v, java.nio.charset.StandardCharsets.US_ASCII));
            querySb.append(java.net.URLEncoder.encode(k, java.nio.charset.StandardCharsets.US_ASCII))
                    .append('=')
                    .append(java.net.URLEncoder.encode(v, java.nio.charset.StandardCharsets.US_ASCII));
        }
        String signData = hashData.toString();
        String query = querySb.toString();
        String secureHash = VnpayUtil.hmacSHA512(vnpHashSecret, signData);
        String paymentUrl = vnpPayUrl + "?" + query + "&vnp_SecureHash=" + secureHash;

        // Debug logs (mask secret)
        try {
            String maskedSecret = vnpHashSecret == null ? "null"
                    : ("***" + vnpHashSecret.substring(Math.max(0, vnpHashSecret.length() - 4)));
            log.info("[VNPAY] TMN={}, Amount={}, SignData={}, Hash(secret={}):{}", vnpTmnCode, vnpAmount, signData,
                    maskedSecret, secureHash);
            log.info("[VNPAY] PaymentURL={}", paymentUrl);
        } catch (Exception ignore) {
        }

        return paymentUrl;
    }

    private String generateOrReuseTxnRef(Order order) {
        // Check if VnpayPayment already exists for this order
        VnpayPayment existingPayment = vnpayPaymentRepository.findByIdOrder(order.getIdOrder()).orElse(null);
        if (existingPayment != null) {
            return existingPayment.getVnpTxnRef();
        }

        String txnRef = String.format("%s%06d", DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now()),
                order.getIdOrder());

        // Create new VnpayPayment entity
        VnpayPayment vnpayPayment = VnpayPayment.builder()
                .idOrder(order.getIdOrder())
                .vnpTxnRef(txnRef)
                .vnpAmount(order.getTotal())
                .build();

        vnpayPaymentRepository.save(vnpayPayment);
        return txnRef;
    }

    @Override
    @Transactional
    public void handleVnpayIpn(Map<String, String> params) {
        // Extract and verify signature
        String receivedHash = params.get("vnp_SecureHash");
        Map<String, String> dataForSign = new HashMap<>(params);
        dataForSign.remove("vnp_SecureHash");
        dataForSign.remove("vnp_SecureHashType");
        String signData = VnpayUtil.buildQuery(dataForSign);
        String expectedHash = VnpayUtil.hmacSHA512(vnpHashSecret, signData);
        if (log.isInfoEnabled()) {
            try {
                String maskedSecret = vnpHashSecret == null ? "null"
                        : ("***" + vnpHashSecret.substring(Math.max(0, vnpHashSecret.length() - 4)));
                log.info("[VNPAY IPN] SignData={}, LocalHash(secret={}):{}, ReceivedHash={}", signData, maskedSecret,
                        expectedHash, receivedHash);
            } catch (Exception ignore) {
            }
        }
        if (receivedHash == null || !receivedHash.equalsIgnoreCase(expectedHash)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");
        String bankCode = params.get("vnp_BankCode");
        String amountStr = params.get("vnp_Amount");

        VnpayPayment vnpayPayment = vnpayPaymentRepository.findByVnpTxnRef(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        Order order = orderRepository.findById(vnpayPayment.getIdOrder())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        // Idempotent: if already PAID, ignore
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            log.info("Order {} already PAID, ignore IPN", order.getIdOrder());
            return;
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
            order.setPaymentStatus("PAID");
            order.setOrderStatus("CONFIRMED");

            // Auto create GHN shipping order sau khi thanh toán thành công
            try {
                // Đảm bảo Order đã có đủ thông tin địa chỉ (district/ward)
                // Nếu thiếu thì bỏ qua tạo GHN để không chặn IPN
                if (order.getDistrictId() != null && order.getWardCode() != null) {
                    ghnShippingService.createShippingOrder(order);
                    log.info("Created GHN shipping order for Order {}", order.getIdOrder());
                } else {
                    log.warn("Skip GHN create: Order missing district/ward.");
                }
            } catch (Exception ex) {
                log.error("Failed to auto create GHN order after payment: {}", ex.getMessage());
            }

            // Update VnpayPayment entity
            vnpayPayment.setVnpTransactionNo(transactionNo);
            vnpayPayment.setVnpBankCode(bankCode);
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setPaidAmount(paidAmount);
            vnpayPayment.setPaidAt(LocalDateTime.now());
            vnpayPayment.setFailureReason(null);
        } else if ("24".equals(responseCode)) { // 24: User cancel payment at VNPAY
            order.setPaymentStatus("CANCELLED");
            // Giữ orderStatus ở trạng thái hiện tại (thường là PENDING)

            // Update VnpayPayment entity
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setFailureReason("VNPAY user cancelled (code=24)");
        } else {
            order.setPaymentStatus("FAILED");

            // Update VnpayPayment entity
            vnpayPayment.setVnpResponseCode(responseCode);
            vnpayPayment.setFailureReason("VNPAY code=" + responseCode);
        }

        orderRepository.save(order);
        vnpayPaymentRepository.save(vnpayPayment);
    }
}
