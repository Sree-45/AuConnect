import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FeedPage from './components/FeedPage';
import Login from './components/Login';
import Register from './components/Register';
import ProfilePage from './components/ProfilePage';
import EditPage from './components/EditPage';
import MessagesPage from './components/MessagesPage';
import ConnectionsPage from './components/ConnectionsPage';
import University  from './components/University';
import FacultyDirectory from './components/FacultyDirectory';
import AcademicCalendar from './components/AcademicCalendar';
import EventsPage from './components/EventsPage';
import News from './components/News';

// Protected route component that checks if user is logged in
const ProtectedRoute = ({ children }) => {
  const username = localStorage.getItem('username');
  if (!username) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }
  return children;
};

// Authentication route component that redirects authenticated users
const AuthRoute = ({ children }) => {
  const username = localStorage.getItem('username');
  if (username) {
    // Redirect to feed if already authenticated
    return <Navigate to="/feed" />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<Register />} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/edit" element={<ProtectedRoute><EditPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/connections" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
        <Route path="/connections/:username" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />
        <Route path="/university" element={<ProtectedRoute><University /></ProtectedRoute>} />
        <Route path="/faculty-directory" element={<ProtectedRoute><FacultyDirectory /></ProtectedRoute>} />
        <Route path="/academic-calendar" element={<ProtectedRoute><AcademicCalendar /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
