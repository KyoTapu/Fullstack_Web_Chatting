import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // ⏳ Chờ restore session xong
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // 🚫 Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Đã đăng nhập
  return children;
}
