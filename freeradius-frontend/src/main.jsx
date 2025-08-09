// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// Import components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

// Import pages
import LoginPage from './pages/LoginPage.jsx';
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
import RegisterPage from './pages/RegisterPage.jsx';
import AttributeManagementPage from './pages/AttributeManagementPage.jsx';
import CustomizationPage from './pages/CustomizationPage.jsx';
import VoucherPackagesPage from './pages/VoucherPackagesPage.jsx';
import VoucherBatchesPage from './pages/VoucherBatchesPage.jsx';
import VoucherPrintPage from './pages/VoucherPrintPage.jsx';
import ExternalLoginPage from './pages/ExternalLoginPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'user-login', element: <ExternalLoginPage /> },
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
              { path: 'nas', element: <NasPage /> },
              { path: 'online-users', element: <OnlineUsersPage /> },
              { path: 'admins', element: <AdminsPage /> },
              { path: 'attribute-management', element: <AttributeManagementPage /> },
              { path: 'customization', element: <CustomizationPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: 'vouchers/packages', element: <VoucherPackagesPage /> },
              { path: 'vouchers/batches', element: <VoucherBatchesPage /> },
              { path: 'account-settings', element: <AdminProfilePage /> },
              { path: 'radius-profiles', element: <RadiusProfilesPage /> },
            ]
          }
        ]
      },
      { index: true, element: <Navigate to="/dashboard" replace /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);