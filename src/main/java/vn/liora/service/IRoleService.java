package vn.liora.service;

import vn.liora.dto.request.RoleRequest;
import vn.liora.dto.response.RoleResponse;

import java.util.List;

public interface IRoleService {
    RoleResponse create(RoleRequest request);
    List<RoleResponse> getAll();
    void delete(String role);
}
