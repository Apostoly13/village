import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import ComingSoonPublic from "./pages/ComingSoonPublic";
import { useTheme } from "./useTheme";
import { FEATURES } from "./config/features";
import { Toaster } from "./components/ui/sonner";

// Core pages — loaded immediately (on the critical path)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Forums from "./pages/Forums";
import ForumCategory from "./pages/ForumCategory";
import ForumPost from "./pages/ForumPost";
import ChatRooms from "./pages/ChatRooms";
import ChatRoom from "./pages/ChatRoom";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChatPopout from "./components/ChatPopout";
import PWAInstallBanner from "./components/PWAInstallBanner";
import { toast } from "./components/ui/sonner";

// Non-critical pages — lazy loaded (split into separate chunks)
const Messages            = lazy(() => import("./pages/Messages"));
const Conversation        = lazy(() => import("./pages/Conversation"));
const Profile             = lazy(() => import("./pages/Profile"));
const CreatePost          = lazy(() => import("./pages/CreatePost"));
const Friends             = lazy(() => import("./pages/Friends"));
const Events              = lazy(() => import("./pages/Events"));
const SavedResources      = lazy(() => import("./pages/SavedResources"));
const AdminDashboard      = lazy(() => import("./pages/AdminDashboard"));
const ModeratorDashboard  = lazy(() => import("./pages/ModeratorDashboard"));
const Changelog           = lazy(() => import("./pages/Changelog"));
const CreateCommunity     = lazy(() => import("./pages/CreateCommunity"));
const Community           = lazy(() => import("./pages/Community"));
const Blog                = lazy(() => import("./pages/Blog"));
const BlogPost            = lazy(() => import("./pages/BlogPost"));
const Settings            = lazy(() => import("./pages/Settings"));
const Terms               = lazy(() => import("./pages/Terms"));
const Privacy             = lazy(() => import("./pages/Privacy"));
const Contact             = lazy(() => import("./pages/Contact"));
const ComingSoon          = lazy(() => import("./pages/ComingSoon"));
const Suggestions         = lazy(() => import("./pages/Suggestions"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const VillagePlus         = lazy(() => import("./pages/VillagePlus"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCancel  = lazy(() => import("./pages/SubscriptionCancel"));
const ForClinicians       = lazy(() => import("./pages/ForClinicians"));
const Stall               = lazy(() => import("./pages/Stall"));
const StallListingDetail  = lazy(() => import("./pages/StallListingDetail"));
const CreateStallListing  = lazy(() => import("./pages/CreateStallListing"));
const DonationGroupDetail = lazy(() => import("./pages/DonationGroupDetail"));
const CreateDonationGroup = lazy(() => import("./pages/CreateDonationGroup"));
const EditStallListing    = lazy(() => import("./pages/EditStallListing"));

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Email verification page ────────────────────────────────────────────────────
// Two modes:
//   ?token=xxx  → verify the token from the link in the email
//   (no token)  → holding page shown to unverified users gated by ProtectedRoute
function VerifyEmailPage() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error | sending
  const [msg, setMsg]       = useState("");
  const navigate            = useNavigate();
  const params              = new URLSearchParams(window.location.search);
  const token               = params.get("token");

  // Get user email from localStorage for the holding page display
  const storedEmail = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").email || ""; } catch { return ""; }
  })();

  // If a token is present, auto-verify on mount
  useEffect(() => {
    if (!token) { setStatus("idle"); return; }
    setStatus("loading");
    fetch(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.message) {
          setStatus("success");
          setMsg(d.message);
          // Update cached user so the gate lifts on next navigation
          try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            u.email_verified = true;
            localStorage.setItem("user", JSON.stringify(u));
          } catch {}
        } else {
          setStatus("error");
          setMsg(d.detail || "Something went wrong.");
        }
      })
      .catch(() => { setStatus("error"); setMsg("Could not connect — please try again."); });
  }, [token]);

  const resend = async () => {
    setStatus("sending");
    try {
      const r = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST", credentials: "include",
      });
      const d = await r.json();
      toast.success(d.message || "Verification email sent — check your inbox");
    } catch {
      toast.error("Could not send — please try again later");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--paper)" }}>
      <div className="rounded-2xl p-8 max-w-sm w-full text-center shadow-sm" style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}>

        {/* ── Token verification states ── */}
        {token && status === "loading" && (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: "var(--ink-3)", borderTopColor: "var(--ink)" }} />
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>Verifying your email…</p>
          </>
        )}
        {token && status === "success" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="font-heading text-lg font-semibold mb-2" style={{ color: "var(--ink)" }}>Email verified!</h2>
            <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>{msg}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Go to The Village →
            </button>
          </>
        )}
        {token && status === "error" && (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="font-heading text-lg font-semibold mb-2" style={{ color: "var(--ink)" }}>Couldn't verify</h2>
            <p className="text-sm mb-6" style={{ color: "var(--ink-3)" }}>{msg}</p>
            <button
              onClick={resend}
              className="w-full py-2.5 rounded-xl text-sm font-medium mb-3 transition-opacity hover:opacity-90"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Resend verification email
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ color: "var(--ink-3)", border: "1px solid var(--line)" }}
            >
              Back to dashboard
            </button>
          </>
        )}

        {/* ── Holding page — no token, gated by ProtectedRoute ── */}
        {!token && (
          <>
            <div className="text-4xl mb-5">📬</div>
            <h2 className="font-heading text-xl font-semibold mb-2" style={{ color: "var(--ink)" }}>
              Check your inbox
            </h2>
            <p className="text-sm mb-1" style={{ color: "var(--ink-3)" }}>
              We sent a verification link to
            </p>
            {storedEmail && (
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--ink)" }}>
                {storedEmail}
              </p>
            )}
            <p className="text-xs mb-6" style={{ color: "var(--ink-3)" }}>
              Click the link in the email to access The Village. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={resend}
              disabled={status === "sending"}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 mb-3"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              {status === "sending" ? "Sending…" : "Resend verification email"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("user");
                navigate("/login");
              }}
              className="w-full py-2 text-xs transition-colors"
              style={{ color: "var(--ink-3)" }}
            >
              Sign in with a different account
            </button>
          </>
        )}
      </div>
    </div>
  );
}

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

  // Incomplete onboarding → redirect to the onboarding page (allow before email gate)
  if (user && !user.onboarding_complete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Email not yet verified → hold at the verify-email page
  if (user && user.email_verified === false && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  return (
    <>
      {typeof children === 'function' ? children({ user }) : children}
    </>
  );
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
    <Suspense fallback={null}>
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
      <Route path="/verify-email" element={<VerifyEmailPage />} />
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
    </Suspense>
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

// ── Coming Soon Gate ──────────────────────────────────────────────────────────
// Controlled via Vercel env vars on the main deployment only:
//   REACT_APP_COMING_SOON=true        → enables the public gate
//   REACT_APP_PREVIEW_SECRET=<secret> → bypass token (visit /?preview=<secret>)
// Dev deployment: neither var is set, so gate is always off.

const COMING_SOON_ENABLED = process.env.REACT_APP_COMING_SOON === "true";
const PREVIEW_SECRET      = process.env.REACT_APP_PREVIEW_SECRET || "";
const BYPASS_KEY          = "village_preview_bypass";

function ComingSoonGate({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (!COMING_SOON_ENABLED || !PREVIEW_SECRET) return;
    const params  = new URLSearchParams(location.search);
    const preview = params.get("preview");
    if (preview && preview === PREVIEW_SECRET) {
      localStorage.setItem(BYPASS_KEY, "1");
      // Strip the ?preview= param from the URL cleanly
      window.history.replaceState({}, "", location.pathname);
    }
  }, [location]);

  if (!COMING_SOON_ENABLED) return children;
  if (localStorage.getItem(BYPASS_KEY) === "1") return children;

  return <ComingSoonPublic />;
}

function App() {
  useTheme(); // applies data-theme + html.dark from stored preference on first render
  return (
    <BrowserRouter>
      <ComingSoonGate>
        <AppRouter />
        <Toaster position="top-center" />
        <PWAInstallBanner />
      </ComingSoonGate>
    </BrowserRouter>
  );
}

export default App;
