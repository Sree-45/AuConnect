package com.example.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.model.Connection;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    
    // Find connection between two users (in either direction)
    @Query("SELECT c FROM Connection c WHERE " +
           "(c.fromUsername = ?1 AND c.toUsername = ?2) OR " +
           "(c.fromUsername = ?2 AND c.toUsername = ?1)")
    Optional<Connection> findConnectionBetweenUsers(String username1, String username2);
    
    // Find connection specifically from one user to another
    Optional<Connection> findByFromUsernameAndToUsername(String fromUsername, String toUsername);
    
    // Find all pending requests sent to a specific user
    List<Connection> findByToUsernameAndStatus(String toUsername, String status);
    
    // Find all connections where a user is involved
    @Query("SELECT c FROM Connection c WHERE " +
           "(c.fromUsername = ?1 OR c.toUsername = ?1) AND c.status = 'connected'")
    List<Connection> findAllConnectionsForUser(String username);

    // Add this query method to your existing ConnectionRepository
    @Query("SELECT COUNT(c) > 0 FROM Connection c " +
           "WHERE ((c.fromUsername = :user1 AND c.toUsername = :user2) " +
           "OR (c.fromUsername = :user2 AND c.toUsername = :user1)) " +
           "AND c.status = 'connected'")
    boolean areUsersConnected(@Param("user1") String user1, @Param("user2") String user2);

    @Modifying
    @Transactional
    void deleteByFromUsernameOrToUsername(String fromUsername, String toUsername);
}
