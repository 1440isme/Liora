package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.liora.dto.request.UserCreationRequest;
import vn.liora.dto.request.UserUpdateRequest;
import vn.liora.dto.response.UserResponse;
import vn.liora.entity.User;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
    User toUser(UserCreationRequest request);

    UserResponse toUserResponse(User user);

    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "cart", ignore = true)
    @Mapping(target = "orders", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
