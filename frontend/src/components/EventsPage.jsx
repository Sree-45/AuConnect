import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Filter, ChevronDown, Search, ExternalLink, Plus, Edit2, Trash2, X, Image, Upload } from 'lucide-react';
import NavBar from './NavBar';
import axios from 'axios';

const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('All');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [formError, setFormError] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    endDate: '',
    endTime: '',
    isDateRange: false,
    location: '',
    description: '',
    category: 'Academic',
    registrationUrl: '',
    photo: null
  });
  
  // Category management
  const [showCategoryManageModal, setShowCategoryManageModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categories = ['All', 'Academic', 'Cultural', 'Sports', 'Workshop', 'Conference', 'Seminar', 'Other'];
  const timeFrames = ['All', 'Today', 'Tomorrow', 'This Week', 'This Month', 'Past Events'];

  // API URL
  const API_URL = 'http://localhost:8080/api/events';
  const CATEGORIES_URL = 'http://localhost:8080/api/event-categories';

  // Check if current user is admin
  useEffect(() => {
    const username = localStorage.getItem('username');
    setIsAdmin(username === 'anurag_university');
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, selectedCategory, selectedTimeFrame]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      const eventsData = response.data;
      setEvents(eventsData);
      setFilteredEvents(eventsData);
      setError(null);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Apply time frame filter
    if (selectedTimeFrame !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        
        switch (selectedTimeFrame) {
          case 'Today':
            return eventDate.toDateString() === today.toDateString();
          case 'Tomorrow':
            return eventDate.toDateString() === tomorrow.toDateString();
          case 'This Week':
            return eventDate >= today && eventDate < nextWeek;
          case 'This Month':
            return eventDate >= today && eventDate < nextMonth;
          case 'Past Events':
            return eventDate < today;
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Academic':
        return '#3B82F6'; // blue
      case 'Cultural':
        return '#EC4899'; // pink
      case 'Sports':
        return '#10B981'; // green
      case 'Workshop':
        return '#F59E0B'; // amber
      case 'Conference':
        return '#8B5CF6'; // purple
      case 'Seminar':
        return '#6366F1'; // indigo
      default:
        return '#6B7280'; // gray
    }
  };
  
  // Admin functions
  const handleAddEvent = () => {
    setNewEvent({
      name: '',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      endDate: '',
      endTime: '',
      isDateRange: false,
      location: '',
      description: '',
      category: 'Academic',
      registrationUrl: '',
      photo: null
    });
    setShowAddModal(true);
  };
  
  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setNewEvent({
      name: event.name,
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time,
      location: event.location,
      description: event.description,
      category: event.category,
      registrationUrl: event.registrationUrl || '',
      photo: null
    });
    
    // Set photo preview if available
    if (event.photoUrl) {
      setPhotoPreview(event.photoUrl);
    } else {
      setPhotoPreview('');
    }
    
    setShowEditModal(true);
  };
  
  const handleDeleteEvent = (eventId) => {
    setShowDeleteConfirm(eventId);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveNewEvent = async () => {
    setIsUploading(true);
    try {
      // Create form data to send files
      const formData = new FormData();
      formData.append('name', newEvent.name);
      formData.append('date', newEvent.date);
      formData.append('time', newEvent.time);
      formData.append('location', newEvent.location);
      formData.append('description', newEvent.description);
      formData.append('category', newEvent.category);
      formData.append('registrationUrl', newEvent.registrationUrl);
      
      if (newEvent.photo) {
        formData.append('photo', newEvent.photo);
      }
      
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const addedEvent = response.data;
      setEvents(prev => [...prev, addedEvent]);
      setShowAddModal(false);
      
      // Reset states
      setPhotoPreview('');
      setFormError(null); // Use formError instead
    } catch (error) {
      console.error("Error creating event:", error);
      setFormError("Failed to create the event. Please try again."); // Use formError
    } finally {
      setIsUploading(false);
    }
  };
  
  const saveEditedEvent = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', newEvent.name);
      formData.append('date', newEvent.date);
      formData.append('time', newEvent.time);
      formData.append('location', newEvent.location);
      formData.append('description', newEvent.description);
      formData.append('category', newEvent.category);
      formData.append('registrationUrl', newEvent.registrationUrl);
      
      if (newEvent.photo) {
        formData.append('photo', newEvent.photo);
      }
      
      const response = await axios.put(`${API_URL}/${currentEvent.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const updatedEvent = response.data;
      setEvents(prev => prev.map(event => 
        event.id === currentEvent.id ? updatedEvent : event
      ));
      setShowEditModal(false);
      setCurrentEvent(null);
      
      // Reset states
      setPhotoPreview('');
      setError(null);
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update the event. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const confirmDeleteEvent = async (eventId) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${eventId}`);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete the event. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Category management
  const handleManageCategories = () => {
    setShowCategoryManageModal(true);
    setNewCategoryName('');
    setCategoryToEdit(null);
  };
  
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await axios.post(CATEGORIES_URL, { name: newCategoryName });
      // Refresh categories list
      fetchCategories();
      setNewCategoryName('');
    } catch (error) {
      console.error("Error adding category:", error);
      setError("Failed to add category. Please try again.");
    }
  };
  
  const handleEditCategory = (category) => {
    if (category === 'All') return;
    setCategoryToEdit(category);
    setNewCategoryName(category);
  };
  
  const handleUpdateCategory = async () => {
    if (!newCategoryName.trim() || !categoryToEdit) return;
    
    try {
      await axios.put(`${CATEGORIES_URL}/${categoryToEdit}`, { name: newCategoryName });
      // Update events with the old category to the new category
      const updatedEvents = events.map(event => {
        if (event.category === categoryToEdit) {
          return { ...event, category: newCategoryName };
        }
        return event;
      });
      setEvents(updatedEvents);
      
      // Refresh categories list
      fetchCategories();
      setNewCategoryName('');
      setCategoryToEdit(null);
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Failed to update category. Please try again.");
    }
  };
  
  const handleDeleteCategory = async (category) => {
    if (category === 'All') return;
    
    try {
      await axios.delete(`${CATEGORIES_URL}/${category}`);
      // Update events with this category to 'Other'
      const updatedEvents = events.map(event => {
        if (event.category === category) {
          return { ...event, category: 'Other' };
        }
        return event;
      });
      setEvents(updatedEvents);
      
      // Refresh categories list
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Failed to delete category. Please try again.");
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get(CATEGORIES_URL);
      // Update categories with the fetched data
      // We'll need to add 'All' manually as it's a special filter option
      setCategories(['All', ...response.data.map(cat => cat.name)]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fileInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Update the event state
    setNewEvent(prev => ({
      ...prev,
      photo: file
    }));
  };

  const handleViewDetails = (event) => {
    setViewingEvent(event);
  };

  const formatImageUrl = (url) => {
    if (!url) return null;
    
    if (url.startsWith('http')) return url;
    
    if (url.startsWith('/')) return `http://localhost:8080${url}`;
    
    return `http://localhost:8080/${url}`;
  };

  const isEventInPast = (eventDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDateObj = new Date(eventDate);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj < today;
  };
  
  return (
    <div style={styles.container}>
      <NavBar />
      
      <div style={styles.pageHeader}>
        <div style={styles.headerContent}>
          <h1 style={styles.pageTitle}>University Events</h1>
          <p style={styles.pageDescription}>
            Discover and participate in upcoming events at Anurag University
          </p>
        </div>
      </div>
      
      <div style={styles.contentContainer}>
        <div style={styles.filterContainer}>
          <div style={styles.searchBox}>
            <Search size={20} color="#6B7280" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.filtersGroup}>
            {/* Category Filter */}
            <div style={styles.filterDropdownContainer}>
              <div 
                style={styles.filterDropdown} 
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Filter size={16} color="#4B5563" />
                <span style={styles.filterLabel}>Category: {selectedCategory}</span>
                <ChevronDown size={16} color="#4B5563" />
              </div>
              
              {showCategoryDropdown && (
                <div style={styles.dropdownMenu}>
                  {categories.map(category => (
                    <div 
                      key={category} 
                      style={styles.dropdownItem}
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Time Frame Filter */}
            <div style={styles.filterDropdownContainer}>
              <div 
                style={styles.filterDropdown} 
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              >
                <Clock size={16} color="#4B5563" />
                <span style={styles.filterLabel}>Time: {selectedTimeFrame}</span>
                <ChevronDown size={16} color="#4B5563" />
              </div>
              
              {showTimeDropdown && (
                <div style={styles.dropdownMenu}>
                  {timeFrames.map(timeFrame => (
                    <div 
                      key={timeFrame} 
                      style={styles.dropdownItem}
                      onClick={() => {
                        setSelectedTimeFrame(timeFrame);
                        setShowTimeDropdown(false);
                      }}
                    >
                      {timeFrame}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Admin controls */}
            {isAdmin && (
              <div style={styles.adminControls}>
                <button 
                  onClick={handleAddEvent} 
                  style={styles.addButton}
                >
                  <Plus size={16} />
                  <span>Add Event</span>
                </button>
                
                <button 
                  onClick={handleManageCategories} 
                  style={styles.categoriesButton}
                >
                  <Filter size={16} />
                  <span>Manage Categories</span>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <p>{error}</p>
            <button 
              onClick={fetchEvents}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div style={styles.eventsGrid}>
            {filteredEvents.map(event => (
              <div key={event.id} style={styles.eventCard}>
                <div 
                  style={{
                    ...styles.categoryIndicator,
                    backgroundColor: getCategoryColor(event.category)
                  }}
                ></div>
                <div style={styles.eventContent}>
                  <div style={styles.eventHeader}>
                    <div style={styles.eventCategory}>{event.category}</div>
                    
                    {/* Admin event controls */}
                    {isAdmin && (
                      <div style={styles.eventAdminControls}>
                        <button 
                          onClick={() => handleEditEvent(event)}
                          style={styles.actionButton}
                        >
                          <Edit2 size={14} color="#4B5563" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(event.id)}
                          style={styles.actionButton}
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h3 style={styles.eventTitle}>{event.name}</h3>
                  
                  <div style={styles.eventDetails}>
                    <div style={styles.eventDetail}>
                      <Calendar size={16} color="#4B5563" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div style={styles.eventDetail}>
                      <Clock size={16} color="#4B5563" />
                      <span>{event.time}</span>
                    </div>
                    <div style={styles.eventDetail}>
                      <MapPin size={16} color="#4B5563" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  <p style={styles.eventDescription}>{event.description}</p>
                  
                  <div style={styles.eventActions}>
                    <button 
                      style={styles.detailsButton}
                      onClick={() => handleViewDetails(event)}
                    >
                      View Details
                    </button>
                    {!isEventInPast(event.date) && (
                      <a 
                        href={event.registrationUrl || '#'} 
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{...styles.registerButton, opacity: !event.registrationUrl ? 0.6 : 1}}
                        onClick={e => !event.registrationUrl && e.preventDefault()}
                        title={!event.registrationUrl ? "Registration link not available" : ""}
                      >
                        Register
                        <ExternalLink size={14} style={{marginLeft: '4px'}} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noResults}>
            <Calendar size={40} color="#9CA3AF" />
            <p>No events found matching your criteria.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedTimeFrame('All');
              }}
              style={styles.resetButton}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handlePhotoChange}
      />

      {/* Add Event Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalWithPhoto}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Event</h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setPhotoPreview('');
                }}
                style={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={styles.modalTwoColumnContent}>
              {/* Left column: Form fields */}
              <div style={styles.formColumn}>
                {formError && ( 
                  <div style={styles.formError}>
                    <span>{formError}</span>
                  </div>
                )}
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Event Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={newEvent.name} 
                    onChange={handleInputChange} 
                    style={styles.input}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  {/* Date range header - already on a single line */}
                  <div style={styles.dateRangeToggle}>
                    <label style={styles.label}>Date & Time *</label>
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        name="isDateRange"
                        checked={newEvent.isDateRange || false}
                        onChange={(e) => {
                          setNewEvent(prev => ({
                            ...prev,
                            isDateRange: e.target.checked,
                            endDate: prev.endDate || prev.date,
                            endTime: prev.endTime || prev.time
                          }));
                        }}
                      />
                      <span style={styles.checkboxText}>Date Range</span>
                    </label>
                  </div>

                  {/* All date/time inputs in one row */}
                  <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
                    <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                      <label style={styles.subLabel}>{newEvent.isDateRange ? "Start Date" : "Date"} *</label>
                      <input 
                        type="date" 
                        name="date" 
                        value={newEvent.date} 
                        onChange={handleInputChange} 
                        style={styles.input}
                        required
                      />
                    </div>
                    
                    <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                      <label style={styles.subLabel}>{newEvent.isDateRange ? "Start Time" : "Time"} *</label>
                      <input 
                        type="time" 
                        name="time" 
                        value={newEvent.time} 
                        onChange={handleInputChange} 
                        style={styles.input}
                        required
                      />
                    </div>
                    
                    {newEvent.isDateRange && (
                      <>
                        <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                          <label style={styles.subLabel}>End Date *</label>
                          <input 
                            type="date" 
                            name="endDate" 
                            value={newEvent.endDate || newEvent.date} 
                            onChange={handleInputChange} 
                            style={styles.input}
                            required
                          />
                        </div>
                        
                        <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                          <label style={styles.subLabel}>End Time *</label>
                          <input 
                            type="time" 
                            name="endTime" 
                            value={newEvent.endTime || newEvent.time} 
                            onChange={handleInputChange} 
                            style={styles.input}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location *</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={newEvent.location} 
                    onChange={handleInputChange} 
                    style={styles.input}
                    placeholder="Enter event location"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select 
                    name="category" 
                    value={newEvent.category} 
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    {categories.filter(cat => cat !== 'All').map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Registration URL</label>
                  <input 
                    type="url" 
                    name="registrationUrl" 
                    value={newEvent.registrationUrl} 
                    onChange={handleInputChange} 
                    style={styles.input}
                    placeholder="https://example.com/register"
                  />
                </div>
              </div>
              
              {/* Right column: Photo upload and description */}
              <div style={styles.photoColumn}>
                <div style={styles.photoUploadContainer}>
                  <div 
                    style={{
                      ...styles.photoPreview,
                      backgroundImage: photoPreview ? `url(${photoPreview})` : 'none'
                    }}
                    onClick={handlePhotoClick}
                  >
                    {!photoPreview && (
                      <div style={styles.photoPlaceholder}>
                        <Image size={40} color="#CBD5E1" />
                        <p style={styles.photoPlaceholderText}>Add Event Image</p>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    style={styles.uploadPhotoButton} 
                    onClick={handlePhotoClick}
                  >
                    <Upload size={16} />
                    <span>Upload Photo</span>
                  </button>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea 
                    name="description" 
                    value={newEvent.description} 
                    onChange={handleInputChange} 
                    style={styles.textarea}
                    placeholder="Enter event description"
                    rows={6}
                  />
                </div>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setPhotoPreview('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={saveNewEvent}
                style={styles.saveButton}
                disabled={!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location || !newEvent.category || isUploading}
              >
                {isUploading ? 'Saving...' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Event Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalWithPhoto}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Event</h3>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setPhotoPreview('');
                }}
                style={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={styles.modalTwoColumnContent}>
              {/* Left column: Form fields */}
              <div style={styles.formColumn}>
                {formError && ( // Use formError instead of error
                  <div style={styles.formError}>
                    <span>{formError}</span>
                  </div>
                )}
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Event Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={newEvent.name} 
                    onChange={handleInputChange} 
                    style={styles.input}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  {/* Date range header - already on a single line */}
                  <div style={styles.dateRangeToggle}>
                    <label style={styles.label}>Date & Time *</label>
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        name="isDateRange"
                        checked={newEvent.isDateRange || false}
                        onChange={(e) => {
                          setNewEvent(prev => ({
                            ...prev,
                            isDateRange: e.target.checked,
                            endDate: prev.endDate || prev.date,
                            endTime: prev.endTime || prev.time
                          }));
                        }}
                      />
                      <span style={styles.checkboxText}>Date Range</span>
                    </label>
                  </div>

                  {/* All date/time inputs in one row */}
                  <div style={{display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
                    <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                      <label style={styles.subLabel}>{newEvent.isDateRange ? "Start Date" : "Date"} *</label>
                      <input 
                        type="date" 
                        name="date" 
                        value={newEvent.date} 
                        onChange={handleInputChange} 
                        style={styles.input}
                        required
                      />
                    </div>
                    
                    <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                      <label style={styles.subLabel}>{newEvent.isDateRange ? "Start Time" : "Time"} *</label>
                      <input 
                        type="time" 
                        name="time" 
                        value={newEvent.time} 
                        onChange={handleInputChange} 
                        style={styles.input}
                        required
                      />
                    </div>
                    
                    {newEvent.isDateRange && (
                      <>
                        <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                          <label style={styles.subLabel}>End Date *</label>
                          <input 
                            type="date" 
                            name="endDate" 
                            value={newEvent.endDate || newEvent.date} 
                            onChange={handleInputChange} 
                            style={styles.input}
                            required
                          />
                        </div>
                        
                        <div style={{...styles.dateTimeGroup, minWidth: '140px'}}>
                          <label style={styles.subLabel}>End Time *</label>
                          <input 
                            type="time" 
                            name="endTime" 
                            value={newEvent.endTime || newEvent.time} 
                            onChange={handleInputChange} 
                            style={styles.input}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Location *</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={newEvent.location} 
                    onChange={handleInputChange} 
                    style={styles.input}
                    placeholder="Enter event location"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select 
                    name="category" 
                    value={newEvent.category} 
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    {categories.filter(cat => cat !== 'All').map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Registration URL</label>
                  <input 
                    type="url" 
                    name="registrationUrl" 
                    value={newEvent.registrationUrl} 
                    onChange={handleInputChange}
                    style={styles.input}
                    placeholder="Enter registration URL"
                  />
                </div>
              </div>
              
              {/* Right column: Photo upload and description */}
              <div style={styles.photoColumn}>
                <div style={styles.photoUploadContainer}>
                  <div 
                    style={{
                      ...styles.photoPreview,
                      backgroundImage: photoPreview ? `url(${photoPreview})` : 'none'
                    }}
                    onClick={handlePhotoClick}
                  >
                    {!photoPreview && (
                      <div style={styles.photoPlaceholder}>
                        <Image size={40} color="#CBD5E1" />
                        <p style={styles.photoPlaceholderText}>Add Event Image</p>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    style={styles.uploadPhotoButton} 
                    onClick={handlePhotoClick}
                  >
                    <Upload size={16} />
                    <span>Upload Photo</span>
                  </button>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea 
                    name="description" 
                    value={newEvent.description} 
                    onChange={handleInputChange} 
                    style={styles.textarea}
                    placeholder="Enter event description"
                    rows={6}
                  />
                </div>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setPhotoPreview('');
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={saveEditedEvent}
                style={styles.saveButton}
                disabled={!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location || isUploading}
              >
                {isUploading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Delete</h3>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                style={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            <div style={styles.modalContent}>
              <p style={styles.confirmText}>
                Are you sure you want to delete this event? This action cannot be undone.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={() => confirmDeleteEvent(showDeleteConfirm)}
                style={styles.deleteButton}
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal - Matching Faculty Directory style */}
      {showCategoryManageModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, maxWidth: '500px'}}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Manage Categories</h3>
              <button style={styles.closeButton} onClick={() => setShowCategoryManageModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.departmentAddForm}>
                <div style={styles.inputWithIcon}>
                  <input
                    type="text"
                    placeholder="Category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={styles.input}
                  />
                  {categoryToEdit && (
                    <span style={styles.editingIndicator}>Editing: {categoryToEdit}</span>
                  )}
                </div>
                <button 
                  onClick={categoryToEdit ? handleUpdateCategory : handleAddCategory}
                  style={{
                    ...styles.deptActionButton, 
                    opacity: !newCategoryName.trim() ? 0.7 : 1,
                    backgroundColor: categoryToEdit ? '#10B981' : '#1E40AF'
                  }}
                  disabled={!newCategoryName.trim()}
                >
                  {categoryToEdit ? 'Update' : 'Add'}
                </button>
              </div>
              
              <div style={styles.departmentList}>
                <h4 style={styles.departmentListTitle}>Current Categories</h4>
                {categories.filter(category => category !== 'All').length > 0 ? (
                  categories.filter(category => category !== 'All').map(category => (
                    <div key={category} style={styles.departmentItem}>
                      <span style={styles.departmentName}>{category}</span>
                      <div style={styles.departmentActions}>
                        <button
                          onClick={() => handleEditCategory(category)}
                          style={styles.deptEditButton}
                          title="Edit category"
                          disabled={category === 'Other'}
                        >
                          <Edit2 size={16} color={category === 'Other' ? "#9CA3AF" : "#1E40AF"} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          style={styles.deptDeleteButton}
                          title="Delete category"
                          disabled={category === 'Other'}
                        >
                          <Trash2 size={16} color={category === 'Other' ? "#9CA3AF" : "#EF4444"} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.noDepartmentsMessage}>
                    <p>No categories added yet.</p>
                    <p style={styles.helpText}>Add your first category using the form above</p>
                  </div>
                )}
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button style={styles.cancelButton} onClick={() => setShowCategoryManageModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingEvent && (
        <div style={styles.modalOverlay}>
          <div style={styles.detailsModal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{viewingEvent.name}</h3>
              <button 
                onClick={() => setViewingEvent(null)}
                style={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={styles.detailsModalContent}>
              <div style={styles.detailsColumn}>
                <div style={{...styles.eventCategory, marginBottom: '1rem'}}>
                  {viewingEvent.category}
                </div>
                
                <div style={styles.eventDetailItem}>
                  <Calendar size={18} color="#4B5563" />
                  <div>
                    <strong>Date:</strong> {new Date(viewingEvent.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                
                <div style={styles.eventDetailItem}>
                  <Clock size={18} color="#4B5563" />
                  <div>
                    <strong>Time:</strong> {viewingEvent.time}
                    {viewingEvent.endTime && ` - ${viewingEvent.endTime}`}
                  </div>
                </div>
                
                <div style={styles.eventDetailItem}>
                  <MapPin size={18} color="#4B5563" />
                  <div>
                    <strong>Location:</strong> {viewingEvent.location}
                  </div>
                </div>
                
                <div style={styles.eventDetailDescription}>
                  <h4 style={styles.detailSectionTitle}>About This Event</h4>
                  <p>{viewingEvent.description}</p>
                </div>
                
                <div style={styles.detailsActionButtons}>
                  {!isEventInPast(viewingEvent.date) && (
                    <a 
                      href={viewingEvent.registrationUrl || '#'} 
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        ...styles.registerButton, 
                        padding: '0.75rem 1.5rem',
                        opacity: !viewingEvent.registrationUrl ? 0.6 : 1
                      }}
                      onClick={e => !viewingEvent.registrationUrl && e.preventDefault()}
                      title={!viewingEvent.registrationUrl ? "Registration link not available" : ""}
                    >
                      Register Now
                      <ExternalLink size={16} style={{marginLeft: '8px'}} />
                    </a>
                  )}
                </div>
              </div>
              
              <div style={styles.imageColumn}>
                {viewingEvent.photoUrl ? (
                  <img 
                    src={formatImageUrl(viewingEvent.photoUrl)}
                    alt={viewingEvent.name} 
                    style={styles.detailsEventImage}
                    onError={(e) => {
                      console.error("Failed to load image:", viewingEvent.photoUrl);
                      e.target.onerror = null;
                      e.target.src = '/assets/placeholder-profile.png';
                    }}
                  />
                ) : (
                  <div style={styles.detailsNoImage}>
                    <Calendar size={64} color="#CBD5E1" />
                    <p style={{color: '#64748B', marginTop: '1rem'}}>No image available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
  },
  pageHeader: {
    backgroundColor: '#F9FAFB',
    padding: '2rem 0',
    borderBottom: '1px solid #E5E7EB',
    marginTop: '60px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  pageTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    margin: '0',
    color: '#111827',
  },
  pageDescription: {
    fontSize: '1rem',
    color: '#6B7280',
    margin: '0.5rem 0 0 0',
  },
  contentContainer: {
    maxWidth: '1200px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    marginBottom: '1rem',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    flexGrow: 1,
    marginLeft: '0.75rem',
    fontSize: '0.875rem',
    color: '#111827',
  },
  filtersGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  filterDropdownContainer: {
    position: 'relative',
    minWidth: '200px',
  },
  filterDropdown: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
  },
  filterLabel: {
    fontSize: '0.875rem',
    color: '#111827',
    flexGrow: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    left: 0,
    backgroundColor: 'white',
    width: '100%',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 10,
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #E5E7EB',
  },
  dropdownItem: {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: '#111827',
    borderBottom: '1px solid #F3F4F6',
    '&:hover': {
      backgroundColor: '#F9FAFB',
    },
  },
  eventsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  eventCard: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #E5E7EB',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
  categoryIndicator: {
    width: '6px',
    flexShrink: 0,
  },
  eventContent: {
    padding: '1.5rem',
    flexGrow: 1,
  },

  eventCategory: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    marginBottom: '0.75rem',
  },

  actionButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  eventTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1rem',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  eventDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#4B5563',
    fontSize: '0.875rem',
  },
  eventDescription: {
    fontSize: '0.875rem',
  color: '#4B5563',
  marginBottom: '1.5rem',
  lineHeight: '1.5',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxHeight: '2.625rem',
  },
  eventActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: 'auto',
  },
  registerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#1E3A8A',
    },
  },
  detailsButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: 'white',
    color: '#1E40AF',
    border: '1px solid #1E40AF',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
    '&:hover': {
      backgroundColor: '#EFF6FF',
    },
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    color: '#6B7280',
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
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '3rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    color: '#DC2626',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
  },
  noResults: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    color: '#6B7280',
  },
  resetButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
  },
 
 
 

  modal: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  
  select: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    color: '#111827',
    outline: 'none',
    '&:focus': {
      borderColor: '#3B82F6',
    },
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    color: '#111827',
    outline: 'none',
    '&:focus': {
      borderColor: '#3B82F6',
    },
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #E5E7EB',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#F3F4F6',
    color: '#111827',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  saveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
  },
  formError: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '0.75rem 1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
  },
  confirmDialog: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    padding: '1.5rem',
    textAlign: 'center',
  },
  confirmTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1rem',
  },
  confirmMessage: {
    fontSize: '0.875rem',
    color: '#4B5563',
    marginBottom: '1.5rem',
  },
  confirmButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },

  // Admin control styles
  adminControls: {
    display: 'flex',
    gap: '0.75rem',
    marginLeft: 'auto',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#',
    },
  },
  categoriesButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: 'white',
    color: '#1E40AF',
    border: '1px solid #1E40AF',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#EFF6FF',
    },
  },

  // Event card admin controls
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  eventAdminControls: {
    display: 'flex',
    gap: '0.5rem',
  },
 

  // Modal styles
  // Modal common styles - add these
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    color: '#6B7280',
    '&:hover': {
      backgroundColor: '#F3F4F6',
    },
  },
  modalContent: {
    padding: '1.5rem',
  },
  modalBody: {
    padding: '1.5rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    color: '#111827',
    outline: 'none',
    '&:focus': {
      borderColor: '#3B82F6',
    },
  },
  formGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#DC2626',
    color: 'white',
    borderRadius: '0.375rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
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
  confirmModal: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
 
  confirmText: {
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: '#4B5563',
    margin: '0',
  },
  
  // Category management specific styles
  inputWithButton: {
    display: 'flex',
    gap: '0.75rem',
  },
  inputInline: {
    flexGrow: 1,
    padding: '0.625rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    color: '#111827',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
 

  categoriesList: {
    marginTop: '1.5rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.375rem',
  },
  categoriesListTitle: {
    margin: 0,
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #E5E7EB',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },


  categoryName: {
    fontSize: '0.875rem',
    color: '#111827',
  },
  categoryActions: {
    display: 'flex',
    gap: '0.5rem',
  },

  // Category management specific styles
  departmentAddForm: {
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  inputWithIcon: {
    position: 'relative',
    flexGrow: 1,
  },
  editingIndicator: {
    fontSize: '0.75rem',
    color: '#059669',
    display: 'block',
    marginTop: '0.25rem',
  },
  deptActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.625rem 1rem',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    height: '2.5rem',
    whiteSpace: 'nowrap',
  },
  departmentList: {
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  },
  departmentListTitle: {
    margin: '0',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  departmentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #E5E7EB',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  departmentName: {
    fontSize: '0.875rem',
    color: '#111827',
  },
  departmentActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  deptEditButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    '&:hover': {
      backgroundColor: '#EFF6FF',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  deptDeleteButton: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    '&:hover': {
      backgroundColor: '#FEE2E2',
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  noDepartmentsMessage: {
    padding: '1.5rem',
    textAlign: 'center',
    color: '#6B7280',
  },
  helpText: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginTop: '0.5rem',
  },
  // New modal with photo styles
  modalWithPhoto: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '850px', // Wider to accommodate two columns
    maxHeight: '80vh', // Reduced height to prevent going below navbar
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    position: 'relative',
    top: '1rem', // Move it down slightly from top to ensure visibility
  },
  modalTwoColumnContent: {
    display: 'flex',
    flexDirection: 'row',
    padding: '1.5rem',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  formColumn: {
    flex: '1 1 350px',
  },
  photoColumn: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  photoUploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: '16/11',
    backgroundColor: '#F1F5F9',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px dashed #CBD5E1',
  },
  photoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  photoPlaceholderText: {
    color: '#64748B',
    fontSize: '0.875rem',
    marginTop: '0.5rem',
  },
  uploadPhotoButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#F1F5F9',
    color: '#334155',
    border: '1px solid #CBD5E1',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#E2E8F0',
    },
  },
  dateRangeToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: '0.5rem',
    flexWrap: 'nowrap',
  },
  dateTimeRow: {
    display: 'flex',
    gap: '1rem',
  },
  dateTimeGroup: {
    flex: 1,
  },
  subLabel: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    marginRight: '1rem',
    whiteSpace: 'nowrap',
  },
  checkboxText: {
    fontSize: '0.875rem',
    color: '#4B5563',
    marginLeft: '0.5rem',

  },
  detailsModal: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '800px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  detailsModalContent: {
    display: 'flex',
    flexDirection: 'row',
    padding: '1.5rem',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  detailsColumn: {
    flex: '1 1 400px',
  },
  eventDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
    color: '#4B5563',
    fontSize: '0.875rem',
  },
  eventDetailDescription: {
    marginTop: '1.5rem',
  },
  detailSectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.75rem',
  },
  detailsActionButtons: {
    marginTop: '2rem',
  },
  imageColumn: {
    flex: '1 1 300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsEventImage: {
    width: '100%',
    borderRadius: '0.5rem',
    objectFit: 'cover',
  },
  detailsNoImage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: '0.5rem',
    padding: '2rem',
    textAlign: 'center',
  },
};

export default EventsPage;