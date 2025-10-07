package vn.liora.service;

import vn.liora.dto.request.AddressCreateRequest;
import vn.liora.dto.request.AddressUpdateRequest;
import vn.liora.dto.response.AddressResponse;

import java.util.List;

public interface IAddressService {
    AddressResponse createAddress(AddressCreateRequest request);
    AddressResponse updateAddress(Long idAddress, AddressUpdateRequest request);
    void deleteAddress(Long idAddress);
    AddressResponse getAddressById(Long idAddress);
    List<AddressResponse> getMyAddresses();
    AddressResponse setDefaultAddress(Long idAddress);
    AddressResponse getDefaultAddress();
}
