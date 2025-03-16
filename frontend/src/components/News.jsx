import React, { useState, useEffect, useRef } from 'react';
import NavBar from './NavBar';
import { Search, Calendar, ChevronDown, Filter, Clock, Plus, Edit, Trash2, X, Image, FileText, Upload } from 'lucide-react';
import axios from 'axios';

const News = () => {
  // Original state
  const [newsItems, setNewsItems] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTimeframe, setSelectedTimeframe] = useState('All Time');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  // Admin functionality state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newNewsData, setNewNewsData] = useState({
    title: '',
    category: 'University News',
    summary: '',
    content: '',
    image: null,
    imagePreview: null
  });
  const [formError, setFormError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Add these new state variables near the top with your other state declarations
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [viewingNews, setViewingNews] = useState(null);

  // API URLs
  const NEWS_API_URL = 'http://localhost:8080/api/news';
  const NEWS_CATEGORIES_API_URL = 'http://localhost:8080/api/news/categories';

  // Categories for filtering - will be fetched from API if available
  const [categories, setCategories] = useState(['All', 'University News', 'Academic', 'Events', 'Research', 'Student Life']);
  
  // Timeframes for filtering
  const timeframes = ['All Time', 'Last Week', 'Last Month', 'Last 3 Months', 'This Year'];

  useEffect(() => {
    fetchNews();
    fetchCategories();
    checkIfAdmin();
  }, []);

  useEffect(() => {
    filterNews();
  }, [newsItems, searchTerm, selectedCategory, selectedTimeframe]);

  const checkIfAdmin = () => {
    const loggedInUsername = localStorage.getItem('username') || '';
    setIsAdmin(loggedInUsername === 'anurag_university');
  };

  const fetchCategories = async () => {
    try {
      // Try to fetch categories from backend if endpoint exists
      const response = await axios.get(NEWS_CATEGORIES_API_URL);
      if (response.data && Array.isArray(response.data)) {
        // Add 'All' as first option
        setCategories(['All', ...response.data.map(cat => cat.name || cat)]);
      }
    } catch (error) {
      console.error('Error fetching news categories:', error);
      // Keep default categories if endpoint doesn't exist
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get(NEWS_API_URL);
      
      // Transform API data if needed to match our expected format
      const formattedNews = response.data.map(item => ({
        id: item.id,
        title: item.title,
        date: item.date || item.createdAt,
        category: item.category,
        summary: item.summary,
        content: item.content,
        image: item.imageUrl || item.image
      }));
      
      setNewsItems(formattedNews);
      setFilteredNews(formattedNews);
      setError(null);
    } catch (error) {
      console.error("Error fetching news:", error);
      setError("Failed to load news. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const openAddNewsModal = () => {
    setEditingNews(null);
    setNewNewsData({
      title: '',
      category: 'University News',
      summary: '',
      content: '',
      image: null,
      imagePreview: null
    });
    setPhotoPreview(null);
    setFormError(null);
    setShowNewsModal(true);
  };

  const openEditNewsModal = (newsItem) => {
    setEditingNews(newsItem);
    setNewNewsData({
      title: newsItem.title,
      category: newsItem.category,
      summary: newsItem.summary,
      content: newsItem.content || '',
      image: null,
      imagePreview: null  // Don't set imagePreview here
    });
    
    // Set photo preview directly with the processed image URL
    setPhotoPreview(getImageUrl(newsItem.image));
    setFormError(null);
    setShowNewsModal(true);
  };

  const handleNewsInputChange = (e) => {
    const { name, value } = e.target;
    setNewNewsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setNewNewsData(prev => ({
        ...prev,
        image: file,
        imagePreview: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNews = async () => {
    if (!newNewsData.title || !newNewsData.summary) {
      setFormError("Please fill in all required fields");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('title', newNewsData.title);
      formData.append('category', newNewsData.category);
      formData.append('summary', newNewsData.summary);
      formData.append('content', newNewsData.content || '');
      
      // Only append image if a new one was selected
      if (newNewsData.image) {
        formData.append('image', newNewsData.image);
      }
      
      let response;
      if (editingNews) {
        // Update existing news
        response = await axios.put(`${NEWS_API_URL}/${editingNews.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Add new news item
        response = await axios.post(NEWS_API_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      // Refresh news data after successful save
      fetchNews();
      setShowNewsModal(false);
      setFormError(null);
    } catch (error) {
      console.error('Error saving news:', error);
      setFormError(`Error saving news: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Replace the handleDeleteNews function with this version
  const handleDeleteNews = (newsId) => {
    setShowDeleteConfirm(newsId);
  };

  // Add this new function for confirming deletion
  const confirmDeleteNews = async (newsId) => {
    try {
      await axios.delete(`${NEWS_API_URL}/${newsId}`);
      
      // Update UI after successful deletion
      const updatedNews = newsItems.filter(item => item.id !== newsId);
      setNewsItems(updatedNews);
      setFilteredNews(updatedNews);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting news:', error);
      alert(`Failed to delete news: ${error.response?.data?.message || error.message}`);
    }
  };

  // Add this function to handle "Read more" clicks
  const handleReadMore = (e, newsItem) => {
    e.preventDefault();
    setViewingNews(newsItem);
  };

  const filterNews = () => {
    let filtered = [...newsItems];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Apply time filter
    if (selectedTimeframe !== 'All Time') {
      const currentDate = new Date();
      let cutoffDate = new Date();
      
      switch(selectedTimeframe) {
        case 'Last Week':
          cutoffDate.setDate(currentDate.getDate() - 7);
          break;
        case 'Last Month':
          cutoffDate.setMonth(currentDate.getMonth() - 1);
          break;
        case 'Last 3 Months':
          cutoffDate.setMonth(currentDate.getMonth() - 3);
          break;
        case 'This Year':
          cutoffDate = new Date(currentDate.getFullYear(), 0, 1);
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(item => new Date(item.date) >= cutoffDate);
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setFilteredNews(filtered);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getImageUrl = (image) => {
    // If it's already a complete URL, return as is
    if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
      return image;
    }
    
    // For relative paths from server
    if (image && image.startsWith('/')) {
      return `http://localhost:8080${image}`;
    }
    
    // Default or non-server paths
    return image || '/assets/placeholder-news.jpg';
  };

  return (
    <div style={styles.container}>
      <NavBar />
      
      <div style={styles.pageHeader}>
        <div style={styles.headerContent}>
          <h1 style={styles.pageTitle}>News & Announcements</h1>
          <p style={styles.pageDescription}>
            Stay updated with the latest news and announcements from Anurag University
          </p>
        </div>
      </div>
      
      <div style={styles.contentContainer}>
        <div style={styles.filterContainer}>
          <div style={styles.filterRow}>
            <div style={styles.searchBox}>
              <Search size={20} color="#6B7280" />
              <input
                type="text"
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.filtersGroup}>
              <div style={styles.filterDropdownContainer}>
                <div 
                  style={styles.filterDropdown} 
                  onClick={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowTimeDropdown(false);
                  }}
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
              
              <div style={styles.filterDropdownContainer}>
                <div 
                  style={styles.filterDropdown} 
                  onClick={() => {
                    setShowTimeDropdown(!showTimeDropdown);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Clock size={16} color="#4B5563" />
                  <span style={styles.filterLabel}>Time: {selectedTimeframe}</span>
                  <ChevronDown size={16} color="#4B5563" />
                </div>
                
                {showTimeDropdown && (
                  <div style={styles.dropdownMenu}>
                    {timeframes.map(timeframe => (
                      <div 
                        key={timeframe} 
                        style={styles.dropdownItem}
                        onClick={() => {
                          setSelectedTimeframe(timeframe);
                          setShowTimeDropdown(false);
                        }}
                      >
                        {timeframe}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {isAdmin && (
                <button 
                  onClick={openAddNewsModal}
                  style={styles.addNewsButton}
                >
                  <Plus size={16} />
                  <span>Add News</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading news...</p>
          </div>
        ) : error ? (
          <div style={styles.errorContainer}>
            <p>{error}</p>
          </div>
        ) : filteredNews.length > 0 ? (
          <div style={styles.newsGrid}>
            {filteredNews.map(item => (
              <div key={item.id} style={styles.newsCard}>
                {item.image && (
                  <div 
                    style={{
                      ...styles.newsImage,
                      backgroundImage: `url(${getImageUrl(item.image)})`,
                    }}
                  />
                )}
                <div style={styles.newsContent}>
                  <div style={styles.newsHeader}>
                    <div style={styles.newsCategory}>{item.category}</div>
                    
                    {isAdmin && (
                      <div style={styles.newsAdminControls}>
                        <button 
                          onClick={() => openEditNewsModal(item)}
                          style={styles.actionButton}
                          title="Edit news"
                        >
                          <Edit size={14} color="#4B5563" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNews(item.id)}
                          style={styles.actionButton}
                          title="Delete news"
                        >
                          <Trash2 size={14} color="#DC2626" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h3 style={styles.newsTitle}>{item.title}</h3>
                  <div style={styles.newsDate}>
                    <Calendar size={14} color="#6B7280" />
                    <span>{formatDate(item.date)}</span>
                  </div>
                  <p style={styles.newsSummary}>{item.summary}</p>
                  <div style={styles.newsActions}>
                    <a 
                      href={`/news/${item.id}`} 
                      style={styles.readMoreLink}
                      onClick={(e) => handleReadMore(e, item)}
                    >
                      Read more →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noResults}>
            <p>No news items found matching your search criteria.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedTimeframe('All Time');
              }}
              style={styles.resetButton}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
      
      {/* News Add/Edit Modal */}
      {showNewsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalWithPhoto}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingNews ? 'Edit News' : 'Add New News Item'}</h3>
              <button 
                onClick={() => setShowNewsModal(false)}
                style={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalTwoColumnContent}>
              {/* Left column: Basic info and content */}
              <div style={styles.formColumn}>
                {formError && (
                  <div style={styles.formError}>
                    <span>{formError}</span>
                  </div>
                )}
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Title *</label>
                  <input 
                    type="text"
                    name="title"
                    value={newNewsData.title}
                    onChange={handleNewsInputChange}
                    style={styles.input} 
                    placeholder="Enter news title"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Summary *</label>
                  <textarea
                    name="summary"
                    value={newNewsData.summary}
                    onChange={handleNewsInputChange}
                    style={styles.textarea}
                    placeholder="Enter a brief summary (displayed on news cards)"
                    rows={3}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Content</label>
                  <textarea
                    name="content"
                    value={newNewsData.content}
                    onChange={handleNewsInputChange}
                    style={styles.textarea}
                    placeholder="Enter the full news content"
                    rows={8}
                  />
                </div>
              </div>
              
              {/* Right column: Category and image */}
              <div style={styles.photoColumn}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category *</label>
                  <select
                    name="category"
                    value={newNewsData.category}
                    onChange={handleNewsInputChange}
                    style={styles.select}
                  >
                    {categories.filter(cat => cat !== 'All').map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
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
                        <p style={styles.photoPlaceholderText}>Add News Image</p>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    style={styles.uploadPhotoButton} 
                    onClick={handlePhotoClick}
                  >
                    <Upload size={16} />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                onClick={() => setShowNewsModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNews}
                style={styles.saveButton}
                disabled={!newNewsData.title || !newNewsData.summary || isUploading}
              >
                {isUploading ? 'Saving...' : editingNews ? 'Update' : 'Publish'} News
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* News Delete Confirmation Modal */}
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
                Are you sure you want to delete this news item? This action cannot be undone.
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
                onClick={() => confirmDeleteNews(showDeleteConfirm)}
                style={{...styles.saveButton, backgroundColor: '#DC2626'}}
              >
                Delete News
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News Detail Modal */}
      {viewingNews && (
        <div style={styles.modalOverlay}>
          <div style={styles.detailsModal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{viewingNews.title}</h3>
              <button 
                onClick={() => setViewingNews(null)}
                style={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={styles.detailsModalContent}>
              {viewingNews.image && (
                <div style={styles.detailsNewsImage}>
                  <img 
                    src={getImageUrl(viewingNews.image)} 
                    alt={viewingNews.title}
                    style={styles.fullNewsImage}
                  />
                </div>
              )}
              
              <div style={styles.newsMetadata}>
                <div style={styles.newsDetailCategory}>{viewingNews.category}</div>
                <div style={styles.newsDetailDate}>
                  <Calendar size={16} color="#6B7280" />
                  <span>{formatDate(viewingNews.date)}</span>
                </div>
              </div>
              
              <div style={styles.newsDetailsSummary}>
                <p>{viewingNews.summary}</p>
              </div>
              
              {viewingNews.content && (
                <div style={styles.newsDetailsContent}>
                  {viewingNews.content.split('\n').map((paragraph, idx) => (
                    paragraph ? <p key={idx} style={styles.contentParagraph}>{paragraph}</p> : <br key={idx} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*" 
        onChange={handlePhotoChange}
      />
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
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    flexGrow: 1,
    color: 'black',
    width: 'auto',
    height: '38px',  
    boxSizing: 'border-box',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    flexGrow: 1,
    marginLeft: '0.75rem',
    fontSize: '0.875rem',
    color:'black',
  },
  filtersGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  filterDropdownContainer: {
    position: 'relative',
    zIndex: 10,
  },
  filterDropdown: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem', 
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#4B5563',
    whiteSpace: 'nowrap',
    height: '38px',
    boxSizing: 'border-box', 
  },
  filterLabel: {
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    left: 0,
    backgroundColor: 'white',
    width: '100%',
    minWidth: '180px',
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
  newsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
  },
  newsCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
  },
  newsImage: {
    height: '200px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  newsContent: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  newsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  newsCategory: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  newsAdminControls: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    backgroundColor: 'white',
    cursor: 'pointer',
    padding: 0,
  },
  newsTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.75rem',
    lineHeight: '1.4',
  },
  newsDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#6B7280',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  newsSummary: {
    fontSize: '0.875rem',
    color: '#4B5563',
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  newsActions: {
    marginTop: 'auto',
  },
  readMoreLink: {
    color: '#1E40AF',
    fontSize: '0.875rem',
    fontWeight: '500',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
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
  // Add these new styles for admin functionality
  addNewsButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1rem',
    height: '38px',
    backgroundColor: '#1E40AF',
    color: 'white',
    borderRadius: '0.5rem',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  adminActions: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto',
  },
  adminActionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '0.25rem',
    border: '1px solid #E5E7EB',
    backgroundColor: 'white',
    cursor: 'pointer',
    padding: 0,
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
  closeButton: { // Rename from closeModalButton to match EventsPage
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
  formGroup: {
    marginBottom: '1.25rem',
  },
  label: { // Add this to match EventsPage
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem',
  },
  formLabel: { // Keep existing for backward compatibility
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    fontSize: '0.875rem',
    color: '#111827',
  },
  input: { // Add this to match EventsPage
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
  formError: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '0.75rem 1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
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
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  select: { // Add this to match EventsPage
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
  textarea: { // Add this to match EventsPage
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
  confirmModal: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  modalContent: {
    padding: '1.5rem',
  },
  confirmText: {
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: '#4B5563',
    margin: '0',
  },
  detailsModal: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  detailsModalContent: {
    padding: '1.5rem',
  },
  detailsNewsImage: {
    width: '100%',
    marginBottom: '1.5rem',
    borderRadius: '0.375rem',
    overflow: 'hidden',
  },
  fullNewsImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  newsMetadata: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  newsDetailCategory: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },
  newsDetailDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#6B7280',
    fontSize: '0.875rem',
  },
  newsDetailsSummary: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: '1.5rem',
    lineHeight: '1.5',
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.375rem',
    borderLeft: '3px solid #1E40AF',
  },
  newsDetailsContent: {
    fontSize: '0.95rem',
    color: '#4B5563',
    lineHeight: '1.6',
  },
  contentParagraph: {
    marginBottom: '1rem',
  },
};

export default News;