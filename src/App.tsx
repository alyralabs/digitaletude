import { createBrowserRouter, redirect, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import RouteError from './components/RouteError'
import About from './pages/About'
import AdminLayout, { loader as adminLoader } from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import MusicAdmin, {
  loader as musicAdminLoader,
} from './pages/admin/MusicAdmin'
import PhotosAdmin, {
  loader as photosAdminLoader,
} from './pages/admin/PhotosAdmin'
import Blog from './pages/Blog'
import Home from './pages/Home'
import Music, { loader as musicLoader } from './pages/Music'
import Photography, { loader as photographyLoader } from './pages/Photography'

function AdminStub() {
  return <p className="text-muted-color">Not built yet — next cycle.</p>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      {
        path: 'photography',
        element: <Photography />,
        loader: photographyLoader,
        errorElement: <RouteError />,
      },
      {
        path: 'music',
        element: <Music />,
        loader: musicLoader,
        errorElement: <RouteError />,
      },
      { path: 'blog', element: <Blog /> },
      { path: 'admin/login', element: <AdminLogin /> },
      {
        path: 'admin',
        element: <AdminLayout />,
        loader: adminLoader,
        errorElement: <RouteError />,
        children: [
          { index: true, loader: () => redirect('/admin/photos') },
          {
            path: 'photos',
            element: <PhotosAdmin />,
            loader: photosAdminLoader,
            errorElement: <RouteError />,
          },
          {
            path: 'music',
            element: <MusicAdmin />,
            loader: musicAdminLoader,
            errorElement: <RouteError />,
          },
          { path: 'posts', element: <AdminStub /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
