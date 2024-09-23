import { useSelector } from "react-redux";
import { RootState } from "./app/store";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "./config/firebase";

const PrivateRoutes2 = () => {
  const user = useSelector((state: RootState) => state.currentUser.user);
  const firebaseUser = auth.currentUser;
  if (firebaseUser && !firebaseUser.emailVerified) {
    return <Navigate to="/verify" />;
  }
  return user.id ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoutes2;
