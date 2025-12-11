import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {t('dashboard.title')}
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Welcome, {user?.name || 'User'}!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Dashboard content will be added in Phase 2
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

