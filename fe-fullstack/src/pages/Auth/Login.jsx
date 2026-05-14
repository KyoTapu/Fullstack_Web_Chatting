import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginForm from "../../components/auth/LoginForm";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (formData) => {
    setLoading(true);
    setError("");

    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg md:grid-cols-2">
        {/* Left */}
        <div className="hidden flex-col justify-center bg-primary px-10 py-12 text-textWhite md:flex">
          <h1 className="mb-4 text-3xl font-bold">Welcome back 👋</h1>

          <p className="text-sm opacity-90">
            Stay connected with friends, teams, and communities through real-time chat and voice calls.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <li>✔ Instant messaging with friends & groups</li>
            <li>✔ High-quality voice and video calls</li>
            <li>✔ Create rooms and connect anytime</li>
          </ul>
        </div>
        {/*Right  */}
        <div className="flex flex-col justify-center px-8 py-12">
          <h2 className="text-2xl font-semibold mb-6">Sign in to your account</h2>

          <LoginForm onSubmit={handleLogin} loading={loading} error={error} />

          <p className="mt-6 text-center text-sm">
            New here?{" "}
            <a href="/register" className="text-primary">
              Create an account
            </a>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
