// src/main.jsx
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import './i18n';

// Import components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRouteUser from './components/auth/ProtectedRouteUser.jsx';

import AuthLayout from './pages/AuthLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrganizationsPage from './pages/OrganizationsPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import UserDetailPage from './pages/UserDetailPage.jsx';
import NasPage from './pages/NasPage.jsx';
import RadiusProfilesPage from './pages/RadiusProfilesPage.jsx';
import OnlineUsersPage from './pages/OnlineUsersPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AdminsPage from './pages/AdminsPage.jsx';
import AdminProfilePage from './pages/AdminProfilePage.jsx';
import AttributeManagementPage from './pages/AttributeManagementPage.jsx';
import AdvertisementPage from './pages/AdvertisementPage.jsx';
import CustomizationPage from './pages/CustomizationPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import VoucherPackagesPage from './pages/VoucherPackagesPage.jsx';
import VoucherBatchesPage from './pages/VoucherBatchesPage.jsx';
import VoucherPrintPage from './pages/VoucherPrintPage.jsx';
import ExternalLoginPage from './pages/ExternalLoginPage.jsx';
import AdLandingPage from './pages/AdLandingPage.jsx';
import UserPortalLoginPage from './pages/UserPortalLoginPage.jsx';
import UserPortalDashboardPage from './pages/UserPortalDashboardPage.jsx';
import LoggedOutPage from './pages/LoggedOutPage.jsx';
import LogManagementPage from './pages/LogManagementPage.jsx';
import MikrotikApiPage from './pages/MikrotikApiPage.jsx';
import MikrotikGroupsPage from './pages/MikrotikGroupsPage.jsx';
import IpBindingsPage from './pages/IpBindingsPage.jsx';
import LoginRegistrationSettingsPage from './pages/LoginRegistrationSettingsPage.jsx';


const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'user-login', element: <ExternalLoginPage /> },
          { path: 'portal/login', element: <UserPortalLoginPage /> },
          { path: 'portal/logged-out', element: <LoggedOutPage /> },
        ]
      },
      {
        path: '/ad-landing',
        element: <AdLandingPage />,
      },
      // --- Admin Routes ---
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'vouchers/batches/:id', element: <VoucherPrintPage /> },
          {
            element: <MainLayout />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'organizations', element: <OrganizationsPage /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'users/:username', element: <UserDetailPage /> },
              { path: 'history', element: <HistoryPage /> },
              { path: 'online-users', element: <OnlineUsersPage /> },
              { path: 'admins', element: <AdminsPage /> },
              { path: 'attribute-management', element: <AttributeManagementPage /> },
              { path: 'advertisements', element: <AdvertisementPage /> },
              { path: 'customization', element: <CustomizationPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'login-registration', element: <LoginRegistrationSettingsPage /> },
              { path: 'vouchers/packages', element: <VoucherPackagesPage /> },
              { path: 'vouchers/batches', element: <VoucherBatchesPage /> },
              { path: 'account-settings', element: <AdminProfilePage /> },
              { path: 'radius-profiles', element: <RadiusProfilesPage /> },
              { path: 'log-management', element: <LogManagementPage /> },
              { path: 'mikrotik/groups', element: <MikrotikGroupsPage /> },
              { path: 'mikrotik/bindings', element: <IpBindingsPage /> },
            ]
          }
        ]
      },
      // --- User Portal Routes (Protected) ---
      {
          path: 'portal',
          element: <ProtectedRouteUser />,
          children: [
              { path: 'dashboard', element: <UserPortalDashboardPage /> },
          ]
      },
      { index: true, element: <Navigate to="/dashboard" replace /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback="Loading...">
      <RouterProvider router={router} />
    </Suspense>
  </React.StrictMode>,
);