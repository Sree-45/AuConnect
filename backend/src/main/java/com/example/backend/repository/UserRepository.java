package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.model.Users;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<Users, Long>
{
    Users findByUsernameAndPassword(String username, String password);
    Users findByUsername(String username);
    Users findByEmail(String email);
    List<Users> findByUsernameContainingIgnoreCase(String term);
}