package com.homestayManagement.homestayManagement.repository;

import com.homestayManagement.homestayManagement.entity.MarketingOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarketingOptionRepository extends JpaRepository<MarketingOption, Long> {
    List<MarketingOption> findByOptionTypeAndActiveTrueOrderByIdAsc(String optionType);
    Optional<MarketingOption> findByOptionTypeAndLabelIgnoreCase(String optionType, String label);
}
