package vn.liora.service;

import vn.liora.dto.request.PermissionRequest;
import vn.liora.dto.response.PermissionResponse;

import java.util.List;

public interface IPermissionService {
    PermissionResponse create(PermissionRequest request);

    List<PermissionResponse> getAll();

    PermissionResponse getById(String name);

    PermissionResponse update(String name, PermissionRequest request);

    void delete(String permission);
}
