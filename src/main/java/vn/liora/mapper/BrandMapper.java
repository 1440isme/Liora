package vn.liora.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import vn.liora.dto.request.BrandCreationRequest;
import vn.liora.dto.request.BrandUpdateRequest;
import vn.liora.dto.response.BrandResponse;
import vn.liora.entity.Brand;

@Mapper(componentModel = "spring")
public interface BrandMapper {
    Brand toBrand(BrandCreationRequest request); // chuyển dữ liệu client -> entity lưu vào db
    BrandResponse toBrandResponse(Brand brand); // chuyển entity -> response trả client
    void updateBrand(@MappingTarget Brand brand, BrandUpdateRequest request); // update trực tiếp vào entity
}
