package com.example.backend.service;

import com.example.backend.model.Department;
import com.example.backend.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DepartmentService {

    @Autowired
    private DepartmentRepository departmentRepository;
    
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }
    
    public Optional<Department> getDepartmentById(Long id) {
        return departmentRepository.findById(id);
    }
    
    public Department getDepartmentByName(String name) {
        return departmentRepository.findByName(name);
    }
    
    public Department createDepartment(Department department) {
        // Check if department with same name already exists
        if (departmentRepository.existsByName(department.getName())) {
            throw new RuntimeException("Department with name '" + department.getName() + "' already exists");
        }
        return departmentRepository.save(department);
    }
    
    public Department updateDepartment(Long id, Department departmentDetails) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        
        // Check if new name conflicts with existing department
        if (!department.getName().equals(departmentDetails.getName()) && 
            departmentRepository.existsByName(departmentDetails.getName())) {
            throw new RuntimeException("Department with name '" + departmentDetails.getName() + "' already exists");
        }
        
        department.setName(departmentDetails.getName());
        return departmentRepository.save(department);
    }
    
    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Department not found with id: " + id));
        
        // Here you could add code to handle faculty members with this department
        // For example, set their department to null or to a default department
        
        departmentRepository.delete(department);
    }
    
    // Initialize with default departments if empty
    public void initializeDefaultDepartments() {
        if (departmentRepository.count() == 0) {
            createDepartment(new Department("Computer Science"));
            createDepartment(new Department("Electronics & Communication"));
            createDepartment(new Department("Mechanical Engineering"));
            createDepartment(new Department("Civil Engineering"));
            createDepartment(new Department("Information Technology"));
        }
    }
}
