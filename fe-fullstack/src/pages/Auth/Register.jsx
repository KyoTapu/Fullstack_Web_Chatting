import { Link, Navigate } from "react-router-dom";
import { registerApi } from "../../api/auth.api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;

    setPayload((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (payload.password !== payload.confirmPassword) {
      alert("Password does not match");
      return;
    }

    try {
      setLoading(true);

      await registerApi({
        username: payload.username,
        email: payload.email,
        password: payload.password,
      });

      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-lg md:grid-cols-2">
        {/* Left Block – Branding */}
        <div className="hidden md:flex flex-col justify-center bg-primary px-10 py-12 text-white">
          <h1 className="mb-4 text-3xl font-bold">Connect. Chat. Call.</h1>

          <p className="text-sm opacity-90">
            Join our real-time chat platform to message friends, create groups, and make voice or video calls instantly.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <li>✔ Real-time private & group chat</li>
            <li>✔ Voice and video calls</li>
            <li>✔ Share files, images, and emojis</li>
            <li>✔ Build your own online community</li>
          </ul>
        </div>

        {/* Right Block – Register Form */}
        <div className="flex flex-col justify-center px-8 py-12">
          <header className="mb-6">
            <h2 className="text-2xl font-semibold text-heading">Create your chat account</h2>
            <p className="mt-1 text-sm text-body">Start chatting and calling in real time</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Display name</label>
              <input
                name="username"
                type="text"
                required
                value={payload.username}
                onChange={handleChange}
                placeholder="Your display name"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Email address</label>
              <input
                name="email"
                type="email"
                required
                value={payload.email}
                onChange={handleChange}
                placeholder="you@chatapp.com"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Password</label>
              <input
                name="password"
                type="password"
                required
                value={payload.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-sm font-medium text-heading">Confirm password</label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={payload.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" required className="mt-1 rounded border-border" />
              <span className="text-body">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create chat account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-body">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in to chat
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
