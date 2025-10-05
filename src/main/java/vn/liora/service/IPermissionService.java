package vn.liora.service;

import vn.liora.dto.request.PermissionRequest;
import vn.liora.dto.response.PermissionResponse;

import java.util.List;

public interface IPermissionService {
    PermissionResponse create(PermissionRequest request);
    List<PermissionResponse> getAll();
    void delete(String permission);
}
