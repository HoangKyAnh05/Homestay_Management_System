package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.AiAgentConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiAgentConfigRepository extends JpaRepository<AiAgentConfig, Long> {
    Optional<AiAgentConfig> findFirstByIsActiveTrueOrderByIdAsc();
}
