import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "./useTheme";
import { FEATURES } from "./config/features";
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
import Events from "./pages/Events";
import SavedResources from "./pages/SavedResources";
import AdminDashboard from "./pages/AdminDashboard";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import Changelog from "./pages/Changelog";
import CreateCommunity from "./pages/CreateCommunity";
import Community from "./pages/Community";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import ComingSoon from "./pages/ComingSoon";
import Suggestions from "./pages/Suggestions";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import NotFound from "./pages/NotFound";
import VillagePlus from "./pages/VillagePlus";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ForClinicians from "./pages/ForClinicians";
import Stall from "./pages/Stall";
import StallListingDetail from "./pages/StallListingDetail";
import CreateStallListing from "./pages/CreateStallListing";
import DonationGroupDetail from "./pages/DonationGroupDetail";
import CreateDonationGroup from "./pages/CreateDonationGroup";
import EditStallListing from "./pages/EditStallListing";
import ChatPopout from "./components/ChatPopout";
import PWAInstallBanner from "./components/PWAInstallBanner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

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

  // Incomplete onboarding → redirect to the onboarding page
  if (user && !user.onboarding_complete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return typeof children === 'function' ? children({ user }) : children;
};

// Main App Router
const AppRouter = () => {
  const location = useLocation();
  const [popoutUser, setPopoutUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try { setPopoutUser(JSON.parse(raw)); } catch {}
    }
  }, [location.pathname]);

  // Check for session_id in URL hash (Google OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
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
      <Route path="/bookmarks" element={<Navigate to="/saved" replace />} />
      <Route path="/saved" element={
        <ProtectedRoute>
          {({ user }) => <SavedResources user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/events" element={
        <ProtectedRoute>
          {({ user }) => <Events user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          {({ user }) => <AdminDashboard user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/moderator" element={
        <ProtectedRoute>
          {({ user }) => <ModeratorDashboard user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/changelog" element={
        <ProtectedRoute>
          {({ user }) => <Changelog user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/create-community" element={
        <ProtectedRoute>
          {({ user }) => <CreateCommunity user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/community/:id" element={
        <ProtectedRoute>
          {({ user }) => <Community user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/onboarding" element={
        <ProtectedRoute>
          {({ user }) => <Onboarding user={user} />}
        </ProtectedRoute>
      } />
      {FEATURES.BLOG && <Route path="/blog" element={
        <ProtectedRoute>
          {({ user }) => <Blog user={user} />}
        </ProtectedRoute>
      } />}
      {FEATURES.BLOG && <Route path="/blog/:slug" element={
        <ProtectedRoute>
          {({ user }) => <BlogPost user={user} />}
        </ProtectedRoute>
      } />}
      <Route path="/settings" element={
        <ProtectedRoute>
          {({ user }) => <Settings user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/coming-soon" element={<ComingSoon />} />
      <Route path="/suggestions" element={
        <ProtectedRoute>
          {({ user }) => <Suggestions user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/community-guidelines" element={<CommunityGuidelines />} />
      <Route path="/stall" element={
        <ProtectedRoute>
          {({ user }) => <Stall user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/stall/new" element={
        <ProtectedRoute>
          {({ user }) => <CreateStallListing user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/stall/listing/:listingId" element={
        <ProtectedRoute>
          {({ user }) => <StallListingDetail user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/stall/listing/:listingId/edit" element={
        <ProtectedRoute>
          {({ user }) => <EditStallListing user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/stall/groups/new" element={
        <ProtectedRoute>
          {({ user }) => <CreateDonationGroup user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/stall/groups/:groupId" element={
        <ProtectedRoute>
          {({ user }) => <DonationGroupDetail user={user} />}
        </ProtectedRoute>
      } />
      <Route path="/plus" element={<VillagePlus user={popoutUser} />} />
      <Route path="/subscription/success" element={<SubscriptionSuccess user={popoutUser} />} />
      <Route path="/subscription/cancel" element={<SubscriptionCancel user={popoutUser} />} />
      <Route path="/for-clinicians" element={<ForClinicians user={popoutUser} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    {popoutUser &&
      location.pathname !== "/" &&
      location.pathname !== "/login" &&
      location.pathname !== "/register" &&
      location.pathname !== "/forgot-password" &&
      location.pathname !== "/reset-password" &&
      location.pathname !== "/onboarding" &&
      !location.pathname.match(/^\/chat\/.+/) &&
      (() => { try { return JSON.parse(localStorage.getItem("village_prefs") || "{}").chatBubble !== false; } catch { return true; } })() &&
      <ChatPopout user={popoutUser} />}
    </>
  );
};

function App() {
  useTheme(); // applies data-theme + html.dark from stored preference on first render
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-center" />
      <PWAInstallBanner />
    </BrowserRouter>
  );
}

export default App;
