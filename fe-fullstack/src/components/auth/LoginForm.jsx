// components/auth/LoginForm.jsx
import { useState } from "react";
import ErrorMessage from "../ui/showMessage/ErrorMessage";

const LoginForm = ({ onSubmit, loading, error }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setForm({ ...form, rememberMe: checked });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Email */}
      <div>
        <label className="mb-1 block text-sm font-medium text-heading">Email address</label>
        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="enter your email"
          className="w-full rounded-lg border px-4 py-2.5 text-sm"
        />
      </div>

      {/* Password */}
      <div>
        <label className="mb-1 block text-sm font-medium text-heading">Password</label>
        <input
          name="password"
          type="password"
          required
          value={form.password}
          placeholder="enter password"
          onChange={handleChange}
          className="w-full rounded-lg border px-4 py-2.5 text-sm"
        />
      </div>

      {/* Options */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.rememberMe} onChange={handleCheckboxChange} />
          Stay signed in
        </label>

        <a href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </a>
      </div>

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
};

export default LoginForm;
