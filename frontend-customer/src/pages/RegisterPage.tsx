import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Traditional registration forms are deprecated in favor of Mobile Number + OTP auto-registration.
 */
export const RegisterPage: React.FC = () => {
  return <Navigate to="/account/login" replace />;
};
