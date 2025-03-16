package com.example.backend.service;

import com.example.backend.model.Faculty;
import com.example.backend.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;
    
    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }
    
    public List<Faculty> getFacultyByDepartment(String department) {
        return facultyRepository.findByDepartment(department);
    }
    
    public Faculty saveFaculty(Faculty faculty) {
        return facultyRepository.save(faculty);
    }
    
    public Optional<Faculty> getFacultyById(Long id) {
        return facultyRepository.findById(id);
    }
    
    public void deleteFaculty(Long id) {
        facultyRepository.deleteById(id);
    }
}
