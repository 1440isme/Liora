package vn.liora.service;

import com.nimbusds.jose.JOSEException;
import vn.liora.dto.request.AuthenticationRequest;
import vn.liora.dto.request.IntrospectRequest;
import vn.liora.dto.response.AuthenticationResponse;
import vn.liora.dto.response.IntrospectResponse;

import java.text.ParseException;

public interface AuthenticationService {
    IntrospectResponse introspecct(IntrospectRequest request) throws JOSEException, ParseException;

    AuthenticationResponse authenticate(AuthenticationRequest request);
}
