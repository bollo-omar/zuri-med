import React from 'react';
import { Navigate } from 'react-router-dom';
import { User, UserRole } from '@/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    user: User;
    allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, user, allowedRoles }) => {
    if (!allowedRoles.includes(user.role)) {
        // Redirect to dashboard if user doesn't have access
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

