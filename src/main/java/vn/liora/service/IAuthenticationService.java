package vn.liora.service;

import com.nimbusds.jose.JOSEException;
import vn.liora.dto.request.AuthenticationRequest;
import vn.liora.dto.request.IntrospectRequest;
import vn.liora.dto.request.LogoutRequest;
import vn.liora.dto.request.RefreshRequest;
import vn.liora.dto.response.AuthenticationResponse;
import vn.liora.dto.response.IntrospectResponse;

import java.text.ParseException;

public interface IAuthenticationService {
    IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException;

    AuthenticationResponse authenticate(AuthenticationRequest request);

    void logout(LogoutRequest request) throws ParseException, JOSEException;
    AuthenticationResponse refreshToken(RefreshRequest request) throws ParseException, JOSEException;
}
