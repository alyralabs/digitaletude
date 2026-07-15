import { createBrowserRouter, redirect, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import RouteError from './components/RouteError'
import Blog, { loader as blogLoader } from './pages/Blog'
import BlogPost, { loader as blogPostLoader } from './pages/BlogPost'
import Music, { loader as musicLoader } from './pages/Music'
import Photography, { loader as photographyLoader } from './pages/Photography'

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
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
