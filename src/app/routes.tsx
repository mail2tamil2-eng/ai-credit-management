import { createBrowserRouter, Navigate } from 'react-router';
import TranslationsPage from './pages/TranslationsPage';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CoursesPage } from './pages/CoursesPage';
import { AICreateCoursePage } from './pages/AICreateCoursePage';
import AICreditLayout from './pages/AICreditLayout';
import TenantCreditPage from './pages/TenantCreditPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'courses/:courseId/translations', element: <TranslationsPage /> },
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'courses',
        element: <CoursesPage />,
      },
      {
        path: 'ai-create-course',
        element: <AICreateCoursePage />,
      },
    ],
  },
  {
    path: '/ai-credits',
    element: <AICreditLayout />,
    children: [
      { index: true, element: <TenantCreditPage /> },
    ],
  },
]);