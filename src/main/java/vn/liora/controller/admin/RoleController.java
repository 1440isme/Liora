package vn.liora.controller.admin;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.RoleRequest;
import vn.liora.dto.response.PermissionResponse;
import vn.liora.dto.response.RoleResponse;
import vn.liora.service.IRoleService;

import java.util.List;

@RestController
@RequestMapping("/admin/api/roles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleController {
    IRoleService roleService;

    @PostMapping
    ApiResponse<RoleResponse> create(@RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<RoleResponse>> getAll() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleService.getAll())
                .build();
    }

    @GetMapping("/{name}")
    ApiResponse<RoleResponse> getById(@PathVariable String name) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.getById(name))
                .build();
    }

    @PutMapping("/{name}")
    ApiResponse<RoleResponse> update(@PathVariable String name, @RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.update(name, request))
                .build();
    }

    @DeleteMapping("/{role}")
    ApiResponse<Void> delete(@PathVariable String role) {
        roleService.delete(role);
        return ApiResponse.<Void>builder().build();
    }
}
