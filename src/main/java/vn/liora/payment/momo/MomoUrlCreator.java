package vn.liora.payment.momo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import vn.liora.entity.MomoPayment;
import vn.liora.entity.Order;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.payment.api.PaymentUrlCreator;
import vn.liora.repository.MomoPaymentRepository;
import vn.liora.util.MomoUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
class MomoUrlCreator implements PaymentUrlCreator {
    private final MomoPaymentRepository momoPaymentRepository;
    private final RestTemplate restTemplate;
    private final String momoPartnerCode;
    private final String momoAccessKey;
    private final String momoSecretKey;
    private final String momoApiEndpoint;
    private final String momoReturnUrl;
    private final String momoIpnUrl;
    private final String momoRequestType;

    MomoUrlCreator(
            MomoPaymentRepository momoPaymentRepository,
            RestTemplate restTemplate,
            String momoPartnerCode,
            String momoAccessKey,
            String momoSecretKey,
            String momoApiEndpoint,
            String momoReturnUrl,
            String momoIpnUrl,
            String momoRequestType
    ) {
        this.momoPaymentRepository = momoPaymentRepository;
        this.restTemplate = restTemplate;
        this.momoPartnerCode = momoPartnerCode;
        this.momoAccessKey = momoAccessKey;
        this.momoSecretKey = momoSecretKey;
        this.momoApiEndpoint = momoApiEndpoint;
        this.momoReturnUrl = momoReturnUrl;
        this.momoIpnUrl = momoIpnUrl;
        this.momoRequestType = momoRequestType;
    }

    @Override
    public String createPaymentUrl(Order order, String clientIp) {
        if (order == null || order.getIdOrder() == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        try {
            String orderId = MomoUtil.generateOrderId(order.getIdOrder());
            String requestId = MomoUtil.generateRequestId();

            if (momoPaymentRepository.existsByOrderId(orderId)) {
                orderId = MomoUtil.generateOrderId(order.getIdOrder());
            }

            BigDecimal amount = order.getTotal() == null ? BigDecimal.ZERO : order.getTotal();
            String orderInfo = "Thanh toan don hang #" + order.getIdOrder();
            String extraData = "";

            String signature = MomoUtil.createSignature(
                    momoAccessKey, momoSecretKey, momoPartnerCode,
                    orderId, requestId, amount, orderInfo, momoReturnUrl, momoIpnUrl,
                    momoRequestType, extraData);

            MomoPayment momoPayment = momoPaymentRepository.findByOrderId(orderId).orElse(null);
            if (momoPayment == null) {
                momoPayment = MomoPayment.builder()
                        .idOrder(order.getIdOrder())
                        .partnerCode(momoPartnerCode)
                        .orderId(orderId)
                        .requestId(requestId)
                        .amount(amount)
                        .orderInfo(orderInfo)
                        .redirectUrl(momoReturnUrl)
                        .ipnUrl(momoIpnUrl)
                        .extraData(extraData)
                        .requestType(momoRequestType)
                        .signature(signature)
                        .build();
            } else {
                momoPayment.setRequestId(requestId);
                momoPayment.setAmount(amount);
                momoPayment.setOrderInfo(orderInfo);
                momoPayment.setSignature(signature);
                momoPayment.setUpdatedAt(LocalDateTime.now());
            }

            momoPaymentRepository.save(momoPayment);

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("partnerCode", momoPartnerCode);
            requestBody.put("accessKey", momoAccessKey);
            requestBody.put("requestId", requestId);
            requestBody.put("amount", String.valueOf(amount.longValue()));
            requestBody.put("orderId", orderId);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("returnUrl", momoReturnUrl);
            requestBody.put("notifyUrl", momoIpnUrl);
            requestBody.put("extraData", extraData);
            requestBody.put("requestType", momoRequestType);
            requestBody.put("signature", signature);

            String response = callMomoApi(momoApiEndpoint, requestBody);
            Map<String, Object> responseData = MomoUtil.parseJson(response);

            Integer errorCode = (Integer) responseData.get("errorCode");
            String message = (String) responseData.get("message");
            String payUrl = (String) responseData.get("payUrl");

            if (errorCode != null && errorCode == 0 && payUrl != null) {
                momoPayment.setResultCode(errorCode);
                momoPayment.setMessage(message);
                momoPayment.setPayUrl(payUrl);
                momoPaymentRepository.save(momoPayment);
                return payUrl;
            }

            log.error("MOMO API error: errorCode={}, message={}", errorCode, message);
            throw new AppException(ErrorCode.PAYMENT_CREATION_FAILED);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating MOMO payment URL for Order {}", order.getIdOrder(), e);
            throw new AppException(ErrorCode.PAYMENT_CREATION_FAILED);
        }
    }

    private String callMomoApi(String endpoint, Map<String, Object> requestBody) {
        try {
            String jsonBody = MomoUtil.toJson(requestBody);
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json; charset=UTF-8");

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("Error calling MOMO API", e);
            throw new RuntimeException("Error calling MOMO API", e);
        }
    }
}

