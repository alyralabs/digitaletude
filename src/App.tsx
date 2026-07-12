import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import About from './pages/About'
import Blog from './pages/Blog'
import Home from './pages/Home'
import Music from './pages/Music'
import Photography from './pages/Photography'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'photography', element: <Photography /> },
      { path: 'music', element: <Music /> },
      { path: 'blog', element: <Blog /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
