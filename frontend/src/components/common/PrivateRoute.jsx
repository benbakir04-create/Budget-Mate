import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isDemoMode } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // في وضع Demo، السماح بالدخول مباشرة (isAuthenticated يجب أن يكون true)
  if (isDemoMode) {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  }

  // الوضع العادي - يتطلب تسجيل الدخول
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;

