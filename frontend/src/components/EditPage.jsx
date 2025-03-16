import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Edit, Calendar, Eye, EyeOff, MapPin, Phone, Mail, Globe } from 'lucide-react'; 
import NavBar from './NavBar';
import axios from 'axios';

const EditPage = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::placeholder {
        color: #9CA3AF !important;
        opacity: 1 !important;
      }
      :-ms-input-placeholder {
        color: #9CA3AF !important;
      }
      ::-ms-input-placeholder {
        color: #9CA3AF !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const coverPhotoInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    major: '',
    location: '',
    bio: '',
    rollNumber: '',
    degree: '',
    currentYear: '',
    semester: '',
    admissionId: '',
    dateOfJoining: '',
    dateOfBirth: '', 
    cgpa: '', 
    email: '',
    phoneNumber: '',
    skills: [],
    experiences: [],
    socialLinks: [],
    achievements: [],
    interests: [],
    profilePhoto: '',
    coverPhoto: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState(false);
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const isUniversityAccount = username === 'anurag_university';

  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [coverPhotoPreview, setCoverPhotoPreview] = useState('');

  const [isSaveButtonHovered, setSaveButtonHovered] = useState(false);
  const [isDeleteButtonHovered, setDeleteButtonHovered] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isChangePasswordButtonHovered, setChangePasswordButtonHovered] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [contactData, setContactData] = useState({
    universityUsername: '',
    fullAddress: '',
    phone: '',
    email: '',
    website: '',
    directionsUrl: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);

  useEffect(() => {
    if (userData.profilePhoto) {
      setProfilePhotoPreview(userData.profilePhoto);
    }
    if (userData.coverPhoto) {
      setCoverPhotoPreview(userData.coverPhoto);
    }
  }, [userData.profilePhoto, userData.coverPhoto]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/profile?username=${username}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        console.log("Profile photo from backend:", data.profilePhoto);
        console.log("Cover photo from backend:", data.coverPhoto);
        
        const formattedProfilePhoto = formatImageUrl(data.profilePhoto);
        const formattedCoverPhoto = formatImageUrl(data.coverPhoto);
        
        console.log("Formatted profile photo:", formattedProfilePhoto);
        console.log("Formatted cover photo:", formattedCoverPhoto);
        
        setUserData({
          ...data,
          profilePhoto: formattedProfilePhoto,
          coverPhoto: formattedCoverPhoto,
          skills: Array.isArray(data.skills) ? data.skills : [],
          experiences: Array.isArray(data.professionalExperiences) ? data.professionalExperiences : [],
          achievements: Array.isArray(data.academicAchievements) ? data.academicAchievements : [],
          interests: Array.isArray(data.interests) ? data.interests : [],
          socialLinks: data.socialLinks ? Object.entries(data.socialLinks).map(([platform, url]) => ({ platform, url })) : [],
        });
        
        if (formattedProfilePhoto) setProfilePhotoPreview(formattedProfilePhoto);
        if (formattedCoverPhoto) setCoverPhotoPreview(formattedCoverPhoto);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }

      
    };

    fetchUserData();
  }, [username]);
useEffect(() => {
  if (userData.username === 'anurag_university') {
    const fetchContactData = async () => {
      try {
        const contactResponse = await fetch(`http://localhost:8080/university/contact?username=${userData.username}`);
        if (contactResponse.ok) {
          const data = await contactResponse.json();
          setContactData({
            universityUsername: userData.username,
            fullAddress: data.fullAddress || '',
            phone: data.phone || userData.phoneNumber || '',
            email: data.email || userData.email || '',
            website: data.website || '',
            directionsUrl: data.directionsUrl || ''
          });
        }
      } catch (error) {
        console.error("Error fetching contact data:", error);
      }
    };

    fetchContactData();
  }
}, [userData.username]); 
  const formatImageUrl = (url) => {
    if (!url) return '';
    
    url = url.trim();
    
    if (url.includes(' ')) {
      const baseUrlPart = url.substring(0, url.lastIndexOf('/') + 1);
      const filenamePart = url.substring(url.lastIndexOf('/') + 1);
      // Encode just the filename part
      const encodedFilename = encodeURIComponent(filenamePart);
      url = baseUrlPart + encodedFilename;
    }
    
    // If it's already a complete URL, return as is
    if (url.startsWith('http')) return url;
    
    // If it's an absolute path starting with /, add the base URL
    if (url.startsWith('/')) return `http://localhost:8080${url}`;
    
    // Otherwise, add the base URL with a separator /
    return `http://localhost:8080/${url}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactData({
      ...contactData,
      [name]: value
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validate userData before sending the request
      if (!userData.firstName || !userData.lastName || !userData.email) {
        throw new Error('Please fill in all required fields.');
      }

      // Convert socialLinks array to a map
      const socialLinksMap = {};
      userData.socialLinks.forEach(link => {
        if (link.platform && link.url) {
          socialLinksMap[link.platform] = link.url;
        }
      });

      // Create a new object with backend field names
      const backendUserData = {
        ...userData,
        socialLinks: socialLinksMap,
        professionalExperiences: userData.experiences || [],
        academicAchievements: userData.achievements || [],
        interests: userData.interests || [],
        // Remove frontend-specific field names
        experiences: undefined,
        achievements: undefined
      };

      console.log('Saving user data:', backendUserData);
      const response = await fetch(`http://localhost:8080/profile?username=${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendUserData),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        throw new Error('Network response was not ok');
      }
      
      // If university account, also save contact data
      if (userData.username === 'anurag_university') {
        const contactResponse = await fetch('http://localhost:8080/university/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...contactData,
            universityUsername: userData.username
          }),
        });
        
        if (!contactResponse.ok) {
          console.error('Failed to save contact information');
        }
      }
      
      setIsSaving(false);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
        if (isUniversityAccount) {
          navigate('/university');
        } else {
          navigate(`/profile/${username}`);
        }
      }, 1000); 
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setIsSaving(false);
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
    }
  };

  const handleDelete = (field, index) => {
    setUserData((prevData) => ({
      ...prevData,
      [field]: prevData[field].filter((_, i) => i !== index),
    }));
  };

  const handleAdd = (field) => {
    if (field === 'socialLinks') {
      setUserData((prevData) => ({
        ...prevData,
        [field]: [...prevData[field], { platform: '', url: '' }],
      }));
    } else {
      setUserData((prevData) => ({
        ...prevData,
        [field]: [...prevData[field], ''],
      }));
    }
  };

  const handleCoverPhotoClick = () => {
    coverPhotoInputRef.current.click();
  };

  const handleProfilePhotoClick = () => {
    profilePhotoInputRef.current.click();
  };

  const handleCoverPhotoChange = async (event) => {
    try {
      setUploadingCoverPhoto(true);
      const file = event.target.files[0];
      
      // File preview logic
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setCoverPhotoPreview(dataUrl);
      };
      reader.readAsDataURL(file);
      
      console.log("Uploading cover photo...");
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        'http://localhost:8080/upload/cover-photo', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log("Response received:", response.data);
      
      // Get URL from response
      const serverUrl = response.data.fileUrl;
      const imageUrl = `http://localhost:8080${serverUrl}`;
      
      console.log("Image URL:", imageUrl);
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        coverPhoto: imageUrl
      }));
      
      // THIS LINE IS MISSING - Add it to persist to database
      await updateUserPhoto(imageUrl, 'cover');
      
      setUploadingCoverPhoto(false);
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      setError(`Failed to upload cover photo: ${error.message}`);
      setUploadingCoverPhoto(false);
    }
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setUploadingProfilePhoto(true);
        
        // Create a preview URL for immediate visual feedback
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          setProfilePhotoPreview(dataUrl);
        };
        reader.readAsDataURL(file);
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload file to server
        const response = await axios.post(
          'http://localhost:8080/upload/profile-photo', 
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        // Get URL from server response and construct full URL
        const imageUrl = `http://localhost:8080${response.data.fileUrl}`;
        
        // Update user data with server URL
        setUserData(prev => ({
          ...prev,
          profilePhoto: imageUrl
        }));
        
        // Add this line to persist to database
        await updateUserPhoto(imageUrl, 'profile');
        
        setUploadingProfilePhoto(false);
      } catch (error) {
        console.error('Error uploading profile photo:', error);
        setError(`Failed to upload profile photo: ${error.message}`);
        setUploadingProfilePhoto(false);
      }
    }
  };

  // Function to handle base64 image uploads for compatibility
  const uploadBase64Image = async (base64Image, type) => {
    try {
      const response = await axios.post('http://localhost:8080/api/files/upload-base64', {
        image: base64Image,
        type: type
      });
      
      return response.data.url;
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error);
      throw new Error(`Failed to upload ${type} photo: ${error.message}`);
    }
  };

  const updateUserPhoto = async (photoUrl, type) => {
    try {
      // Get current user data
      const currentUserData = { ...userData };

      // Store the previous photo URL
      const previousPhotoUrl = type === 'profile' ? currentUserData.profilePhoto : currentUserData.coverPhoto;

      // Update the photo field
      if (type === 'profile') {
        currentUserData.profilePhoto = photoUrl;
      } else {
        currentUserData.coverPhoto = photoUrl;
      }

      // Convert socialLinks array to a map (same as in handleSave)
      const socialLinksMap = {};
      if (currentUserData.socialLinks) {
        currentUserData.socialLinks.forEach(link => {
          if (link.platform && link.url) {
            socialLinksMap[link.platform] = link.url;
          }
        });
      }

      // Create a proper backend object structure (same as in handleSave)
      const backendUserData = {
        ...currentUserData,
        socialLinks: socialLinksMap,
        professionalExperiences: currentUserData.experiences || [],
        academicAchievements: currentUserData.achievements || [],
        interests: currentUserData.interests || [],
        // Remove frontend-specific field names
        experiences: undefined,
        achievements: undefined
      };

      // Save to database
      const response = await fetch(`http://localhost:8080/profile?username=${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendUserData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        throw new Error('Network response was not ok');
      }

      console.log(`${type} photo updated in database`);

      // Delete the previous photo if it exists
      
    } catch (error) {
      console.error(`Error updating ${type} photo in database:`, error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:8080/profile/delete?username=${username}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Clear local storage
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      
      // Redirect to home page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account. Please try again later.');
      setLoading(false);
    }
  };

  // Add this function with the other handlers
  const handleChangePassword = async () => {
    // Reset error and success messages
    setPasswordError('');
    setPasswordSuccess('');

    // Validate inputs
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (!newPassword) {
      setPasswordError('Please enter your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Check password complexity
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must include at least one capital letter');
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must include at least one number');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(newPassword)) {
      setPasswordError('Password must include at least one special character');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          currentPassword: currentPassword,
          newPassword: newPassword
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Show success message
        setPasswordSuccess('Password changed successfully');
        
        // Reset form fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Close modal and redirect after 1.5 seconds
        setTimeout(() => {
          setShowChangePasswordModal(false);
          // Redirect to home page
          navigate('/', { replace: true });
        }, 1500);
      } else {
        // Show error from server
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Network error. Please try again later.');
    }
  };

  const handleDeleteAccountWithPassword = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }
    
    try {
      const verifyResponse = await fetch(`http://localhost:8080/api/users/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: deletePassword
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyData.status !== 'success') {
        setDeleteError('Incorrect password. Please try again.');
        return;
      }
      
      // Password verified, proceed with deletion
      setLoading(true);
      
      const response = await fetch(`http://localhost:8080/profile/delete?username=${username}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Clear local storage
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      
      // Redirect to registration page
      navigate('/register', { replace: true });
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError('Failed to delete account. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error loading profile</h2>
        <p>{error}</p>
        <p>Please try again later or contact support.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <NavBar />
      <input 
        type="file" 
        ref={coverPhotoInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleCoverPhotoChange}
      />
      <input 
        type="file" 
        ref={profilePhotoInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handleProfilePhotoChange}
      />
      <div style={styles.photoContainer}>
        <div style={{
          ...styles.coverPhotoWrapper, 
          backgroundImage: `url(${coverPhotoPreview || userData.coverPhoto || '/assets/placeholder-cover.png'})`
        }}>
          <button 
            type="button" 
            style={styles.uploadButton} 
            onClick={handleCoverPhotoClick}
            disabled={uploadingCoverPhoto}
          >
            {uploadingCoverPhoto ? (
              <div style={styles.miniSpinner}></div>
            ) : (
              <Camera size={18} />
            )}
          </button>
        </div>
        <div style={styles.profilePhotoSection}>
          <div style={{
            ...styles.profilePhotoWrapper, 
            backgroundImage: `url(${profilePhotoPreview || userData.profilePhoto || '/assets/placeholder-profile.png'})`
          }}>
            <button 
              type="button" 
              style={styles.profilePhotoUploadButton} 
              onClick={handleProfilePhotoClick}
              disabled={uploadingProfilePhoto}
            >
              {uploadingProfilePhoto ? (
                <div style={styles.miniSpinner}></div>
              ) : (
                <Camera size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
      <div style={styles.formContainer}>
        <h1 style={styles.title}>{isUniversityAccount ? 'Edit University Profile' : 'Edit Profile'}</h1>
        <form style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="firstName">First Name</label>
              <input
                style={styles.input}
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                value={userData.firstName || ''}
                onChange={handleChange}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="lastName">Last Name</label>
              <input
                style={styles.input}
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                value={userData.lastName || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          {isUniversityAccount ? (
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="location">Location</label>
                <input
                  style={styles.input}
                  type="text"
                  id="location"
                  name="location"
                  placeholder="City, State or Country"
                  value={userData.location || ''}
                  onChange={handleChange}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="email">Email</label>
                <input
                  style={styles.input}
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={userData.email || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          ) : (
            // Include all other form fields for non-university users
            <>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="major">Major</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="major"
                    name="major"
                    placeholder="E.g., Computer Science, Engineering"
                    value={userData.major || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="location">Location</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="location"
                    name="location"
                    placeholder="City, State or Country"
                    value={userData.location || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="bio">Bio</label>
                  <textarea
                    style={styles.textarea}
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={userData.bio || ''}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="rollNumber">Roll Number</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="rollNumber"
                    name="rollNumber"
                    placeholder="Your university roll number"
                    value={userData.rollNumber || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="degree">Degree</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="degree"
                    name="degree"
                    placeholder="E.g., B.Tech, M.Tech, Ph.D."
                    value={userData.degree || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="currentYear">Current Year</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="currentYear"
                    name="currentYear"
                    placeholder="E.g., 1st, 2nd, 3rd, 4th"
                    value={userData.currentYear || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="semester">Semester</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="semester"
                    name="semester"
                    placeholder="E.g., Fall 2024, Spring 2025"
                    value={userData.semester || ''}
                    onChange={handleChange}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="admissionId">Admission ID</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="admissionId"
                    name="admissionId"
                    placeholder="Your university admission ID"
                    value={userData.admissionId || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="dateOfJoining">Date of Joining</label>
                  <div style={styles.dateInputWrapper}>
                    <input
                      style={styles.dateInput}
                      type="date"
                      id="dateOfJoining"
                      name="dateOfJoining"
                      placeholder="Select your joining date"
                      value={userData.dateOfJoining || ''}
                      onChange={handleChange}
                    />
                    <Calendar size={16} style={styles.calendarIcon} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="email">Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={userData.email || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="phoneNumber">Phone Number</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="Your contact number"
                    value={userData.phoneNumber || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="skills">
                    Skills
                  </label>
                  {userData.skills.map((skill, index) => (
                    <div key={index} style={styles.inputWrapper}>
                      <input
                        style={styles.input}
                        type="text"
                        placeholder="E.g., Java, c"
                        value={skill}
                        onChange={(e) => {
                          const newSkills = [...userData.skills];
                          newSkills[index] = e.target.value;
                          setUserData({ ...userData, skills: newSkills });
                        }}
                      />
                      <button type="button" style={styles.deleteButton} onClick={() => handleDelete('skills', index)}>❌</button>
                    </div>
                  ))}
                  <button type="button" style={styles.addButton} onClick={() => handleAdd('skills')}>Add Skill</button>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="experiences">
                    Experiences
                  </label>
                  {userData.experiences.map((experience, index) => (
                    <div key={index} style={styles.inputWrapper}>
                      <input
                        style={styles.input}
                        type="text"
                        placeholder="E.g., Software Engineer at XYZ Company (2022-Present)"
                        value={experience}
                        onChange={(e) => {
                          const newExperiences = [...userData.experiences];
                          newExperiences[index] = e.target.value;
                          setUserData({ ...userData, experiences: newExperiences });
                        }}
                      />
                      <button type="button" style={styles.deleteButton} onClick={() => handleDelete('experiences', index)}>❌</button>
                    </div>
                  ))}
                  <button type="button" style={styles.addButton} onClick={() => handleAdd('experiences')}>Add Experience</button>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="achievements">
                    Achievements
                  </label>
                  {userData.achievements.map((achievement, index) => (
                    <div key={index} style={styles.inputWrapper}>
                      <input
                        style={styles.input}
                        type="text"
                        placeholder="E.g., Hackathon Winner"
                        value={achievement}
                        onChange={(e) => {
                          const newAchievements = [...userData.achievements];
                          newAchievements[index] = e.target.value;
                          setUserData({ ...userData, achievements: newAchievements });
                        }}
                      />
                      <button type="button" style={styles.deleteButton} onClick={() => handleDelete('achievements', index)}>❌</button>
                    </div>
                  ))}
                  <button type="button" style={styles.addButton} onClick={() => handleAdd('achievements')}>Add Achievement</button>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="interests">
                    Interests
                  </label>
                  {userData.interests.map((interest, index) => (
                    <div key={index} style={styles.inputWrapper}>
                      <input
                        style={styles.input}
                        type="text"
                        placeholder="E.g.,Photography, Sports"
                        value={interest}
                        onChange={(e) => {
                          const newInterests = [...userData.interests];
                          newInterests[index] = e.target.value;
                          setUserData({ ...userData, interests: newInterests });
                        }}
                      />
                      <button type="button" style={styles.deleteButton} onClick={() => handleDelete('interests', index)}>❌</button>
                    </div>
                  ))}
                  <button type="button" style={styles.addButton} onClick={() => handleAdd('interests')}>Add Interest</button>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{...styles.formGroup, gridColumn: 'span 2'}}>
                  <label style={styles.label} htmlFor="socialLinks">
                    Social Links
                  </label>
                  {userData.socialLinks.map((link, index) => (
                    <div key={index} style={styles.socialLinkWrapper}>
                      <div style={styles.socialLinkInputGroup}>
                        <input
                          style={styles.socialPlatformInput}
                          type="text"
                          placeholder="Platform (e.g. LinkedIn, Twitter)"
                          value={link.platform}
                          onChange={(e) => {
                            const newSocialLinks = [...userData.socialLinks];
                            newSocialLinks[index].platform = e.target.value;
                            setUserData({ ...userData, socialLinks: newSocialLinks });
                          }}
                        />
                        <input
                          style={styles.socialUrlInput}
                          type="text"
                          placeholder="URL (e.g. https://linkedin.com/in/username)"
                          value={link.url}
                          onChange={(e) => {
                            const newSocialLinks = [...userData.socialLinks];
                            newSocialLinks[index].url = e.target.value;
                            setUserData({ ...userData, socialLinks: newSocialLinks });
                          }}
                        />
                        <button 
                          type="button" 
                          style={styles.deleteSocialButton} 
                          onClick={() => handleDelete('socialLinks', index)}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    style={styles.addSocialButton} 
                    onClick={() => handleAdd('socialLinks')}
                  >
                    Add Social Link
                  </button>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="dateOfBirth">Date of Birth</label>
                  <div style={styles.dateInputWrapper}>
                    <input
                      style={styles.dateInput}
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      placeholder="Select your birth date"
                      value={userData.dateOfBirth || ''}
                      onChange={handleChange}
                    />
                    <Calendar size={16} style={styles.calendarIcon} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="cgpa">CGPA</label>
                  <input
                    style={styles.input}
                    type="number"
                    id="cgpa"
                    name="cgpa"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="Your current CGPA (e.g., 8.75)"
                    value={userData.cgpa || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Add university contact information inside the main form */}
          {isUniversityAccount && (
            <>
              

              <div style={styles.formRow}>
                <div style={{...styles.formGroup, gridColumn: 'span 2'}}>
                  <label style={styles.label} htmlFor="fullAddress">University Address</label>
                  <textarea
                    style={styles.textarea}
                    id="fullAddress"
                    name="fullAddress"
                    placeholder="Venkatapur, Ghatkesar, Medchal–Malkajgiri district, Hyderabad, Telangana, India. 500 088"
                    value={contactData.fullAddress || ''}
                    onChange={handleContactChange}
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="phone">Phone Number</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="phone"
                    name="phone"
                    placeholder="+91-8181057057"
                    value={contactData.phone || ''}
                    onChange={handleContactChange}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="email">Email Address</label>
                  <input
                    style={styles.input}
                    type="email"
                    id="email"
                    name="email"
                    placeholder="admissionsic@anurag.edu.in"
                    value={contactData.email || ''}
                    onChange={handleContactChange}
                  />
                </div>
              </div>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="website">University Website</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="website"
                    name="website"
                    placeholder="www.anurag.edu.in"
                    value={contactData.website || ''}
                    onChange={handleContactChange}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="directionsUrl">Google Maps Link</label>
                  <input
                    style={styles.input}
                    type="text"
                    id="directionsUrl"
                    name="directionsUrl"
                    placeholder="https://maps.google.com/?q=Anurag+University"
                    value={contactData.directionsUrl || ''}
                    onChange={handleContactChange}
                  />
                </div>
              </div>
            </>
          )}
          
          {/* All buttons stacked vertically at the bottom */}
          <div style={{marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <button 
              type="button" 
              style={{
                ...styles.saveButton,
                width: '100%',
                ...(isSaveButtonHovered ? { backgroundColor: '#2563EB', transform: 'scale(1.01)' } : {})
              }} 
              onClick={handleSave}
              onMouseEnter={() => setSaveButtonHovered(true)}
              onMouseLeave={() => setSaveButtonHovered(false)}
            >
              Save
            </button>

            <button 
              type="button" 
              style={{
                ...styles.changePasswordButton,
                width: '100%',
                marginTop: '0',
                ...(isChangePasswordButtonHovered ? { backgroundColor: '#E0E7FF', color: '#1E40AF' } : {})
              }} 
              onClick={() => setShowChangePasswordModal(true)}
              onMouseEnter={() => setChangePasswordButtonHovered(true)}
              onMouseLeave={() => setChangePasswordButtonHovered(false)}
            >
              Change Password
            </button>
            
            <button 
              type="button" 
              style={{
                ...styles.deleteAccountButton,
                width: '100%',
                marginTop: '0',
                ...(isDeleteButtonHovered ? { backgroundColor: '#FEF2F2', color: '#DC2626' } : {})
              }} 
              onClick={() => setShowDeleteModal(true)}
              onMouseEnter={() => setDeleteButtonHovered(true)}
              onMouseLeave={() => setDeleteButtonHovered(false)}
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
      
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#EF4444'
            }}>Delete Account</h3>
            
            <p style={{
              marginBottom: '1.5rem',
              lineHeight: '1.5',
              color: '#4B5563'
            }}>
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            
            <div style={styles.passwordForm}>
              {deleteError && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {deleteError}
                </div>
              )}
              
              {/* Password confirmation for account deletion */}
              <div style={{marginBottom: '1.5rem'}}>
                <label 
                  htmlFor="deletePassword" 
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4B5563',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}
                >
                  Enter your password to confirm
                </label>
                <div style={styles.passwordInputContainer}>
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button 
                    type="button"
                    style={styles.togglePassword}
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    aria-label={showDeletePassword ? "Hide password" : "Show password"}
                  >
                    {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelButton}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmDeleteButton}
                onClick={handleDeleteAccountWithPassword}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showChangePasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#1E40AF'
            }}>Change Password</h3>
            
            <p style={{
              marginBottom: '1.5rem',
              lineHeight: '1.5',
              color: '#4B5563'
            }}>
              Please enter your current password and choose a new password.
            </p>

            <div style={styles.passwordForm}>
              {passwordError && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div style={styles.successMessage}>
                  {passwordSuccess}
                </div>
              )}

              {/* Current password input */}
              <div style={{marginBottom: '1rem'}}>
                <label 
                  htmlFor="currentPassword" 
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4B5563',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}
                >
                  Current Password
                </label>
                <div style={styles.passwordInputContainer}>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button 
                    type="button"
                    style={styles.togglePassword}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* New password input */}
              <div style={{marginBottom: '1rem'}}>
                <label 
                  htmlFor="newPassword" 
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4B5563',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}
                >
                  New Password
                </label>
                <div style={styles.passwordInputContainer}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button 
                    type="button"
                    style={styles.togglePassword}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem'}}>
                  Password must be at least 6 characters with at least one capital letter, one number, and one special character
                </div>
              </div>
              
              {/* Confirm password input */}
              <div style={{marginBottom: '1.5rem'}}>
                <label 
                  htmlFor="confirmPassword" 
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4B5563',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}
                >
                  Confirm New Password
                </label>
                <div style={styles.passwordInputContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #E5E7EB',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button 
                    type="button"
                    style={styles.togglePassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelButton}
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
              >
                Cancel
              </button>
              <button 
                style={{...styles.confirmButton, backgroundColor: '#1E40AF'}}
                onClick={handleChangePassword}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    margin: '0 auto',
    backgroundColor: '#F3F4F6',
    overflowY: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'calc(100vh - 60px)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #1E40AF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  errorContainer: {
    padding: '2rem',
    textAlign: 'center',
    color: '#EF4444',
  },
  photoContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: '80px',
  },
  coverPhotoWrapper: {
    width: '100%',
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
  },
    passwordInputContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    togglePassword: {
      position: 'absolute',
      right: '10px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6B7280',
      outline: 'none',
      boxShadow: 'none',
    },
  uploadButton: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
  },
  profilePhotoSection: {
    position: 'absolute',
    bottom: '-60px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  },
  profilePhotoWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '60px',
    border: '4px solid white',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  profilePhotoUploadButton: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
  },
  formContainer: {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#1E40AF',

  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.25rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: '0.5rem',
    display: 'block',
  },
  input: {
    padding: '0.75rem',
    borderRadius: '0.25rem',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    color: '#111827',
    backgroundColor: 'white',
    width: '100%',
    boxSizing: 'border-box',
    '&::placeholder': {
      color: '#9CA3AF',
      opacity: 1, // Firefox sometimes needs this
    },
    '&:focus': {
      outline: 'none',
      borderColor: '#1E40AF',
      boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.2)',
    },
  },
  textarea: {
    padding: '0.75rem',
    borderRadius: '0.25rem',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    color: '#111827',
    resize: 'vertical',
    minHeight: '100px',
    backgroundColor: 'white',
    width: '100%',
    boxSizing: 'border-box',
    '&::placeholder': {
      color: '#9CA3AF',
      opacity: 1,
    },
    
    '&:focus': {
      outline: 'none',
      borderColor: '#1E40AF',
      boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.2)',
    },
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'white',
  },
  saveButton: {
    gridColumn: 'span 2',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.25rem',
    border: 'none',
    backgroundColor: '#1E40AF',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.3s, transform 0.3s',
  },
  saveButtonHover: {
    backgroundColor: '#374151',
    transform: 'scale(1.05)',
  },
  button: {
    backgroundColor: 'white',
    color: 'black',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    right: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#EF4444',
    fontSize: '0.5rem',
    boxShadow: 'none',
    outline: 'none',
  },
  addButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    width: 'fit-content',
  },
  socialLinkWrapper: {
    marginBottom: '0.75rem',
  },
  socialLinkInputGroup: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    gap: '0.5rem',
  },
  socialPlatformInput: {
    flex: '0 0 30%',
    padding: '0.75rem',
    borderRadius: '0.25rem 0 0 0.25rem',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    color: '#111827',
    backgroundColor: 'white',
  },
  socialUrlInput: {
    flex: '1',
    padding: '0.75rem',
    borderRadius: '0 0.25rem 0.25rem 0',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    color: '#111827',
    backgroundColor: 'white',
  },
  deleteSocialButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#EF4444',
    fontSize: '0.875rem',
    marginLeft: '0.5rem',
    boxShadow: 'none',
    outline: 'none',
  },
  addSocialButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    width: 'fit-content',
  },
  miniSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  dateInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  dateInput: {
    flex: '1',
    padding: '0.75rem',
    borderRadius: '0.25rem',
    backgroundColor: 'white',
    width: '100%',
    boxSizing: 'border-box',
    '&::placeholder': {
      color: '#9CA3AF',
      opacity: 1,
    },
    '&:focus': {
      outline: 'none',
      borderColor: '#1E40AF',
      boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.2)',
    },
  },
  calendarIcon: {
    position: 'absolute',
    right: '10px',
    pointerEvents: 'none',
    color: '#9CA3AF',
  },
  deleteAccountButton: {
    gridColumn: 'span 2',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.25rem',
    border: '1px solid #EF4444',
    backgroundColor: 'white',
    color: '#EF4444',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#FEF2F2',
    }
  },
  changePasswordButton: {
    gridColumn: 'span 2',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.25rem',
    border: '1px solid #1E40AF',
    backgroundColor: 'white',
    color: '#1E40AF',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#E0E7FF',
    }
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#EF4444',
  },
  modalText: {
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.25rem',
    border: 'none',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmDeleteButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.25rem',
    border: 'none',
    backgroundColor: '#EF4444',
    color: 'white',
    fontWeight: '500',
    cursor: 'pointer',
  },

passwordForm: {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginTop: '1rem',
},
successMessage: {
  padding: '0.75rem',
  backgroundColor: '#DEF7EC',
  color: '#046C4E',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  marginTop: '0.5rem',
},
confirmButton: {
  backgroundColor: '#1E40AF',
  color: 'white',
  border: 'none',
  borderRadius: '0.375rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
},
  formSection: {
    marginTop: '2rem',
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#1E40AF',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '0.75rem',
  },
  modernAddressContainer: {
    display: 'flex',
    marginBottom: '1.5rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    transition: 'border-color 0.2s ease',
    '&:focus-within': {
      borderColor: '#1E40AF',
      boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.1)',
    },
  },
  addressIconContainer: {
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: '0.5rem 0 0 0.5rem',
  },
  addressInputContainer: {
    flex: 1,
    padding: '1rem 1rem 1rem 0',
  },
  modernLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: '0.25rem',
    display: 'block',
  },
  modernAddressInput: {
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
    color: '#111827',
    resize: 'vertical',
    minHeight: '80px',
    outline: 'none',
    fontFamily: 'inherit',
    padding: '0',
    lineHeight: '1.5',
  },
  contactRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  modernInputWrapper: {
    display: 'flex',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    transition: 'border-color 0.2s ease',
    '&:focus-within': {
      borderColor: '#1E40AF',
      boxShadow: '0 0 0 2px rgba(30, 64, 175, 0.1)',
    },
  },
  inputIconContainer: {
    padding: '0 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: '0.5rem 0 0 0.5rem',
  },
  inputContainer: {
    flex: 1,
    padding: '0.75rem 1rem 0.75rem 0',
  },
  modernInput: {
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
    color: '#111827',
    outline: 'none',
    padding: '0.25rem 0',
  },
};

export default EditPage;