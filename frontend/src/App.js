import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Forums from "./pages/Forums";
import ForumCategory from "./pages/ForumCategory";
import ForumPost from "./pages/ForumPost";
import ChatRooms from "./pages/ChatRooms";
import ChatRoom from "./pages/ChatRoom";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Friends from "./pages/Friends";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Auth Context
export const AuthContext = ({ children }) => {
  return children;
};

// Auth Callback - handles Google OAuth redirect
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        
        try {
          const response = await fetch(`${API_URL}/api/auth/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ session_id: sessionId })
          });

          if (response.ok) {
            const userData = await response.json();
            localStorage.setItem("user", JSON.stringify(userData));
            navigate("/dashboard", { state: { user: userData }, replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        } catch (error) {
          console.error("Auth error:", error);
          navigate("/login", { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  useEffect(() => {
    // Skip if user passed from AuthCallback
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(location.state.user));
      return;
    }

    // If we already have user data, don't re-check
    if (user && isAuthenticated) {
      return;
    }

    // Only check auth once per mount
    if (checkedRef.current) {
      return;
    }

    const checkAuth = async () => {
      checkedRef.current = true;
      
      // First check localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        // Try to parse and use cached user first for faster UX
        try {
          const cachedUser = JSON.parse(storedUser);
          setUser(cachedUser);
          setIsAuthenticated(true);
          
          // Verify in background
          const response = await fetch(`${API_URL}/api/auth/me`, {
            credentials: "include"
          });
          
          if (response.ok) {
            const freshUser = await response.json();
            setUser(freshUser);
            localStorage.setItem("user", JSON.stringify(freshUser));
          } else {
            // Session expired, clear and redirect
            localStorage.removeItem("user");
            setIsAuthenticated(false);
            navigate("/login", { replace: true });
          }
          return;
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    };

    checkAuth();
  }, [location.state, navigate, user, isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return typeof children === 'function' ? children({ user }) : children;
};

// Main App Router
const AppRouter = () => {
  const location = useLocation();

  // Check for session_id in URL hash (Google OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {({ user }) => <Dashboard user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/forums" element={
        <ProtectedRoute>
          {({ user }) => <Forums user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/forums/:categoryId" element={
        <ProtectedRoute>
          {({ user }) => <ForumCategory user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/forums/post/:postId" element={
        <ProtectedRoute>
          {({ user }) => <ForumPost user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/create-post" element={
        <ProtectedRoute>
          {({ user }) => <CreatePost user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          {({ user }) => <ChatRooms user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/chat/:roomId" element={
        <ProtectedRoute>
          {({ user }) => <ChatRoom user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          {({ user }) => <Messages user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/messages/:userId" element={
        <ProtectedRoute>
          {({ user }) => <Conversation user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          {({ user }) => <Profile user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/profile/:userId" element={
        <ProtectedRoute>
          {({ user }) => <Profile user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/friends" element={
        <ProtectedRoute>
          {({ user }) => <Friends user={user} />}
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-center" />
    </BrowserRouter>
  );
}

export default App;
