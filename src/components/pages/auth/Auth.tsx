import { auth, db, googleProvider } from "../../../config/firebase";
import { signInWithPopup } from "firebase/auth";
import googleLogo from "../../../assets/google_icon.png";
import "./Auth.css";
import { Button } from "@mui/material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setUser } from "../../../features/users/currentUserSlice";

const styles = {
  icon: {
    marginRight: "10px",
    height: "30px",
    width: "30px",
  },
};
const Auth = () => {
  const dispatch = useDispatch();
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        var userData;
        if (user.displayName) {
          userData = { email: user.email, name: user.displayName };
        } else {
          userData = { email: user.email };
        }
        await setDoc(docRef, userData);
      }
      const docSnapNew = await getDoc(docRef);
      if (docSnapNew.exists()) {
        const userProfile = docSnapNew.data();
        const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
          userProfile;
        dispatch(
          setUser({
            id: user.uid,
            photoURL: user.photoURL || undefined,
            ...userProfileWithoutTimestamp,
          })
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <Button
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: "5px 20px",
        }}
        variant="contained"
        onClick={handleGoogleLogin}
        startIcon={
          <img src={googleLogo} alt="Google logo" style={styles.icon} />
        }
      >
        Login
      </Button>
      {/* </div> */}
    </div>
  );
};

export default Auth;
