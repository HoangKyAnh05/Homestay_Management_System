package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.UserDetail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDetailRepository extends JpaRepository<UserDetail, Long> {
}
