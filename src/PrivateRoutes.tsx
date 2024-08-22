import { useSelector } from "react-redux";
import { RootState } from "./app/store";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoutes = () => {
  const user = useSelector((state: RootState) => state.currentUser.user);
  return user.id && !user.username ? <Navigate to="/settings" /> : <Outlet />;
};

export default PrivateRoutes;
