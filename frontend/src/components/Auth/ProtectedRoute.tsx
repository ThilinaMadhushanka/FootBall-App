import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token || !userType) {
    return <Navigate to={`/login/${userType || 'manager'}`} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 