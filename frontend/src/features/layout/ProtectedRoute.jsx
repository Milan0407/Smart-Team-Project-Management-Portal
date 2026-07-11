import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../auth/authSlice";

const ProtectedRoute = () => {
  const token = useSelector(selectCurrentToken);

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
