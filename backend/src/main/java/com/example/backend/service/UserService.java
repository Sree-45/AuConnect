package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.model.Post;
import com.example.backend.model.Users;
import com.example.backend.repository.ConnectionRepository;
import com.example.backend.repository.MessageRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.UserRepository;

import java.util.List;
import java.util.logging.Logger; // Standard Java logging instead of Lombok

@Service
public class UserService {
    
    // Standard Java logger instead of Lombok's @Slf4j
    private static final Logger log = Logger.getLogger(UserService.class.getName());
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private ConnectionRepository connectionRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private PostService postService;

    @Transactional
    public void deleteUserAccount(String username) {
        // Find the user
        Users user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found with username: " + username);
        }

        // Delete user's posts, comments, and likes
        List<Post> userPosts = postRepository.findByUsernameOrderByCreatedDateDesc(username);
        for (Post post : userPosts) {
            postService.deletePost(post.getId()); // Reuse existing post deletion logic
        }
        
        // Delete user's connections (both directions)
        connectionRepository.deleteByFromUsernameOrToUsername(username, username);
        
        // Delete user's messages (both sent and received)
        messageRepository.deleteByFromUsernameOrToUsername(username, username);
        
        // Finally, delete the user
        userRepository.delete(user);
        
        log.info("Successfully deleted user account with username: " + username);
    }
}
