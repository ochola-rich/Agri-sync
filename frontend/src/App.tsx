import { useState, useCallback } from 'react'
import './App.css'

// Define types for better type safety
type UserRole = 'farmer' | 'clerk' | null;

function App() {
  // State with proper typing
  const [userType, setUserType] = useState<UserRole>(null)

  // Use useCallback for event handlers to prevent unnecessary re-renders
  const handleRoleSelect = useCallback((role: 'farmer' | 'clerk') => {
    setUserType(role)
  }, [])

  const handleBackToRoleSelection = useCallback(() => {
    setUserType(null)
  }, [])

  // Farmer interface
  if (userType === 'farmer') {
    return (
      <div className="interface-container farmer-interface">
        <div className="interface-content">
          <h1 className="interface-title">
            <span className="interface-icon" aria-hidden="true">🌾</span>
            Farmer Interface
          </h1>
          <p className="interface-subtitle">
            Welcome to the Farmer Dashboard
          </p>
          <button 
            onClick={handleBackToRoleSelection}
            className="back-button farmer-back-btn"
            aria-label="Back to role selection"
          >
            <span aria-hidden="true">←</span> Back to Role Selection
          </button>
          {/* Farmer interface content will go here */}
        </div>
      </div>
    )
  }

  // Clerk interface
  if (userType === 'clerk') {
    return (
      <div className="interface-container clerk-interface">
        <div className="interface-content">
          <h1 className="interface-title">
            <span className="interface-icon" aria-hidden="true">📋</span>
            Clerk Interface
          </h1>
          <p className="interface-subtitle">
            Welcome to the Clerk Dashboard
          </p>
          <button 
            onClick={handleBackToRoleSelection}
            className="back-button clerk-back-btn"
            aria-label="Back to role selection"
          >
            <span aria-hidden="true">←</span> Back to Role Selection
          </button>
          {/* Clerk interface content will go here */}
        </div>
      </div>
    )
  }

  // Role selection screen (default view)
  return (
    <div className="role-container">
      <div className="role-content">
        <h1 className="role-title">
          <span className="role-icon" aria-hidden="true">🌱</span>
          Agri-Sync
        </h1>
        
        <p className="role-subtitle">
          Select your role to continue
        </p>
        
        <div className="role-selection" role="group" aria-label="Role selection">
          <button 
            className="role-button farmer-btn" 
            onClick={() => handleRoleSelect('farmer')}
            aria-label="Select Farmer role"
          >
            <span className="button-icon" aria-hidden="true">👨‍🌾</span>
            <span className="button-text">Farmer</span>
          </button>
          
          <button 
            className="role-button clerk-btn" 
            onClick={() => handleRoleSelect('clerk')}
            aria-label="Select Clerk role"
          >
            <span className="button-icon" aria-hidden="true">👨‍💼</span>
            <span className="button-text">Clerk</span>
          </button>
        </div>
        
        <p className="role-footer">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App