import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // If specific roles are required and the user's role isn't among them
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect them to their appropriate dashboard or a generic unauthorized page
      // For simplicity, we just redirect to the main dashboard overview
      return <Navigate to="/dashboard" replace />;
    }
  } catch (error) {
    // If parsing fails, clear local storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // If authenticated and authorized, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
