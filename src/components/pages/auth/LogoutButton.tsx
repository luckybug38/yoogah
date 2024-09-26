import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../config/firebase";
import { useDispatch } from "react-redux";
import { clearUserData } from "../../../features/users/currentUserSlice";

const LogoutButton = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <button
      className="luckybug-btn luckybug-red"
      onClick={() => {
        auth.signOut();
        dispatch(clearUserData());
      }}
    >
      로그아웃
    </button>
  );
};

export default LogoutButton;
