import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CameraAttendance from "./pages/CameraAttendance";
import RegisterStudent from "./pages/RegisterStudent";
import StudentManagement from "./pages/StudentManagement";
import AttendanceRecords from "./pages/AttendanceRecords";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: "14px" } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/attendance-camera" element={<ProtectedRoute><CameraAttendance /></ProtectedRoute>} />
          <Route path="/register" element={<ProtectedRoute><RegisterStudent /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentManagement /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><AttendanceRecords /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
