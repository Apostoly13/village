import React from "react";
import ReactDOM from "react-dom/client";
import "./theme.css";   // design tokens — must come before index.css so [data-theme] selectors override :root
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
