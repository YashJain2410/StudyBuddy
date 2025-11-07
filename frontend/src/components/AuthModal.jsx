// src/components/AuthModal.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose(); // Close the modal
    navigate('/login'); // Navigate to login page
  };

  const handleSignUp = () => {
    onClose(); // Close the modal
    navigate('/register'); // Navigate to register page
  };

  return (
    // Full-screen overlay
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4"
      onClick={onClose} // Close modal if overlay is clicked
    >
      {/* Modal Content */}
      <div
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
        <p className="text-gray-700 mb-8">
          Please log in or sign up to access this feature.
        </p>
        
        {/* Button Container */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-700 to-pink-600 text-white font-semibold rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
          >
            Login
          </button>
          <button
            onClick={handleSignUp}
            className="w-full px-6 py-3 border border-indigo-700 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-300"
          >
            Sign Up
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="mt-6 text-sm text-gray-500 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AuthModal;