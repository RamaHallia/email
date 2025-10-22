import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { PricingPage } from './pages/PricingPage';
import { SuccessPage } from './pages/SuccessPage';
import { Dashboard } from './pages/Dashboard';
import LandingPage from './pages/LandingPage';

function ProtectedDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EF6855] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ProtectedDashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
