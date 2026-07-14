import type { ComponentType } from 'react'
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
  type LoaderFunction,
} from 'react-router'
import Layout from './components/Layout'
import RouteError from './components/RouteError'
import About from './pages/About'
import Blog, { loader as blogLoader } from './pages/Blog'
import BlogPost, { loader as blogPostLoader } from './pages/BlogPost'
import Home from './pages/Home'
import Music, { loader as musicLoader } from './pages/Music'
import Photography, { loader as photographyLoader } from './pages/Photography'

// Admin pages are behind auth and cold-loaded, so they're the natural
// code-split boundary: react-router's per-route `lazy` keeps them (and
// their logic) out of the public bundle entirely. Our admin modules export
// `default` (component) + optionally `loader`; this adapts that shape to
// the route-properties object `lazy` expects.
function lazyAdmin(
  load: () => Promise<{ default: ComponentType; loader?: LoaderFunction }>,
) {
  return async () => {
    const { default: Component, loader } = await load()
    return loader ? { Component, loader } : { Component }
  }
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
      {
        path: 'blog',
        element: <Blog />,
        loader: blogLoader,
        errorElement: <RouteError />,
      },
      {
        path: 'blog/:slug',
        element: <BlogPost />,
        loader: blogPostLoader,
        errorElement: <RouteError />,
      },
      {
        path: 'admin/login',
        lazy: lazyAdmin(() => import('./pages/admin/AdminLogin')),
      },
      {
        path: 'admin',
        lazy: lazyAdmin(() => import('./pages/admin/AdminLayout')),
        errorElement: <RouteError />,
        children: [
          { index: true, loader: () => redirect('/admin/photos') },
          {
            path: 'photos',
            lazy: lazyAdmin(() => import('./pages/admin/PhotosAdmin')),
            errorElement: <RouteError />,
          },
          {
            path: 'music',
            lazy: lazyAdmin(() => import('./pages/admin/MusicAdmin')),
            errorElement: <RouteError />,
          },
          {
            path: 'posts',
            lazy: lazyAdmin(() => import('./pages/admin/PostsAdmin')),
            errorElement: <RouteError />,
          },
          {
            path: 'posts/new',
            lazy: lazyAdmin(() => import('./pages/admin/PostEditor')),
            errorElement: <RouteError />,
          },
          {
            path: 'posts/:id',
            lazy: lazyAdmin(() => import('./pages/admin/PostEditor')),
            errorElement: <RouteError />,
          },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
