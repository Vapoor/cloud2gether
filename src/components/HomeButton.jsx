import { useNavigate } from "react-router-dom";
import "../styles/HomeButton.css";

export default function HomeButton() {
  const navigate = useNavigate();
  return (
    <button className="home-btn" onClick={() => navigate("/app")} aria-label="Go to home">
      ⌂ Home
    </button>
  );
}