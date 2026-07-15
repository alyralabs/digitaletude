import { createBrowserRouter, redirect, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import RouteError from './components/RouteError'
import {
  blogLoader,
  blogPostLoader,
  musicLoader,
  photographyLoader,
} from './lib/loaders'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      // Home/About were placeholders — removed until there's real content;
      // the blog is the landing page for now.
      { index: true, loader: () => redirect('/blog') },
      {
        path: 'photography',
        loader: photographyLoader,
        lazy: {
          Component: () => import('./pages/Photography').then((m) => m.default),
        },
        errorElement: <RouteError />,
      },
      {
        path: 'music',
        loader: musicLoader,
        lazy: {
          Component: () => import('./pages/Music').then((m) => m.default),
        },
        errorElement: <RouteError />,
      },
      {
        path: 'blog',
        loader: blogLoader,
        lazy: {
          Component: () => import('./pages/Blog').then((m) => m.default),
        },
        errorElement: <RouteError />,
      },
      {
        path: 'blog/:slug',
        loader: blogPostLoader,
        lazy: {
          Component: () => import('./pages/BlogPost').then((m) => m.default),
        },
        errorElement: <RouteError />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
