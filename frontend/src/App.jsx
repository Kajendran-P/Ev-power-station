import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import ProcessingOverlay from './components/ProcessingOverlay';
import SOSFloatButton from './components/SOSFloatButton';
import NotificationPanel from './components/NotificationPanel';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StationsPage from './pages/StationsPage';
import StationBookingPage from './pages/StationBookingPage';
import StationDetailPage from './pages/StationDetailPage';
import ServicesPage from './pages/ServicesPage';
import SparePartsPage from './pages/SparePartsPage';
import SOSPage from './pages/SOSPage';

import ConfirmationPage from './pages/ConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import TechnicianPage from './pages/TechnicianPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <div className="bg-fx"></div>
      <div className="bg-noise"></div>
      <Navbar />
      <NotificationPanel />
      <SOSFloatButton />
      <Toast />
      <ProcessingOverlay />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/stations" element={<ProtectedRoute><StationsPage /></ProtectedRoute>} />
        <Route path="/stations/book" element={<ProtectedRoute><StationBookingPage /></ProtectedRoute>} />
        <Route path="/station/:id" element={<ProtectedRoute><StationDetailPage /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
        <Route path="/spare-parts" element={<ProtectedRoute><SparePartsPage /></ProtectedRoute>} />
        <Route path="/sos" element={<ProtectedRoute><SOSPage /></ProtectedRoute>} />

        <Route path="/confirmation" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/technician" element={<ProtectedRoute><TechnicianPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
