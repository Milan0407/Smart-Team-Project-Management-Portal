import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentToken, selectCurrentUser, clearCredentials } from "../auth/authSlice";
import { useLogoutMutation } from "../auth/authApiSlice";
import { useAcceptInvitationMutation, useGetInvitationDetailsQuery } from "./orgApiSlice";
import { Building, ShieldAlert, CheckCircle, ArrowRight, LogIn, UserPlus, LogOut, Loader2 } from "lucide-react";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectCurrentToken);
  const currentUser = useSelector(selectCurrentUser);

  const { data: inviteDetailsRes, isLoading: detailsLoading, isError: detailsError } = useGetInvitationDetailsQuery(token, {
    skip: !token
  });
  const inviteDetails = inviteDetailsRes?.data;

  const [acceptInvitation, { isLoading, isSuccess, isError }] = useAcceptInvitationMutation();
  const [logout] = useLogoutMutation();
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (token) {
      localStorage.setItem("pendingInviteToken", token);
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      const result = await acceptInvitation({ token }).unwrap();
      setStatusMessage("Successfully joined organization!");
      localStorage.removeItem("pendingInviteToken");
      setTimeout(() => {
        navigate(`/orgs/${result.data._id}/dashboard`);
      }, 2000);
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setStatusMessage(err?.data?.message || "Failed to accept invitation. The link may be invalid or expired.");
    }
  };

  const handleLogoutAndRedirect = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      try {
        await logout(refreshToken).unwrap();
      } catch (err) {
        console.error("Failed to revoke current session during account switch", err);
      }
    }

    dispatch(clearCredentials());
    navigate(`/login?redirect=/accept-invite?token=${token}&email=${inviteDetails?.email}`);
  };

  // 1. Missing Token State
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800/80 bg-slate-950/45 p-8 text-center backdrop-blur-2xl shadow-2xl">
          <ShieldAlert className="mx-auto h-16 w-16 text-rose-500/80 animate-pulse" />
          <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
            Invalid Invite Link
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            No invitation token was found in the URL. Please make sure you copied the entire link from your email inbox.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading Invitation Details
  if (detailsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800/80 bg-slate-950/45 p-8 text-center backdrop-blur-2xl shadow-2xl flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs text-slate-400 font-semibold mt-2">Loading invitation details...</p>
        </div>
      </div>
    );
  }

  // 3. Invitation Expired / Invalid
  if (detailsError || !inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800/80 bg-slate-950/45 p-8 text-center backdrop-blur-2xl shadow-2xl">
          <ShieldAlert className="mx-auto h-16 w-16 text-rose-500/80" />
          <h2 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent">
            Invitation Expired or Invalid
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            The invitation link is expired, invalid, or has already been accepted. Please request the administrator to send a new invitation.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isMismatch = isLoggedIn && currentUser && inviteDetails && currentUser.email.toLowerCase() !== inviteDetails.email.toLowerCase();

  // 4. Account Mismatch Mismatched Logged-In User
  if (isMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-amber-500/30 bg-slate-950/45 p-8 text-center backdrop-blur-2xl shadow-2xl animate-fadeIn">
          <ShieldAlert className="mx-auto h-14 w-14 text-amber-500/90 animate-pulse" />
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold tracking-tight text-amber-500">Account Mismatch</h2>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              This invitation to join <strong>{inviteDetails.orgName}</strong> was sent to:
            </p>
            <p className="text-xs font-bold text-slate-200 bg-secondary/60 border border-border/80 p-2 rounded-xl inline-block mt-1 font-mono">
              {inviteDetails.email}
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium pt-2">
              However, you are currently signed in as:
            </p>
            <p className="text-xs font-bold text-amber-400/90 bg-amber-500/5 border border-amber-500/20 p-2 rounded-xl inline-block font-mono">
              {currentUser.email}
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={handleLogoutAndRedirect}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all hover:shadow-lg hover:shadow-amber-500/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Continue Invitation
            </button>
            <Link
              to="/"
              className="block w-full py-3 px-4 border border-border/80 hover:bg-secondary/45 text-xs text-slate-300 font-bold rounded-xl transition-all"
            >
              Ignore & Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Not Logged In State
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800/80 bg-slate-950/45 p-8 text-center backdrop-blur-2xl shadow-2xl animate-fadeIn">
          <Building className="mx-auto h-16 w-16 text-primary opacity-80" />
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-200">You've Been Invited!</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
              You are invited to join <strong>{inviteDetails.orgName}</strong> as a <strong>{inviteDetails.role.replace("_", " ")}</strong>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Link
              to={`/login?redirect=/accept-invite?token=${token}&email=${inviteDetails.email}`}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-800/80 bg-slate-950/65 hover:bg-slate-900 text-xs font-bold text-slate-200 transition-all hover:shadow-md"
            >
              <LogIn className="w-4 h-4 text-primary" />
              Log In
            </Link>
            <Link
              to={`/register?redirect=/accept-invite?token=${token}&email=${inviteDetails.email}`}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 6. Ready to Accept State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800/80 bg-slate-950/45 p-8 text-center backdrop-blur-2xl shadow-2xl animate-fadeIn">
        <Building className="mx-auto h-16 w-16 text-primary opacity-90 animate-pulse" />
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-200">Join {inviteDetails.orgName}</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
            You are signed in as <span className="font-bold text-slate-200">{currentUser.email}</span>. Click below to accept the invitation and enter the workspace as a <strong>{inviteDetails.role.replace("_", " ")}</strong>.
          </p>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold animate-fadeIn">
            <CheckCircle className="w-5 h-5 animate-bounce" />
            <span>{statusMessage}</span>
            <span className="text-[10px] text-emerald-500/75">Redirecting to workspace dashboard...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold animate-shake">
            <ShieldAlert className="w-5 h-5" />
            <span>{statusMessage}</span>
          </div>
        ) : null}

        {!isSuccess && (
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept & Join Organization"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
