import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Conversation has been consolidated into the Messages page.
// Any deep-link to /messages/:userId redirects to /messages.
export default function Conversation() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/messages", { replace: true });
  }, [navigate]);
  return null;
}
