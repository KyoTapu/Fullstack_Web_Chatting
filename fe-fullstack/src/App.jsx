import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Friends from "./pages/Friends";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile/Profile";
import About from "./pages/About";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import MainLayout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import DumbPage from "./pages/DumbPage";

import { CallProvider } from "./context/CallProvider";
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider } from "./context/SettingsContext";
import Call from "./pages/Call/Call";

const App = () => {
  return (
    <SettingsProvider>
      <CallProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Call />

            <Routes>
              {/* Public layout */}
              <Route element={<MainLayout />}>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />

                <Route path="/about" element={<About />} />
                <Route path="/dumbpage" element={<DumbPage />} />

                {/* Protected routes */}
                <Route
                  path="/friends"
                  element={
                    <ProtectedRoute>
                      <Friends />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* No layout */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </CallProvider>
    </SettingsProvider>
  );
};

export default App;
