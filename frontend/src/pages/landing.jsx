import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function LandingPage() {

  const navigate = useNavigate();

  const createMeeting = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Not logged in → send to auth, then after login they land on /home
      alert("Please login first to create a meeting");
      navigate("/auth");
      return;
    }

    // Logged in → generate a code and jump straight into the meeting
    const id = Math.random().toString(36).substring(2, 8);
    navigate(`/meet/${id}`);
  };

  const joinMeeting = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      // Not logged in → go to auth first
      navigate("/auth");
    } else {
      // Already logged in → go to home to enter a meeting code
      navigate("/home");
    }
  };

  return (
    <div className="landingPageContainer">

      <nav className="navbar">
        <h2>Apna Video Call</h2>

        <div className="navButtons">
          <button onClick={() => navigate("/auth")}>Login</button>
          <button onClick={() => navigate("/auth")}>Register</button>
        </div>
      </nav>

      <div className="landingMainContainer">

        <div className="landingText">

          <h1>
            Premium Video Meetings <br />
            <span>For Everyone</span>
          </h1>

          <p>
            Secure video meetings with friends, family and colleagues.
          </p>

          <div className="landingActions">

            {/* ✅ Creates a random meeting code and jumps straight in */}
            <button className="primaryBtn" onClick={createMeeting}>
              🎥 Create Meeting
            </button>

            {/* ✅ Goes to home page to enter an existing meeting code */}
            <button className="secondaryBtn" onClick={joinMeeting}>
              🔗 Join Meeting
            </button>

          </div>

          <p className="landingHint">
            <b>Create Meeting</b> — instantly start a new room<br />
            <b>Join Meeting</b> — enter a code to join someone else's room
          </p>

        </div>

        <div className="landingImage">
          <img src="/mobile.png" alt="video call" />
        </div>

      </div>

    </div>
  );
}
