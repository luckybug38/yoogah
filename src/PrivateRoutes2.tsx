import { useSelector } from "react-redux";
import { RootState } from "./app/store";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoutes2 = () => {
  const user = useSelector((state: RootState) => state.currentUser.user);
  return user.id ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoutes2;
