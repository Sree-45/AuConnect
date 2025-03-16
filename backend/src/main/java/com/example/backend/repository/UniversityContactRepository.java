package com.example.backend.repository;

import com.example.backend.model.UniversityContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UniversityContactRepository extends JpaRepository<UniversityContact, Long> {
    UniversityContact findByUniversityUsername(String universityUsername);
}
