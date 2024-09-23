import { auth, db, googleProvider } from "../../../config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import googleLogo from "../../../assets/google_icon.png";
import { Button } from "@mui/material";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setUser } from "../../../features/users/currentUserSlice";
import styles from "./Login.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check if the user is already authenticated and redirect to the main page
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userProfile = docSnap.data();
          dispatch(setUser({ id: user.uid, ...userProfile }));
        }
        if (user.emailVerified) {
          navigate("/"); // Redirect to the main page
        } else {
          navigate("/verify");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, dispatch]);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userData = {
          email: user.email,
          name: user.displayName || "",
        };
        await setDoc(docRef, userData);
      }

      dispatch(
        setUser({
          id: user.uid,
          email: user.email!,
        })
      );
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = result.user;

      // Store user information in Firestore
      const userData = {
        email: user.email,
      };
      await setDoc(doc(db, "users", user.uid), userData);

      dispatch(setUser({ id: user.uid, email: user.email! }));
      sendEmailVerification(user);
      navigate("/verify"); // Redirect to the main page
    } catch (error: any) {
      console.error(error);
      switch (error.code) {
        case "auth/email-already-in-use":
          setErrorMessage("이 이메일은 이미 사용 중입니다.");
          break;
        case "auth/invalid-email":
          setErrorMessage("유효한 이메일 주소를 입력해주세요.");
          break;
        case "auth/weak-password":
          setErrorMessage("비밀번호는 최소 6자 이상이어야 합니다.");
          break;
        case "auth/operation-not-allowed":
          setErrorMessage("이메일/비밀번호 계정이 활성화되어 있지 않습니다.");
          break;
        default:
          setErrorMessage("회원가입에 실패했습니다. 다시 시도해주세요.");
          break;
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.header}>회원가입</h2>
        <div className={styles.spacer} />
        {/* Google Sign-in Button */}
        <Button
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            padding: "5px 20px",
            width: "100%",
          }}
          variant="contained"
          onClick={handleGoogleLogin}
          startIcon={
            <img src={googleLogo} alt="Google logo" className={styles.icon} />
          }
        >
          구글로 진행하기
        </Button>

        {/* Divider */}
        <div className={styles.dividerContainer}>
          <hr className={styles.divider} />
          <span className={styles.orText}>또는 이메일로 진행하기</span>
          <hr className={styles.divider} />
        </div>

        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className={styles.emailInput}
          autoComplete="new-email"
        />

        {/* Password Input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className={styles.emailInput}
          autoComplete="new-password"
        />

        {/* Confirm Password Input */}
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="비밀번호 확인"
          className={styles.emailInput}
          autoComplete="new-password"
        />

        {/* Error Message */}
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {/* Sign Up Button */}
        <button
          className={`luckybug-btn ${styles.emailButton}`}
          disabled={!email || !password || !confirmPassword}
          onClick={handleSignup}
        >
          회원가입
        </button>
      </div>
    </div>
  );
};

export default Signup;
