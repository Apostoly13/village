import { BrowserRouter, Routes, Route } from "react-router-dom";

function ComingSoon() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a0f0a 0%, #2d1810 50%, #1a0f0a 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: "2rem",
      textAlign: "center",
    }}>
      <img
        src="/BG Removed- Main Logo - ps edit.png"
        alt="Our Little Village"
        style={{ height: "80px", width: "auto", marginBottom: "2rem", opacity: 0.95 }}
      />
      <h1 style={{
        fontSize: "clamp(2rem, 5vw, 3.5rem)",
        fontWeight: "bold",
        color: "#f5e6d0",
        marginBottom: "1rem",
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
      }}>
        Something special<br />is coming
      </h1>
      <p style={{
        fontSize: "clamp(1rem, 2vw, 1.2rem)",
        color: "#c9a882",
        maxWidth: "480px",
        lineHeight: 1.7,
        marginBottom: "3rem",
      }}>
        A warm, safe space for Australian parents to connect, share, and find their village.
        We are putting the finishing touches on - stay tuned.
      </p>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem 1.5rem",
        borderRadius: "999px",
        border: "1px solid rgba(201, 168, 130, 0.3)",
        background: "rgba(201, 168, 130, 0.08)",
        color: "#c9a882",
        fontSize: "0.9rem",
        marginBottom: "3rem",
      }}>
        <span>ourlittlevillage.au</span>
      </div>
      <p style={{ color: "rgba(201, 168, 130, 0.4)", fontSize: "0.8rem" }}>
        Copyright {new Date().getFullYear()} Our Little Village - built for Australian parents
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
