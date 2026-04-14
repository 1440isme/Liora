package vn.liora.payment.vnpay;

import lombok.extern.slf4j.Slf4j;
import vn.liora.entity.Order;
import vn.liora.entity.VnpayPayment;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.payment.api.PaymentUrlCreator;
import vn.liora.repository.VnpayPaymentRepository;
import vn.liora.util.VnpayUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

@Slf4j
class VnpayUrlCreator implements PaymentUrlCreator {
    private final VnpayPaymentRepository vnpayPaymentRepository;
    private final String vnpTmnCode;
    private final String vnpHashSecret;
    private final String vnpPayUrl;
    private final String vnpReturnUrl;
    private final String vnpIpnUrl;
    private final String vnpVersion;
    private final String vnpCommand;
    private final String vnpCurrCode;
    private final String vnpLocale;
    private final boolean vnpSendIpnParam;

    VnpayUrlCreator(
            VnpayPaymentRepository vnpayPaymentRepository,
            String vnpTmnCode,
            String vnpHashSecret,
            String vnpPayUrl,
            String vnpReturnUrl,
            String vnpIpnUrl,
            String vnpVersion,
            String vnpCommand,
            String vnpCurrCode,
            String vnpLocale,
            boolean vnpSendIpnParam
    ) {
        this.vnpayPaymentRepository = vnpayPaymentRepository;
        this.vnpTmnCode = vnpTmnCode;
        this.vnpHashSecret = vnpHashSecret;
        this.vnpPayUrl = vnpPayUrl;
        this.vnpReturnUrl = vnpReturnUrl;
        this.vnpIpnUrl = vnpIpnUrl;
        this.vnpVersion = vnpVersion;
        this.vnpCommand = vnpCommand;
        this.vnpCurrCode = vnpCurrCode;
        this.vnpLocale = vnpLocale;
        this.vnpSendIpnParam = vnpSendIpnParam;
    }

    @Override
    public String createPaymentUrl(Order order, String clientIp) {
        if (order == null || order.getIdOrder() == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        Map<String, String> fields = new TreeMap<>();
        fields.put("vnp_Version", vnpVersion);
        fields.put("vnp_Command", vnpCommand);
        fields.put("vnp_TmnCode", vnpTmnCode);

        BigDecimal amount = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
        String vnpAmount = amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, java.math.RoundingMode.DOWN)
                .toPlainString();
        fields.put("vnp_Amount", vnpAmount);
        fields.put("vnp_CurrCode", vnpCurrCode);
        fields.put("vnp_TxnRef", generateOrReuseTxnRef(order));
        fields.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getIdOrder());
        fields.put("vnp_OrderType", "other");
        fields.put("vnp_Locale", (vnpLocale == null || vnpLocale.isBlank()) ? "vn" : vnpLocale);
        fields.put("vnp_ReturnUrl", vnpReturnUrl);
        if (vnpSendIpnParam && vnpIpnUrl != null && !vnpIpnUrl.isBlank()) {
            fields.put("vnp_IpnUrl", vnpIpnUrl);
        }
        String ip = (clientIp == null || clientIp.isBlank()) ? "127.0.0.1" : clientIp;
        fields.put("vnp_IpAddr", ip);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        fields.put("vnp_CreateDate", LocalDateTime.now().format(formatter));
        fields.put("vnp_ExpireDate", LocalDateTime.now().plusMinutes(15).format(formatter));

        StringBuilder hashData = new StringBuilder();
        StringBuilder querySb = new StringBuilder();
        for (Map.Entry<String, String> e : fields.entrySet()) {
            String k = e.getKey();
            String v = e.getValue();
            if (v == null || v.isEmpty()) {
                continue;
            }
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

        if (log.isInfoEnabled()) {
            try {
                String maskedSecret = vnpHashSecret == null
                        ? "null"
                        : ("***" + vnpHashSecret.substring(Math.max(0, vnpHashSecret.length() - 4)));
                log.info("[VNPAY] TMN={}, Amount={}, SignData={}, Hash(secret={}):{}", vnpTmnCode, vnpAmount, signData,
                        maskedSecret, secureHash);
                log.info("[VNPAY] PaymentURL={}", paymentUrl);
            } catch (Exception ignore) {
            }
        }

        return paymentUrl;
    }

    private String generateOrReuseTxnRef(Order order) {
        VnpayPayment existingPayment = vnpayPaymentRepository.findByIdOrder(order.getIdOrder()).orElse(null);
        if (existingPayment != null) {
            return existingPayment.getVnpTxnRef();
        }

        String txnRef = String.format("%s%06d",
                DateTimeFormatter.ofPattern("yyMMdd").format(LocalDateTime.now()),
                order.getIdOrder());

        VnpayPayment vnpayPayment = VnpayPayment.builder()
                .idOrder(order.getIdOrder())
                .vnpTxnRef(txnRef)
                .vnpAmount(order.getTotal())
                .build();

        vnpayPaymentRepository.save(vnpayPayment);
        return txnRef;
    }
}

