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
import ProfilesPage from './pages/ProfilesPage.jsx';
import OnlineUsersPage from './pages/OnlineUsersPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />, // 1. เช็คว่า Login หรือยัง
        children: [
          {
            element: <MainLayout />, // 2. ถ้า Login แล้ว ให้แสดง Layout หลัก
            children: [
              // 3. หน้าต่างๆ ที่จะแสดงใน <Outlet /> ของ MainLayout
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'organizations', element: <OrganizationsPage /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'users/:username', element: <UserDetailPage /> },
              { path: 'history', element: <HistoryPage /> },
              { path: 'nas', element: <NasPage /> },
              { path: 'online-users', element: <OnlineUsersPage /> },
              { path: 'profiles', element: <ProfilesPage /> },
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