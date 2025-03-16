package com.example.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

import com.example.backend.config.FileStorageProperties;
import com.example.backend.service.DepartmentService;
import com.example.backend.service.EventCategoryService;

@SpringBootApplication
@EnableConfigurationProperties(FileStorageProperties.class)
public class BackendApplication {

    @Autowired
    private DepartmentService departmentService;
    
    @Autowired
    private EventCategoryService eventCategoryService;

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            departmentService.initializeDefaultDepartments();
            eventCategoryService.initializeDefaultCategories();
        };
    }
}
