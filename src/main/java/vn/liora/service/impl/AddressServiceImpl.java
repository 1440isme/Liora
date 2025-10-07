package vn.liora.service.impl;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.liora.dto.request.AddressCreateRequest;
import vn.liora.dto.request.AddressUpdateRequest;
import vn.liora.dto.response.AddressResponse;
import vn.liora.entity.Address;
import vn.liora.entity.User;
import vn.liora.exception.AppException;
import vn.liora.exception.ErrorCode;
import vn.liora.mapper.AddressMapper;
import vn.liora.repository.AddressRepository;
import vn.liora.repository.UserRepository;
import vn.liora.service.IAddressService;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AddressServiceImpl implements IAddressService {

    AddressRepository addressRepository;
    UserRepository userRepository;
    AddressMapper addressMapper;

    @Override
    @Transactional
    public AddressResponse createAddress(AddressCreateRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Address address = addressMapper.toAddress(request);
        address.setUser(user);

        // Nếu là địa chỉ đầu tiên hoặc được đặt làm mặc định
        List<Address> existingAddresses = addressRepository.findByUser(user);
        if (existingAddresses.isEmpty() || Boolean.TRUE.equals(request.getIsDefault())) {
            // Clear default từ các địa chỉ khác
            existingAddresses.forEach(addr -> addr.setIsDefault(false));
            addressRepository.saveAll(existingAddresses);
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return addressMapper.toAddressResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long idAddress, AddressUpdateRequest request) {
        Address address = addressRepository.findById(idAddress)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!address.getUser().getUserId().toString().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        addressMapper.updateAddress(address, request);

        // Nếu được đặt làm mặc định
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            List<Address> userAddresses = addressRepository.findByUser(address.getUser());
            userAddresses.forEach(addr -> {
                if (!addr.getIdAddress().equals(idAddress)) {
                    addr.setIsDefault(false);
                }
            });
            addressRepository.saveAll(userAddresses);
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return addressMapper.toAddressResponse(address);
    }

    @Override
    @Transactional
    public void deleteAddress(Long idAddress) {
        Address address = addressRepository.findById(idAddress)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!address.getUser().getUserId().toString().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Không cho phép xóa địa chỉ mặc định nếu còn địa chỉ khác
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            List<Address> userAddresses = addressRepository.findByUser(address.getUser());
            if (userAddresses.size() > 1) {
                throw new AppException(ErrorCode.CANNOT_DELETE_DEFAULT_ADDRESS);
            }
        }

        addressRepository.delete(address);
    }

    @Override
    public AddressResponse getAddressById(Long idAddress) {
        Address address = addressRepository.findById(idAddress)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!address.getUser().getUserId().toString().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return addressMapper.toAddressResponse(address);
    }

    @Override
    public List<AddressResponse> getMyAddresses() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Address> addresses = addressRepository.findByUser(user);
        return addressMapper.toAddressResponseList(addresses);
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Long idAddress) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(Long.parseLong(currentUserId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Address address = addressRepository.findById(idAddress)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));

        if (!address.getUser().getUserId().toString().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Clear default từ tất cả địa chỉ của user
        List<Address> userAddresses = addressRepository.findByUser(user);
        userAddresses.forEach(addr -> addr.setIsDefault(false));
        addressRepository.saveAll(userAddresses);

        // Set địa chỉ mới làm mặc định
        address.setIsDefault(true);
        address = addressRepository.save(address);
        return addressMapper.toAddressResponse(address);
    }

    @Override
    public AddressResponse getDefaultAddress() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Address defaultAddress = addressRepository.findByUserAndIsDefaultTrue(user)
                .orElseThrow(() -> new AppException(ErrorCode.DEFAULT_ADDRESS_NOT_FOUND));

        return addressMapper.toAddressResponse(defaultAddress);
    }
}
