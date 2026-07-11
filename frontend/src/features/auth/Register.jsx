import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { useRegisterMutation } from "./authApiSlice";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [register, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await register({ name, email, password }).unwrap();
      if (res.success) {
        const { user, accessToken, refreshToken } = res.data;
        dispatch(setCredentials({ accessToken, user }));
        localStorage.setItem("refreshToken", refreshToken);
        const redirect = searchParams.get("redirect") || "/";
        navigate(redirect);
      } else {
        setError(res.message || "Registration failed");
      }
    } catch (err) {
      setError(err?.data?.message || "Registration failed. Check details or email conflicts.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/10 left-1/10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/10 right-1/10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse duration-[8000ms]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950/45 border border-slate-800/80 backdrop-blur-2xl shadow-2xl relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Get Started
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-medium">
            Create an enterprise-grade user profile
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/65 border border-slate-800/80 text-slate-100 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-slate-500 shadow-inner"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/65 border border-slate-800/80 text-slate-100 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-slate-500 shadow-inner"
              placeholder="john@company.com"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/65 border border-slate-800/80 text-slate-100 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-slate-500 shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/65 border border-slate-800/80 text-slate-100 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-slate-500 shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01]"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-slate-400 text-xs font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-bold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
