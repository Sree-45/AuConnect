import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Download, Filter, ChevronDown, Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './NavBar';

const AcademicCalendar = () => {
  const navigate = useNavigate();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Admin management states
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    event: '',
    date: '',
    category: 'Academic',
    description: ''
  });

  // API URL
  const API_URL = 'http://localhost:8080/api/calendar';

  // Enhanced date handling for event forms
  const [dateRange, setDateRange] = useState({
    startMonth: new Date().getMonth(),
    startYear: new Date().getFullYear(),
    startDay: 1,
    endMonth: new Date().getMonth(),
    endYear: new Date().getFullYear(),
    endDay: 1,
    isRange: false,
    includeDay: false
  });

  // Check if current user is admin (anurag_university)
  useEffect(() => {
    const username = localStorage.getItem('username');
    setIsAdmin(username === 'anurag_university');
  }, []);

  // Fetch calendar events from the backend
  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_URL);
        const data = response.data;
        
        // Transform data if needed
        const transformedData = data.map(event => ({
          id: event.id,
          event: event.event,
          date: event.date,
          category: event.category,
          description: event.description
        }));
        
        setCalendarEvents(transformedData);
        setFilteredEvents(transformedData);
        setError(null);
      } catch (error) {
        console.error("Error fetching academic calendar data:", error);
        setError("Failed to load calendar events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  // Filter events when filter criteria change
  useEffect(() => {
    let results = [...calendarEvents];
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      results = results.filter(event => event.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(event => 
        event.event.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by date - adapted to handle the new date format
    results.sort((a, b) => {
      const dateA = getDateForSorting(a.date);
      const dateB = getDateForSorting(b.date);
      return dateA - dateB;
    });
    
    setFilteredEvents(results);
  }, [selectedCategory, searchTerm, calendarEvents]);

  // Helper function to parse dates for sorting
  const getDateForSorting = (dateString) => {
    if (dateString.includes('-')) {
      const startDate = dateString.split('-')[0].trim();
      return new Date(startDate);
    }
    return new Date(dateString);
  };

  const getCategories = () => {
    const categories = ['All', ...new Set(calendarEvents.map(event => event.category))];
    return categories;
  };

  const handlePrintCalendar = () => {
    window.print();
  };

  // Group events by month and year
  const groupEventsByDate = () => {
    const groupedEvents = {};
    
    filteredEvents.forEach(event => {
      const date = getDateForSorting(event.date);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!groupedEvents[monthYear]) {
        groupedEvents[monthYear] = [];
      }
      groupedEvents[monthYear].push(event);
    });
    
    // Sort the month-year keys chronologically
    const sortedMonthYears = Object.keys(groupedEvents).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA - dateB;
    });
    
    // Create a new object with sorted keys
    const sortedGroupedEvents = {};
    sortedMonthYears.forEach(key => {
      sortedGroupedEvents[key] = groupedEvents[key];
    });
    
    return sortedGroupedEvents;
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Academic':
        return '#1E40AF'; // Blue
      case 'Examination':
        return '#DC2626'; // Red
      case 'Holiday':
        return '#9333EA'; // Purple
      case 'Event':
        return '#047857'; // Green
      case 'Administrative':
        return '#D97706'; // Amber
      default:
        return '#6B7280'; // Gray
    }
  };

  const handleAddEvent = () => {
    setShowAddModal(true);
    setNewEvent({
      event: '',
      date: '',
      category: 'Academic',
      description: ''
    });
    
    setDateRange({
      startMonth: new Date().getMonth(),
      startYear: new Date().getFullYear(),
      startDay: 1,
      endMonth: new Date().getMonth(),
      endYear: new Date().getFullYear(),
      endDay: 1,
      isRange: false,
      includeDay: false
    });
  };

  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setNewEvent({
      event: event.event,
      date: event.date,
      category: event.category,
      description: event.description
    });
    
    // Parse the existing date string into component parts
    setDateRange(parseDateString(event.date));
    
    setShowEditModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    setShowDeleteConfirm(eventId);
  };

  const confirmDeleteEvent = async (eventId) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${eventId}`);
      
      // Update local state
      const updatedEvents = calendarEvents.filter(event => event.id !== eventId);
      setCalendarEvents(updatedEvents);
      setFilteredEvents(updatedEvents);
      setError(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete the event. Please try again.");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('date')) {
      // Date field handling
      const dateField = name.split('.')[1];
      
      setDateRange(prev => ({
        ...prev,
        [dateField]: dateField === 'isRange' || dateField === 'includeDay' ? checked : parseInt(value, 10)
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  useEffect(() => {
    const formattedDate = formatDateFromSelections();
    setNewEvent(prev => ({
      ...prev,
      date: formattedDate
    }));
  }, [dateRange]); 

  const saveNewEvent = async () => {
    console.log("saveNewEvent function called"); 
    setLoading(true);
    try {
      console.log("Sending new event data:", newEvent);
      
      const response = await axios.post(API_URL, newEvent);
      console.log("Server response:", response.data);
      
      const createdEvent = response.data;
      const updatedEvents = [...calendarEvents, createdEvent];
      
      setCalendarEvents(updatedEvents);
      setFilteredEvents(updatedEvents);
      setError(null);
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating event:", error);
      // More detailed error logging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        setError(`Failed to create event: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        console.error("Request was made but no response received");
        setError("Network error - no response from server");
      } else {
        console.error("Error message:", error.message);
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveEditedEvent = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/${currentEvent.id}`, newEvent);
      
      const updatedEvent = response.data;
      const updatedEvents = calendarEvents.map(event => 
        event.id === currentEvent.id ? updatedEvent : event
      );
      
      setCalendarEvents(updatedEvents);
      setFilteredEvents(updatedEvents);
      setError(null);
      setShowEditModal(false);
      setCurrentEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update the event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format the selected date values into a proper string
  const formatDateFromSelections = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const { 
      startMonth, startYear, startDay, 
      endMonth, endYear, endDay, 
      isRange, includeDay 
    } = dateRange;
    
    // Create start date string
    let dateStr = `${months[startMonth]} ${includeDay ? startDay + ', ' : ''}${startYear}`;
    
    // Add end date if it's a range
    if (isRange) {
      dateStr += ` - ${months[endMonth]} ${includeDay ? endDay + ', ' : ''}${endYear}`;
    }
    
    return dateStr;
  };

  // Parse a date string into component parts for the form
  const parseDateString = (dateString) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const parsed = {
      startMonth: new Date().getMonth(),
      startYear: new Date().getFullYear(),
      startDay: 1,
      endMonth: new Date().getMonth(),
      endYear: new Date().getFullYear(),
      endDay: 1,
      isRange: dateString.includes('-'),
      includeDay: /\d+,/.test(dateString)
    };
    
    try {
      if (parsed.isRange) {
        const [startDate, endDate] = dateString.split('-').map(d => d.trim());
        
        // Parse start date
        const startParts = startDate.split(' ');
        parsed.startMonth = months.indexOf(startParts[0]);
        
        if (parsed.includeDay) {
          // Format: "Month Day, Year"
          parsed.startDay = parseInt(startParts[1].replace(',', ''));
          parsed.startYear = parseInt(startParts[2]);
        } else {
          // Format: "Month Year"
          parsed.startYear = parseInt(startParts[1]);
        }
        
        // Parse end date
        const endParts = endDate.split(' ');
        parsed.endMonth = months.indexOf(endParts[0]);
        
        if (parsed.includeDay) {
          // Format: "Month Day, Year"
          parsed.endDay = parseInt(endParts[1].replace(',', ''));
          parsed.endYear = parseInt(endParts[2]);
        } else {
          // Format: "Month Year"
          parsed.endYear = parseInt(endParts[1]);
        }
      } else {
        // Single date
        const dateParts = dateString.split(' ');
        parsed.startMonth = months.indexOf(dateParts[0]);
        
        if (parsed.includeDay) {
          // Format: "Month Day, Year"
          parsed.startDay = parseInt(dateParts[1].replace(',', ''));
          parsed.startYear = parseInt(dateParts[2]);
        } else {
          // Format: "Month Year"
          parsed.startYear = parseInt(dateParts[1]);
        }
      }
    } catch (error) {
      console.error("Error parsing date string:", error);
    }
    
    return parsed;
  };

  // Generate year options for select dropdowns
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  };

  // Generate day options for select dropdowns
  const getDayOptions = (month, year) => {
    // Get the number of days in the selected month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  return (
    <div style={styles.container}>
      <NavBar />
      
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div style={styles.pageHeader}>
        <div style={styles.headerContent}>
          <button 
            onClick={() => navigate('/university')} 
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#4B5563" />
            <span>Back to University</span>
          </button>
          <h1 style={styles.pageTitle}>Academic Calendar 2022-2023</h1>
          <p style={styles.pageDescription}>
            B.Tech Academic Calendar - Plan your academic year with Anurag University's official calendar
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
                  {getCategories().map(category => (
                    <div 
                      key={category} 
                      style={{
                        ...styles.dropdownItem,
                        backgroundColor: selectedCategory === category ? '#F3F4F6' : 'transparent',
                        fontWeight: selectedCategory === category ? '500' : 'normal',
                      }}
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
            
            <button 
              style={styles.printButton}
              onClick={handlePrintCalendar}
            >
              <Download size={16} />
              <span>Download PDF</span>
            </button>

            {isAdmin && (
              <button 
                style={styles.addButton}
                onClick={handleAddEvent}
              >
                <Plus size={16} />
                <span>Add Event</span>
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading academic calendar...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div style={styles.calendarContainer}>
            {/* Category Legend */}
            <div style={styles.categoryLegend}>
              <h3 style={styles.legendTitle}>Category Legend:</h3>
              <div style={styles.legendItems}>
                {getCategories().filter(cat => cat !== 'All').map(category => (
                  <div key={category} style={styles.legendItem}>
                    <span 
                      style={{
                        ...styles.categoryDot,
                        backgroundColor: getCategoryColor(category)
                      }}
                    ></span>
                    <span style={styles.categoryName}>{category}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Calendar Events by Month and Year */}
            {Object.entries(groupEventsByDate()).map(([monthYear, events]) => (
              <div key={monthYear} style={styles.monthSection}>
                <h2 style={styles.monthTitle}>{monthYear}</h2>
                <div style={styles.eventsList}>
                  {events.map(event => (
                    <div key={event.id} style={styles.eventCard}>
                      <div 
                        style={{
                          ...styles.categoryIndicator,
                          backgroundColor: getCategoryColor(event.category)
                        }}
                      ></div>
                      <div style={styles.eventContent}>
                        <div style={styles.eventHeader}>
                          <h3 style={styles.eventName}>{event.event}</h3>
                          <div style={styles.eventActions}>
                            <span style={styles.eventCategoryTag}>{event.category}</span>
                            
                            {/* Admin controls */}
                            {isAdmin && (
                              <div style={styles.adminControls}>
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
                        </div>
                        <div style={styles.eventDate}>
                          <Calendar size={16} color="#4B5563" />
                          <span>{event.date}</span>
                        </div>
                        <p style={styles.eventDescription}>{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noResults}>
            <Calendar size={40} color="#9CA3AF" />
            <p>No events found matching your search criteria.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              style={styles.resetButton}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Event</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            <div style={styles.modalContent}>
              {/* Add this at the top of the modal content */}
              {error && (
                <div style={styles.formError}>
                  <span>{error}</span>
                </div>
              )}
              
              {/* Event Name field remains the same */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Name *</label>
                <input 
                  type="text" 
                  name="event" 
                  value={newEvent.event} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  placeholder="e.g. Final Examination"
                  required
                />
              </div>
              
              {/* Replace the date field with structured date selectors */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Date *</label>
                <div style={styles.datePickerContainer}>
                  <div style={styles.dateSelectRow}>
                    <div style={styles.dateSelectGroup}>
                      <select 
                        name="date.startMonth" 
                        value={dateRange.startMonth}
                        onChange={handleInputChange}
                        style={styles.dateSelect}
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      
                      {dateRange.includeDay && (
                        <select 
                          name="date.startDay" 
                          value={dateRange.startDay}
                          onChange={handleInputChange}
                          style={styles.daySelect}
                        >
                          {getDayOptions(dateRange.startMonth, dateRange.startYear).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      )}
                      
                      <select 
                        name="date.startYear" 
                        value={dateRange.startYear}
                        onChange={handleInputChange}
                        style={styles.yearSelect}
                      >
                        {getYearOptions().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Date range option */}
                  <div style={styles.dateOptionRow}>
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox"
                        name="date.includeDay"
                        checked={dateRange.includeDay}
                        onChange={handleInputChange}
                      />
                      <span style={styles.checkboxText}>Include day</span>
                    </label>
                    
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox"
                        name="date.isRange"
                        checked={dateRange.isRange}
                        onChange={handleInputChange}
                      />
                      <span style={styles.checkboxText}>Date range</span>
                    </label>
                  </div>
                  
                  {/* End date (only shown for date ranges) */}
                  {dateRange.isRange && (
                    <div style={styles.dateSelectRow}>
                      <div style={{...styles.dateSelectGroup, marginTop: '0.5rem'}}>
                        <label style={styles.endDateLabel}>End date:</label>
                        <select 
                          name="date.endMonth" 
                          value={dateRange.endMonth}
                          onChange={handleInputChange}
                          style={styles.dateSelect}
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ].map((month, index) => (
                            <option key={month} value={index}>{month}</option>
                          ))}
                        </select>
                        
                        {dateRange.includeDay && (
                          <select 
                            name="date.endDay" 
                            value={dateRange.endDay}
                            onChange={handleInputChange}
                            style={styles.daySelect}
                          >
                            {getDayOptions(dateRange.endMonth, dateRange.endYear).map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        )}
                        
                        <select 
                          name="date.endYear" 
                          value={dateRange.endYear}
                          onChange={handleInputChange}
                          style={styles.yearSelect}
                        >
                          {getYearOptions().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {/* Preview of the formatted date */}
                  <div style={styles.datePreview}>
                    <span style={styles.previewLabel}>Preview: </span>
                    <span style={styles.previewValue}>{formatDateFromSelections()}</span>
                  </div>
                </div>
              </div>
              
              {/* The rest of your form remains unchanged */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Category *</label>
                <select 
                  name="category" 
                  value={newEvent.category} 
                  onChange={handleInputChange}
                  style={styles.select}
                  required
                >
                  <option value="Academic">Academic</option>
                  <option value="Examination">Examination</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Event">Event</option>
                  <option value="Administrative">Administrative</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea 
                  name="description" 
                  value={newEvent.description} 
                  onChange={handleInputChange} 
                  style={styles.textarea}
                  placeholder="Brief description of the event"
                  rows={3}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowAddModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={saveNewEvent}
                style={styles.saveButton}
                disabled={!newEvent.event || !newEvent.date || !newEvent.category}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Event</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            <div style={styles.modalContent}>
              {/* Add this at the top of the modal content */}
              {error && (
                <div style={styles.formError}>
                  <span>{error}</span>
                </div>
              )}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Name *</label>
                <input 
                  type="text" 
                  name="event" 
                  value={newEvent.event} 
                  onChange={handleInputChange} 
                  style={styles.input}
                  required
                />
              </div>
              
              {/* Date picker - same as in Add Event modal */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Date *</label>
                <div style={styles.datePickerContainer}>
                  <div style={styles.dateSelectRow}>
                    <div style={styles.dateSelectGroup}>
                      <select 
                        name="date.startMonth" 
                        value={dateRange.startMonth}
                        onChange={handleInputChange}
                        style={styles.dateSelect}
                      >
                        {['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      
                      {dateRange.includeDay && (
                        <select 
                          name="date.startDay" 
                          value={dateRange.startDay}
                          onChange={handleInputChange}
                          style={styles.daySelect}
                        >
                          {getDayOptions(dateRange.startMonth, dateRange.startYear).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      )}
                      
                      <select 
                        name="date.startYear" 
                        value={dateRange.startYear}
                        onChange={handleInputChange}
                        style={styles.yearSelect}
                      >
                        {getYearOptions().map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Date range option */}
                  <div style={styles.dateOptionRow}>
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox"
                        name="date.includeDay"
                        checked={dateRange.includeDay}
                        onChange={handleInputChange}
                      />
                      <span style={styles.checkboxText}>Include day</span>
                    </label>
                    
                    <label style={styles.checkboxLabel}>
                      <input 
                        type="checkbox"
                        name="date.isRange"
                        checked={dateRange.isRange}
                        onChange={handleInputChange}
                      />
                      <span style={styles.checkboxText}>Date range</span>
                    </label>
                  </div>
                  
                  {/* End date (only shown for date ranges) */}
                  {dateRange.isRange && (
                    <div style={styles.dateSelectRow}>
                      <div style={{...styles.dateSelectGroup, marginTop: '0.5rem'}}>
                        <label style={styles.endDateLabel}>End date:</label>
                        <select 
                          name="date.endMonth" 
                          value={dateRange.endMonth}
                          onChange={handleInputChange}
                          style={styles.dateSelect}
                        >
                          {['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ].map((month, index) => (
                            <option key={month} value={index}>{month}</option>
                          ))}
                        </select>
                        
                        {dateRange.includeDay && (
                          <select 
                            name="date.endDay" 
                            value={dateRange.endDay}
                            onChange={handleInputChange}
                            style={styles.daySelect}
                          >
                            {getDayOptions(dateRange.endMonth, dateRange.endYear).map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        )}
                        
                        <select 
                          name="date.endYear" 
                          value={dateRange.endYear}
                          onChange={handleInputChange}
                          style={styles.yearSelect}
                        >
                          {getYearOptions().map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {/* Preview of the formatted date */}
                  <div style={styles.datePreview}>
                    <span style={styles.previewLabel}>Preview: </span>
                    <span style={styles.previewValue}>{formatDateFromSelections()}</span>
                  </div>
                </div>
              </div>
              
              {/* The rest of your form remains unchanged */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Category *</label>
                <select 
                  name="category" 
                  value={newEvent.category} 
                  onChange={handleInputChange}
                  style={styles.select}
                  required
                >
                  <option value="Academic">Academic</option>
                  <option value="Examination">Examination</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Event">Event</option>
                  <option value="Administrative">Administrative</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea 
                  name="description" 
                  value={newEvent.description} 
                  onChange={handleInputChange} 
                  style={styles.textarea}
                  rows={3}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowEditModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={saveEditedEvent}
                style={styles.saveButton}
                disabled={!newEvent.event || !newEvent.date || !newEvent.category}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmDialog}>
            <h4 style={styles.confirmTitle}>Delete Event</h4>
            <p style={styles.confirmMessage}>
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div style={styles.confirmButtons}>
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
                Delete
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
  },
  pageHeader: {
    backgroundColor: '#F9FAFB',
    padding: '2rem 0',
    borderBottom: '1px solid #E5E7EB',
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
    color: '#4B5563',
    cursor: 'pointer',
    padding: '0.5rem 0',
    marginBottom: '1rem',
    fontSize: '0.875rem',
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
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1rem',
    border: '1px solid #E5E7EB',
    borderRadius: '0.5rem',
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: '1',
    border: 'none',
    padding: '0.75rem 0',
    fontSize: '0.875rem',
    backgroundColor: 'transparent',
    outline: 'none',
  },
  filtersGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
  },
  filterDropdownContainer: {
    position: 'relative',
  },
  filterDropdown: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    backgroundColor: '#F9FAFB',
  },
  filterLabel: {
    fontSize: '0.875rem',
    color: '#4B5563',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: '0',
    width: '100%',
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '0.375rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    zIndex: '10',
    marginTop: '0.5rem',
  },
  dropdownItem: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    borderBottom: '1px solid #F3F4F6',
  },
  printButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 0',
  },
  // Add to your styles object
formError: {
  backgroundColor: '#FEE2E2',
  color: '#B91C1C',
  padding: '0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  marginBottom: '1rem',
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
  calendarContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  categoryLegend: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  legendTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#374151',
  },
  legendItems: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  categoryDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  categoryName: {
    fontSize: '0.875rem',
    color: '#4B5563',
  },
  monthSection: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '1rem',
  },
  monthTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 1rem 0',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #E5E7EB',
    color: '#1F2937',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  eventCard: {
    display: 'flex',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    overflow: 'hidden',
  },
  categoryIndicator: {
    width: '8px',
    flexShrink: '0',
  },
  eventContent: {
    flex: '1',
    padding: '1rem',
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventName: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
    color: '#111827',
  },
  eventCategoryTag: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#F3F4F6',
    borderRadius: '9999px',
    color: '#4B5563',
  },
  eventDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: '0.5rem 0',
    fontSize: '0.875rem',
    color: '#4B5563',
  },
  eventDescription: {
    fontSize: '0.875rem',
    color: '#6B7280',
    margin: '0.5rem 0 0 0',
    lineHeight: '1.5',
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
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '0.375rem',
    color: '#4B5563',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  // Event card action buttons
  eventActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  adminControls: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    padding: '0.25rem',
    cursor: 'pointer',
    borderRadius: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#047857', // Green color for add
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    zIndex: '100',
    position: 'relative',
  },
  
  // Modal styles
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
  modal: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1rem',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: '1rem',
  },
  modalFooter: {
    padding: '1rem',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    color: '#1F2937',
  },
  select: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    color: '#1F2937',
    backgroundColor: 'white',
  },
  textarea: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    fontSize: '0.875rem',
    color: 'black',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  saveButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#DC2626',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  
  // Confirmation dialog styles
  confirmDialog: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  confirmTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
  },
  confirmMessage: {
    margin: '0 0 1.5rem 0',
    fontSize: '0.875rem',
    color: '#4B5563',
    lineHeight: '1.5',
  },
  confirmButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  datePickerContainer: {
    border: '1px solid #D1D5DB',
    borderRadius: '0.375rem',
    padding: '0.75rem',
    backgroundColor: '#F9FAFB',
  },
  dateSelectRow: {
    display: 'flex',
    alignItems: 'center',
  },
  dateSelectGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  dateSelect: {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    backgroundColor: 'white',
    minWidth: '110px',
    color: 'black',
  },
  daySelect: {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    backgroundColor: 'white',
    width: '70px',
    color:'black',
  },
  yearSelect: {
    padding: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid #D1D5DB',
    backgroundColor: 'white',
    width: '90px',
    color: 'black',
  },
  dateOptionRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.75rem',
    gap: '1rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '0.875rem',
    color: '#4B5563',
  },
  endDateLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#4B5563',
    marginRight: '0.5rem',
  },
  datePreview: {
    marginTop: '1rem',
    padding: '0.5rem',
    backgroundColor: '#E5E7EB',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
  },
  previewLabel: {
    fontWeight: '500',
    color: '#4B5563',
  },
  previewValue: {
    color: '#111827',
  },
};

export default AcademicCalendar;