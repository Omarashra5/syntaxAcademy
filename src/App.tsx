import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedAdminRoute, ProtectedStudentRoute } from './components/common/RouteGuards';
import { AdminLayout } from './components/layout/AdminLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';

const HomePage = lazy(() =>
  import('./pages/public/HomePage').then((m) => ({ default: m.HomePage }))
);
const TrackDetailsPage = lazy(() =>
  import('./pages/public/TrackDetailsPage').then((m) => ({ default: m.TrackDetailsPage }))
);
const VerifyCertificatePage = lazy(() =>
  import('./pages/public/VerifyCertificatePage').then((m) => ({
    default: m.VerifyCertificatePage,
  }))
);
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);

const StudentOverviewPage = lazy(() =>
  import('./pages/student/StudentOverviewPage').then((m) => ({ default: m.StudentOverviewPage }))
);
const StudentApplicationsPage = lazy(() =>
  import('./pages/student/StudentApplicationsPage').then((m) => ({
    default: m.StudentApplicationsPage,
  }))
);
const StudentCoursesPage = lazy(() =>
  import('./pages/student/StudentCoursesPage').then((m) => ({ default: m.StudentCoursesPage }))
);
const CoursePlayerPage = lazy(() =>
  import('./pages/student/CoursePlayerPage').then((m) => ({ default: m.CoursePlayerPage }))
);
const StudentCertificatesPage = lazy(() =>
  import('./pages/student/StudentCertificatesPage').then((m) => ({
    default: m.StudentCertificatesPage,
  }))
);
const StudentProfilePage = lazy(() =>
  import('./pages/student/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage }))
);

const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminOverviewPage = lazy(() =>
  import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage }))
);
const AdminApplicationsPage = lazy(() =>
  import('./pages/admin/AdminApplicationsPage').then((m) => ({
    default: m.AdminApplicationsPage,
  }))
);
const AdminTracksPage = lazy(() =>
  import('./pages/admin/AdminTracksPage').then((m) => ({ default: m.AdminTracksPage }))
);
const AdminInstructorsPage = lazy(() =>
  import('./pages/admin/AdminInstructorsPage').then((m) => ({ default: m.AdminInstructorsPage }))
);
const AdminCoursesPage = lazy(() =>
  import('./pages/admin/AdminCoursesPage').then((m) => ({ default: m.AdminCoursesPage }))
);
const AdminCertificatesPage = lazy(() =>
  import('./pages/admin/AdminCertificatesPage').then((m) => ({
    default: m.AdminCertificatesPage,
  }))
);
const AdminStudentsPage = lazy(() =>
  import('./pages/admin/AdminStudentsPage').then((m) => ({ default: m.AdminStudentsPage }))
);
const AdminPaymentsPage = lazy(() =>
  import('./pages/admin/AdminPaymentsPage').then((m) => ({ default: m.AdminPaymentsPage }))
);
const AdminAnnouncementsPage = lazy(() =>
  import('./pages/admin/AdminAnnouncementsPage').then((m) => ({
    default: m.AdminAnnouncementsPage,
  }))
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070912]">
    <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    {/* Public Website Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tracks/:slug" element={<TrackDetailsPage />} />
                    <Route path="/courses/:courseId" element={<CoursePlayerPage />} />
                    <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
                    <Route
                      path="/verify-certificate/:certificateId"
                      element={<VerifyCertificatePage />}
                    />

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected Student Dashboard */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedStudentRoute>
                          <StudentLayout />
                        </ProtectedStudentRoute>
                      }
                    >
                      <Route index element={<StudentOverviewPage />} />
                      <Route path="applications" element={<StudentApplicationsPage />} />
                      <Route path="courses" element={<StudentCoursesPage />} />
                      <Route path="certificates" element={<StudentCertificatesPage />} />
                      <Route path="profile" element={<StudentProfilePage />} />
                    </Route>

                    {/* Separate Admin Login & Protected Admin Dashboard */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedAdminRoute>
                          <AdminLayout />
                        </ProtectedAdminRoute>
                      }
                    >
                      <Route index element={<AdminOverviewPage />} />
                      <Route path="applications" element={<AdminApplicationsPage />} />
                      <Route path="tracks" element={<AdminTracksPage />} />
                      <Route path="instructors" element={<AdminInstructorsPage />} />
                      <Route path="courses" element={<AdminCoursesPage />} />
                      <Route path="certificates" element={<AdminCertificatesPage />} />
                      <Route path="students" element={<AdminStudentsPage />} />
                      <Route path="payments" element={<AdminPaymentsPage />} />
                      <Route path="announcements" element={<AdminAnnouncementsPage />} />
                      <Route path="settings" element={<AdminSettingsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
