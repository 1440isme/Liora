package vn.liora.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import vn.liora.dto.request.ApiResponse;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.request.UserUpdateRequest;
import vn.liora.dto.response.UserResponse;
import vn.liora.entity.User;
import vn.liora.service.impl.UserServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserServiceImpl userService;

    @PostMapping
    ApiResponse<User> createUser(@RequestBody @Valid UserCreationRequest request) {
        ApiResponse<User> apiResponse = new ApiResponse<>();
        apiResponse.setResult(userService.createUser(request));
        return apiResponse;
    }
    @GetMapping
    List<User> getAllUsers() {
        return userService.findAll();
    }
    @GetMapping("/{id}")
    UserResponse getUserById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @PutMapping("/{userId}")
    UserResponse updateUser(@PathVariable Long userId,@RequestBody UserUpdateRequest request){
        return userService.updateUser(userId,request);
    }

    @DeleteMapping("/{userId}")
    String deleteUser(@PathVariable Long userId){
        userService.deleteById(userId);
        return "Deleted user with id: " + userId;
    }
}
