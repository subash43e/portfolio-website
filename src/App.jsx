import "./index.css";
import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";

import CreateBlog from "./components/CreateBlog";
import EditProfile from "./components/EditProfile";
import BlogDetail from "./components/BlogDetail";
import BlogManagement from "./components/BlogManagement";
import BlogEdit from "./components/BlogEdit";
import { StoreProvider } from "./contexts/StoreContext";

// Lazy load components for code splitting
const Home = lazy(() => import("./components/Home"));
const Blog = lazy(() => import("./components/Blog"));
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const PrivateRoute = lazy(() => import("./components/PrivateRoute"));

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {

      console.log(location.hash);
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Header />
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-screen bg-slate-900 text-slate-100">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route
            path="/owner"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/owner/login" element={<AdminLogin />} />
          <Route
            path="/owner/profile"
            element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/blogs/management"
            element={
              <PrivateRoute>
                <BlogManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/blog/create/"
            element={
              <PrivateRoute>
                <CreateBlog />
              </PrivateRoute>
            }
          />
          <Route
            path="/owner/blog/edit/:id"
            element={
              <PrivateRoute>
                <BlogEdit />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Router>
          <AppContent />
        </Router>
      </StoreProvider>
    </AuthProvider>
  );
}
