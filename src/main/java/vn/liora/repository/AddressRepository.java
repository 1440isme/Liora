package vn.liora.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.liora.entity.Address;
import vn.liora.entity.User;

import java.util.List;
import java.util.Optional;

@Repository

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUser(User user);
    Optional<Address> findByUserAndIsDefaultTrue(User user);

}

