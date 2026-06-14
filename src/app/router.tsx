import { createBrowserRouter } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import HomePage from '../pages/HomePage'
import LocationsPage from '../pages/LocationsPage'
import LocationDetailPage from '../pages/LocationDetailPage'
import LocationFormPage from '../pages/LocationFormPage'
import LoginPage from '../pages/auth/LoginPage'
import SignupEmailPage from '../pages/auth/SignupEmailPage'
import SignupProfilePage from '../pages/auth/SignupProfilePage'
import SignupSuccessPage from '../pages/auth/SignupSuccessPage'
import NotificationsPage from '../pages/NotificationsPage'
import MyPage from '../pages/MyPage'
import PostDetailPage from '../pages/PostDetailPage'
import PostFormPage from '../pages/PostFormPage'
import PostsPage from '../pages/PostsPage'
import ApiStatusPage from '../pages/ApiStatusPage'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup/email', element: <SignupEmailPage /> },
      { path: 'signup/profile', element: <SignupProfilePage /> },
      { path: 'signup/success', element: <SignupSuccessPage /> },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts', element: <PostsPage /> },
      { path: 'posts/new', element: <PostFormPage /> },
      { path: 'posts/:postId', element: <PostDetailPage /> },
      { path: 'api-status', element: <ApiStatusPage /> },
      { path: 'locations', element: <LocationsPage /> },
      { path: 'locations/new', element: <LocationFormPage mode="create" /> },
      { path: 'locations/:locationId', element: <LocationDetailPage /> },
      {
        path: 'locations/:locationId/edit',
        element: <LocationFormPage mode="edit" />,
      },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'mypage', element: <MyPage /> },
    ],
  },
])
