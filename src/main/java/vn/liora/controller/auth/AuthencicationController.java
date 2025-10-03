package vn.liora.controller.auth;

import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.AuthenticationRequest;
import vn.liora.dto.request.IntrospectRequest;
import vn.liora.dto.response.AuthenticationResponse;
import vn.liora.dto.response.IntrospectResponse;
import vn.liora.service.AuthenticationService;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class AuthencicationController {

    AuthenticationService authenticationService;

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
       var result = authenticationService.authenticate(request);
       return ApiResponse.<AuthenticationResponse>builder()
               .result(result)
               .build();
    }
    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        var result = authenticationService.introspecct(request);
        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();
    }
}
