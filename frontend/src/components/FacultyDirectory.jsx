import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, MapPin, Mail, Phone, Award, ArrowLeft, Plus, Trash2, X, Camera, Edit3 } from 'react-feather';
import NavBar from './NavBar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FacultyDirectory = () => {
  const [faculty, setFaculty] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [departments, setDepartments] = useState(['All Departments']);
  const [loading, setLoading] = useState(true);
  const [isUniversityAccount, setIsUniversityAccount] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    title: '',
    department: '',
    specialization: '',
    email: '',
    phone: '',
    office: '',
    profilePhoto: '',
    bio: ''
  });
  const [editFacultyId, setEditFacultyId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const profilePhotoInputRef = useRef(null);
  const [backendUrl] = useState('http://localhost:8080');
  
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [departmentToEdit, setDepartmentToEdit] = useState(null);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingDepts, setIsLoadingDepts] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem('username');
    setIsUniversityAccount(username === 'anurag_university');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchDepartments();
        
        const response = await axios.get('http://localhost:8080/api/faculty');
        setFaculty(response.data);
        setFilteredFaculty(response.data);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setFaculty([]);
        setFilteredFaculty([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoadingDepts(true);
      const response = await axios.get('http://localhost:8080/api/departments');
      
      if (response.data && Array.isArray(response.data)) {
        const deptNames = ['All Departments', ...response.data.map(dept => dept.name)];
        setDepartments(deptNames);
        console.log('Departments loaded:', deptNames);
      } else {
        console.error('Invalid department data format:', response.data);
        // Fallback to defaults if API fails
        setDepartments(['All Departments']);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback to defaults if API fails
      setDepartments(['All Departments']);
    } finally {
      setIsLoadingDepts(false);
    }
  };

  // Filter faculty based on search term and department
  useEffect(() => {
    const results = faculty.filter(member => {
      const matchesSearch = 
        (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        member.specialization?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDepartment = 
        selectedDepartment === 'All Departments' || 
        member.department === selectedDepartment;
      
      return matchesSearch && matchesDepartment;
    });
    
    setFilteredFaculty(results);
  }, [searchTerm, selectedDepartment, faculty]);

  const handleAddFaculty = () => {
    setIsAddModalOpen(true);
    setProfilePhotoPreview('');
    setNewFaculty({
      name: '',
      title: '',
      department: '',
      specialization: '',
      email: '',
      phone: '',
      office: '',
      profilePhoto: '',
      bio: ''
    });
  };

  const handleEditFaculty = (facultyMember) => {
    setEditFacultyId(facultyMember.id);
    setNewFaculty(facultyMember);
    
    const photoUrl = facultyMember.profilePhoto 
      ? facultyMember.profilePhoto.startsWith('http')
        ? facultyMember.profilePhoto
        : `${backendUrl}${facultyMember.profilePhoto}`
      : '';
      
    setProfilePhotoPreview(photoUrl);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setProfilePhotoPreview('');
    setNewFaculty({
      name: '',
      title: '',
      department: '',
      specialization: '',
      email: '',
      phone: '',
      office: '',
      profilePhoto: '',
      bio: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFaculty(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoClick = () => {
    profilePhotoInputRef.current.click();
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploadingPhoto(true);
        
        // Create preview for immediate visual feedback
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          setProfilePhotoPreview(dataUrl);
        };
        reader.readAsDataURL(file);
        
        // Upload the file to the server
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('http://localhost:8080/api/faculty/upload-photo', formData);
        
        // Update faculty with the new photo URL (add backend URL)
        setNewFaculty(prev => ({
          ...prev,
          profilePhoto: backendUrl + response.data.url
        }));
        
        setUploadingPhoto(false);
        
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        setUploadingPhoto(false);
      }
    }
  };

  const handleSubmitFaculty = async () => {
    try {
      if (editFacultyId) {
        // Update existing faculty member
        await axios.put(`http://localhost:8080/api/faculty/${editFacultyId}`, newFaculty);
      } else {
        // Add new faculty member
        await axios.post('http://localhost:8080/api/faculty', newFaculty);
      }
      
      // Refresh faculty data
      const response = await axios.get('http://localhost:8080/api/faculty');
      setFaculty(response.data);
      
      handleCloseModal();
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert('There was a problem saving the faculty data. Please try again.');
    }
  };

  const handleDeleteFaculty = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    try {
      // Delete faculty from the API
      await axios.delete(`http://localhost:8080/api/faculty/${deleteConfirmId}`);
      
      // Update local state
      setFaculty(prev => prev.filter(member => member.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting faculty:', error);
      alert('There was a problem deleting the faculty member. Please try again.');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleOpenDepartmentModal = () => {
    setIsDepartmentModalOpen(true);
    setNewDepartmentName('');
    setDepartmentToEdit(null);
  };
  
  const handleCloseDepartmentModal = () => {
    setIsDepartmentModalOpen(false);
    setNewDepartmentName('');
    setDepartmentToEdit(null);
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    
    if (departmentToEdit) {
      try {
        const deptToUpdate = departmentToEdit === 'All Departments' ? null : departmentToEdit;
        if (deptToUpdate) {
          // Get the department ID first
          const deptResponse = await axios.get('http://localhost:8080/api/departments');
          const department = deptResponse.data.find(d => d.name === deptToUpdate);
          
          if (department) {
            await axios.put(`http://localhost:8080/api/departments/${department.id}`, {
              name: newDepartmentName
            });
            
            // Update faculty members with this department
            setFaculty(prev => prev.map(member => ({
              ...member,
              department: member.department === departmentToEdit 
                ? newDepartmentName 
                : member.department
            })));
          }
        }
      } catch (error) {
        console.error('Error updating department:', error);
      }
    } else {
      try {
        // Add new department
        await axios.post('http://localhost:8080/api/departments', {
          name: newDepartmentName
        });
      } catch (error) {
        console.error('Error adding department:', error);
      }
    }
    
    // Refresh the departments list
    fetchDepartments();
    setNewDepartmentName('');
    setDepartmentToEdit(null);
  };

  const handleEditDepartment = (dept) => {
    if (dept === 'All Departments') return;
    setDepartmentToEdit(dept);
    setNewDepartmentName(dept);
  };
  
  const handleDeleteDepartment = async (dept) => {
    if (dept === 'All Departments') return;
    setDepartmentToDelete(dept);
  };
  
  const confirmDeleteDepartment = async () => {
    try {
      // Get the department ID first
      const response = await axios.get('http://localhost:8080/api/departments');
      const department = response.data.find(d => d.name === departmentToDelete);
      
      if (department) {
        await axios.delete(`http://localhost:8080/api/departments/${department.id}`);
        
        // Update faculty with this department to have no department
        setFaculty(prev => prev.map(member => ({
          ...member,
          department: member.department === departmentToDelete 
            ? '' 
            : member.department
        })));
        
        // Refresh the departments list
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
    
    setDepartmentToDelete(null);
  };

  return (
    <div style={styles.container}>
      <input 
        type="file" 
        ref={profilePhotoInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleProfilePhotoChange}
      />
      
      <NavBar />
      
      <div style={styles.pageHeader}>
        <div style={styles.headerContent}>
          <button 
            onClick={() => navigate('/university')} 
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#4B5563" />
            <span>Back to University</span>
          </button>
          <h1 style={styles.pageTitle}>Faculty Directory</h1>
          <p style={styles.pageDescription}>
            Browse our distinguished faculty members from various departments
          </p>
        </div>
      </div>
      
      <div style={styles.contentContainer}>
        <div style={styles.filterContainer}>
          <div style={styles.searchBox}>
            <Search size={20} color="#6B7280" />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.departmentFilter} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Filter size={18} color="#4B5563" />
            <div style={styles.selectedOption}>
              <span>{selectedDepartment}</span>
              <div style={styles.dropdownArrow}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            {isDropdownOpen && (
              <div style={styles.dropdownMenu}>
                {departments.map(dept => (
                  <div 
                    key={dept} 
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor: selectedDepartment === dept ? '#F3F4F6' : 'transparent',
                      fontWeight: selectedDepartment === dept ? '500' : 'normal',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDepartment(dept);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {dept}
                    {selectedDepartment === dept && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.3337 4L6.00033 11.3333L2.66699 8" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isUniversityAccount && (
            <>
              <button 
                onClick={handleOpenDepartmentModal}
                style={styles.manageDeptButton}
              >
                <Plus size={16} />
                <span>Manage Departments</span>
              </button>
              
              <button 
                onClick={handleAddFaculty}
                style={styles.addButton}
              >
                <Plus size={18} />
                <span>Add Faculty</span>
              </button>
            </>
          )}
        </div>
        
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading faculty members...</p>
          </div>
        ) : (
          <>
            <p style={styles.resultsCount}>
              Showing {filteredFaculty.length} of {faculty.length} faculty members
            </p>
            
            <div style={styles.facultyGrid}>
              {filteredFaculty.length > 0 ? (
                filteredFaculty.map(member => (
                  <div key={member.id} style={styles.facultyCard}>
                    {isUniversityAccount && (
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleEditFaculty(member)}
                          style={styles.editButton}
                          aria-label="Edit faculty"
                        >
                          <Edit3 size={18} color="#1E40AF" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaculty(member.id)}
                          style={styles.deleteButton}
                          aria-label="Delete faculty"
                        >
                          <Trash2 size={18} color="#EF4444" />
                        </button>
                      </div>
                    )}
                    <div style={styles.cardHeader}>
                      <div style={styles.facultyAvatar}>
                        <img
                          src={member.profilePhoto && member.profilePhoto.startsWith('http') 
                            ? member.profilePhoto 
                            : member.profilePhoto 
                              ? `${backendUrl}${member.profilePhoto}` 
                              : '/assets/placeholder-profile.png'
                          }
                          alt={member.name}
                          style={styles.avatarImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/placeholder-profile.png';
                          }}
                        />
                      </div>
                      <div style={styles.facultyNameSection}>
                        <h3 style={styles.facultyName}>{member.name}</h3>
                        <p style={styles.facultyTitle}>{member.title}</p>
                      </div>
                    </div>
                    
                    <div style={styles.cardDivider}></div>
                    
                    <div style={styles.facultyDetails}>
                      <div style={styles.detailItem}>
                        <Award size={16} color="#4B5563" />
                        <span style={styles.detailText}>
                          <strong>Department:</strong> {member.department}
                        </span>
                      </div>
                      <div style={styles.detailItem}>
                        <Award size={16} color="#4B5563" />
                        <span style={styles.detailText}>
                          <strong>Specialization:</strong> {member.specialization}
                        </span>
                      </div>
                      <div style={styles.detailItem}>
                        <Mail size={16} color="#1E40AF" />
                        <a href={`mailto:${member.email}`} style={styles.detailLink}>
                          {member.email}
                        </a>
                      </div>
                      <div style={styles.detailItem}>
                        <Phone size={16} color="#1E40AF" />
                        <a href={`tel:${member.phone}`} style={styles.detailLink}>
                          {member.phone}
                        </a>
                      </div>
                      <div style={styles.detailItem}>
                        <MapPin size={16} color="#4B5563" />
                        <span style={styles.detailText}>{member.office}</span>
                      </div>
                    </div>
                    
                    <p style={styles.facultyBio}>{member.bio}</p>
                  </div>
                ))
              ) : (
                <div style={styles.noResults}>
                  <p>No faculty members found matching your search criteria.</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setSelectedDepartment('All Departments'); }}
                    style={styles.resetButton}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Add/Edit Faculty Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editFacultyId ? 'Edit Faculty' : 'Add New Faculty'}</h3>
              <button style={styles.closeButton} onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {/* Profile photo upload UI */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Profile Photo</label>
                <div style={styles.photoUploadContainer}>
                  <div 
                    style={{
                      ...styles.photoPreview,
                      backgroundImage: profilePhotoPreview 
                        ? `url(${profilePhotoPreview})` 
                        : newFaculty.profilePhoto 
                          ? `url(${newFaculty.profilePhoto.startsWith('http') 
                              ? newFaculty.profilePhoto 
                              : `${backendUrl}${newFaculty.profilePhoto}`})`
                          : `url('/assets/placeholder-profile.png')`
                    }}
                  >
                    <button 
                      type="button" 
                      style={styles.photoUploadButton} 
                      onClick={handleProfilePhotoClick}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <div style={styles.miniSpinner}></div>
                      ) : (
                        <Camera size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Rest of form fields... */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={newFaculty.name} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="Dr. John Smith"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={newFaculty.title} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="Professor"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Department</label>
                <input 
                  type="text" 
                  name="department" 
                  value={newFaculty.department} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="Computer Science"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Specialization</label>
                <input 
                  type="text" 
                  name="specialization" 
                  value={newFaculty.specialization} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="Artificial Intelligence"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={newFaculty.email} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="email@anurag.edu.in"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={newFaculty.phone} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="(123) 456-7890"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Office</label>
                <input 
                  type="text" 
                  name="office" 
                  value={newFaculty.office} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="Tech Building, Room 101"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Bio</label>
                <textarea 
                  name="bio" 
                  value={newFaculty.bio} 
                  onChange={handleInputChange} 
                  style={styles.textarea}
                  placeholder="Brief professional biography..."
                  rows={3}
                />
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={handleCloseModal}>Cancel</button>
              <button 
                style={{...styles.submitButton, opacity: !newFaculty.name ? 0.7 : 1}}
                onClick={handleSubmitFaculty}
                disabled={!newFaculty.name}
              >
                {editFacultyId ? 'Save Changes' : 'Add Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirm Delete Modal */}
      {deleteConfirmId && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '400px'}}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Deletion</h3>
              <button style={styles.closeButton} onClick={cancelDelete}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{...styles.modalBody, textAlign: 'center'}}>
              <p>Are you sure you want to remove this faculty member?</p>
              <p style={styles.warningText}>This action cannot be undone.</p>
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={cancelDelete}>Cancel</button>
              <button style={styles.deleteConfirmButton} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Management Modal */}
      {isDepartmentModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '500px'}}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Manage Departments</h3>
              <button style={styles.closeButton} onClick={handleCloseDepartmentModal}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.departmentAddForm}>
                <div style={styles.inputWithIcon}>
                  <input
                    type="text"
                    placeholder="Department name..."
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    style={styles.input}
                  />
                  {departmentToEdit && (
                    <span style={styles.editingIndicator}>Editing: {departmentToEdit}</span>
                  )}
                </div>
                <button 
                  onClick={handleAddDepartment}
                  style={{
                    ...styles.deptActionButton, 
                    opacity: !newDepartmentName.trim() ? 0.7 : 1,
                    backgroundColor: departmentToEdit ? '#10B981' : '#1E40AF'
                  }}
                  disabled={!newDepartmentName.trim()}
                >
                  {departmentToEdit ? 'Update' : 'Add'}
                </button>
              </div>
              
              <div style={styles.departmentList}>
                <h4 style={styles.departmentListTitle}>Current Departments</h4>
                {departments.filter(dept => dept !== 'All Departments').length > 0 ? (
                  departments.filter(dept => dept !== 'All Departments').map(dept => (
                    <div key={dept} style={styles.departmentItem}>
                      <span style={styles.departmentName}>{dept}</span>
                      <div style={styles.departmentActions}>
                        <button
                          onClick={() => handleEditDepartment(dept)}
                          style={styles.deptEditButton}
                          title="Edit department"
                        >
                          <Edit3 size={16} color="#1E40AF" />
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(dept)}
                          style={styles.deptDeleteButton}
                          title="Delete department"
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.noDepartmentsMessage}>
                    <p>No departments added yet.</p>
                    <p style={styles.helpText}>Add your first department using the form above</p>
                  </div>
                )}
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={handleCloseDepartmentModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Delete Confirmation Modal */}
      {departmentToDelete && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '400px'}}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Department Deletion</h3>
              <button style={styles.closeButton} onClick={() => setDepartmentToDelete(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{...styles.modalBody, textAlign: 'center'}}>
              <p>Are you sure you want to delete the department: <strong>{departmentToDelete}</strong>?</p>
              <p style={styles.warningText}>
                This will remove the department from all faculty members.
              </p>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelButton} 
                onClick={() => setDepartmentToDelete(null)}
              >
                Cancel
              </button>
              <button 
                style={styles.deleteConfirmButton} 
                onClick={confirmDeleteDepartment}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add these new styles to your existing styles object
const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderTop: '4px solid #1E40AF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  pageHeader: {
    backgroundColor: 'white',
    padding: '2rem 0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    color: '#4B5563',
    marginBottom: '1rem',
  },
  pageTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: '0',
  },
  pageDescription: {
    fontSize: '1.1rem',
    color: '#6B7280',
    margin: '0.5rem 0 0 0',
  },
  contentContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  filterContainer: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    flex: '1',
    minWidth: '300px',
  },
  searchInput: {
    border: 'none',
    padding: '0.5rem',
    fontSize: '1rem',
    width: '100%',
    outline: 'none',
    marginLeft: '0.5rem',
  },
  departmentFilter: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
    position: 'relative',
    userSelect: 'none',
    minWidth: '200px',
  },
  selectedOption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: '0.5rem',
    width: '100%',
    color: '#4B5563',
    fontSize: '1rem',
  },
  dropdownArrow: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '0.5rem',
    transition: 'transform 0.2s',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 10,
    maxHeight: '250px',
    overflow: 'auto',
    border: '1px solid #E5E7EB',
  },
  dropdownItem: {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.1s',
    ':hover': {
      backgroundColor: '#F9FAFB',
    }
  },
  resultsCount: {
    fontSize: '0.95rem',
    color: '#6B7280',
    margin: '0 0 1rem 0',
  },
  facultyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
    marginBottom: '3rem',
  },
  facultyCard: {
    position: 'relative', // For absolute positioning of action buttons
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  facultyAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  facultyNameSection: {
    flex: 1,
  },
  facultyName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 0.25rem 0',
  },
  facultyTitle: {
    fontSize: '1rem',
    color: '#4B5563',
    margin: '0',
  },
  cardDivider: {
    height: '1px',
    backgroundColor: '#E5E7EB',
    margin: '1rem 0',
  },
  facultyDetails: {
    marginBottom: '1rem',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  detailText: {
    fontSize: '0.95rem',
    color: '#4B5563',
  },
  detailLink: {
    fontSize: '0.95rem',
    color: '#1E40AF',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  facultyBio: {
    fontSize: '0.95rem',
    color: '#4B5563',
    lineHeight: '1.5',
    margin: '0',
  },
  noResults: {
    textAlign: 'center',
    padding: '3rem',
    gridColumn: '1 / -1',
  },
  resetButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '1.5rem',
    maxHeight: '70vh',
    overflow: 'auto',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#4B5563',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #E5E7EB',
    fontSize: '1rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #E5E7EB',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: 'white',  
    color: '#111827',         
  },
  modalFooter: {
    padding: '1rem',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  cancelButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  deleteConfirmButton: {
    padding: '0.75rem 1rem',
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  warningText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  photoUploadContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  photoPreview: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    border: '1px solid #E5E7EB',
  },
  photoUploadButton: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  miniSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  actionButtons: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    display: 'flex',
    gap: '0.5rem',
  },
  editButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageDeptButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontWeight: '500',
  },
  departmentAddForm: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  deptActionButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.75rem 1.25rem',
    cursor: 'pointer',
    flexShrink: 0,
    fontWeight: '500',
    transition: 'transform 0.1s, background-color 0.2s',
    ':hover': {
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    }
  },
  departmentList: {
    maxHeight: '300px',
    overflow: 'auto',
  },
  departmentListTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#111827',
  },
  departmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    marginBottom: '0.75rem',
    transition: 'transform 0.1s, box-shadow 0.1s',
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.05)',
    }
  },
  departmentActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  deptEditButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.35rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#EBF5FF',
    }
  },
  deptDeleteButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.35rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#FEE2E2',
    }
  },
  noDepartmentsMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    padding: '2rem 1rem',
    color: '#6B7280',
    fontStyle: 'italic',
    border: '1px dashed #E5E7EB',
  },
  inputWithIcon: {
    position: 'relative',
    flex: 1,
  },
  editingIndicator: {
    position: 'absolute',
    top: '-1.2rem',
    left: '0',
    fontSize: '0.75rem',
    color: '#10B981',
    fontWeight: '500',
  },
  departmentName: {
    fontWeight: '500',
    color: '#374151',
  },
  helpText: {
    fontSize: '0.8rem',
    color: '#9CA3AF',
    marginTop: '0.25rem',
  },
};

export default FacultyDirectory;