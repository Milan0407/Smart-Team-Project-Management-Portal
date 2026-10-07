import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import {
  useLoginMutation,
  useLoginWithOtpMutation,
  useSendLoginOtpMutation,
} from "./authApiSlice";

const Login = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loginMode, setLoginMode] = useState("password");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading }] = useLoginMutation();
  const [loginWithOtp, { isLoading: isOtpLoginLoading }] =
    useLoginWithOtpMutation();
  const [sendLoginOtp, { isLoading: isSendingOtp }] =
    useSendLoginOtpMutation();

  const finishLogin = (res) => {
    const { user, accessToken, refreshToken } = res.data;
    dispatch(setCredentials({ accessToken, user }));
    localStorage.setItem("refreshToken", refreshToken);
    const redirect = searchParams.get("redirect") || "/";
    navigate(redirect);
  };

  const handleSendOtp = async () => {
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Enter your email address first");
      return;
    }

    try {
      const res = await sendLoginOtp({ email }).unwrap();
      if (res.success) {
        setMessage("Login OTP sent to your email. It expires in 10 minutes.");
      } else {
        setError(res.message || "Could not send OTP");
      }
    } catch (err) {
      setError(
        err?.data?.message ||
          "Could not send OTP. Check your email and try again."
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const res =
        loginMode === "otp"
          ? await loginWithOtp({ email, otp }).unwrap()
          : await login({ email, password }).unwrap();

      if (res.success) {
        finishLogin(res);
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err) {
      setError(err?.data?.message || "Invalid credentials or server error");
    }
  };

  const switchMode = (mode) => {
    setLoginMode(mode);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 relative overflow-hidden">
      <div className="absolute top-1/10 left-1/10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/10 right-1/10 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse duration-[8000ms]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950/45 border border-slate-800/80 backdrop-blur-2xl shadow-2xl relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-medium">
            Sign in to access your team workspace portal
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold text-center animate-shake">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 mb-6 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/65 border border-slate-800/80 p-1">
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                loginMode === "password"
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode("otp")}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                loginMode === "otp"
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              OTP
            </button>
          </div>

          <div>
            <label className="block text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className={loginMode === "otp" ? "flex gap-2" : ""}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="min-w-0 w-full px-4 py-3 rounded-xl bg-slate-950/65 border border-slate-800/80 text-slate-100 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                placeholder="name@company.com"
              />
              {loginMode === "otp" && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="shrink-0 px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition-all disabled:opacity-50"
                >
                  {isSendingOtp ? "Sending..." : "Send OTP"}
                </button>
              )}
            </div>
          </div>

          {loginMode === "password" ? (
            <div>
              <label className="block text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/65 border border-slate-800/80 text-slate-100 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                placeholder="********"
              />
            </div>
          ) : (
            <div>
              <label className="block text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                Email OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950/65 border border-slate-800/80 text-slate-100 text-sm focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-slate-500 shadow-inner"
                placeholder="6 digit code"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isOtpLoginLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01]"
          >
            {isLoading || isOtpLoginLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-slate-400 text-xs font-medium">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-bold"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
