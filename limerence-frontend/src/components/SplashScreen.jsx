"use client"

import { useNavigate } from "react-router-dom"
import "./styles/SplashScreen.css"
import bookIcon from "../assets/book-icon1.jpg"

export default function SplashScreen({ onGetStarted }) {
  const navigate = useNavigate()

  const handleClick = () => {
    onGetStarted()
    navigate("/register")
  }

  return (
    <div className="splash-container">
      <div className="splash-content">
        <div className="splash-icon-wrapper">
          <img src={bookIcon || "/placeholder.svg"} alt="Limerence Book Icon" className="splash-book" />
        </div>
        <h1 className="splash-title">Limerence</h1>
        <p className="splash-subtitle">Where every page turns into a love story</p>
        <p className="splash-description">
          Discover thousands of romance novels, connect with fellow readers, and lose yourself in tales of passion and
          devotion
        </p>
        <button className="splash-button" onClick={handleClick}>
          Begin Your Journey
        </button>
      </div>
      <div className="splash-footer">
        <p>Join thousands of romance readers worldwide</p>
      </div>
    </div>
  )
}
