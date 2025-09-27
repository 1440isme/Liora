package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.request.UserUpdateRequest;
import vn.liora.dto.response.UserResponse;
import vn.liora.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);
    UserResponse toUserResponse(User user);
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
