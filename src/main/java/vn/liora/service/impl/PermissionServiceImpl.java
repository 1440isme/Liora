package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import vn.liora.dto.request.PermissionRequest;
import vn.liora.dto.response.PermissionResponse;
import vn.liora.entity.Permission;
import vn.liora.mapper.PermissionMapper;
import vn.liora.repository.PermissionRepository;
import vn.liora.service.IPermissionService;

import java.util.List;


@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionServiceImpl implements IPermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;
    @Override
    public PermissionResponse create(PermissionRequest request) {
        Permission permission = permissionMapper.toPermission(request);
        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    @Override
    public List<PermissionResponse> getAll() {
        var permission = permissionRepository.findAll();
        return permission.stream().map(permissionMapper::toPermissionResponse).toList();
    }

    @Override
    public void delete(String permission) {
        permissionRepository.deleteById(permission);
    }
}
