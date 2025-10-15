package vn.liora.controller;

import java.net.URI;
import javax.net.ssl.*;
import java.security.cert.X509Certificate;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    private final RestTemplate restTemplate;

    public LocationController() {
        try {
            // Tạo TrustManager bỏ qua tất cả chứng chỉ SSL
            TrustManager[] trustAllCerts = new TrustManager[] {
                    new X509TrustManager() {
                        public X509Certificate[] getAcceptedIssuers() {
                            return null;
                        }

                        public void checkClientTrusted(X509Certificate[] certs, String authType) {
                        }

                        public void checkServerTrusted(X509Certificate[] certs, String authType) {
                        }
                    }
            };

            // Cài đặt SSLContext
            SSLContext sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());

            // Tạo HostnameVerifier bỏ qua kiểm tra hostname
            HostnameVerifier allHostsValid = (hostname, session) -> true;
            HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);

            // Tạo RestTemplate với SimpleClientHttpRequestFactory
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(5000);
            factory.setReadTimeout(8000);
            this.restTemplate = new RestTemplate(factory);
        } catch (Exception e) {
            throw new RuntimeException("Không thể tạo RestTemplate với SSL disabled", e);
        }
    }

    @GetMapping(value = "/provider", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getProvinces() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7");
            headers.set(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36");

            ResponseEntity<String> upstream = restTemplate.exchange(
                    URI.create("https://wavebear.com.vn/api/location-viet-nam/provider"),
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class);

            String body = upstream.getBody();
            if (body != null && body.trim().startsWith("[")) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body);
            } else {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("[]");
            }
        } catch (Exception ex) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("[]");
        }
    }

    @GetMapping(value = "/ward/{provinceCode}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getWards(@PathVariable("provinceCode") String provinceCode) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
            headers.set(HttpHeaders.ACCEPT_LANGUAGE, "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7");
            headers.set(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36");

            ResponseEntity<String> upstream = restTemplate.exchange(
                    URI.create("https://wavebear.com.vn/api/location-viet-nam/ward/" + provinceCode),
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class);

            String body = upstream.getBody();
            if (body != null && body.trim().startsWith("[")) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body);
            } else {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("[]");
            }
        } catch (Exception ex) {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("[]");
        }
    }
}
