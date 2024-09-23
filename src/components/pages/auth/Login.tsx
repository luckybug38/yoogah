import { auth, db, googleProvider } from "../../../config/firebase";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import googleLogo from "../../../assets/google_icon.png";
import { Button } from "@mui/material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setUser } from "../../../features/users/currentUserSlice";
import styles from "./Login.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [resetMessage, setResetMessage] = useState(""); // State for reset message

  // Check if the user is already authenticated and redirect to the main page
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is already logged in, retrieve user data from Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userProfile = docSnap.data();
          const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
            userProfile;
          dispatch(
            setUser({
              id: user.uid,
              imageUrl: user.photoURL || undefined,
              ...userProfileWithoutTimestamp,
            })
          );
        }
        navigate("/"); // Redirect to the main page
      }
    });

    return () => unsubscribe(); // Cleanup the subscription when the component unmounts
  }, [navigate, dispatch]);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert("로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.");
    }
  };

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
            imageUrl: user.photoURL || undefined,
            ...userProfileWithoutTimestamp,
          })
        );
      }
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage(
        "비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인하세요."
      );
    } catch (error: any) {
      console.error(error);
      setResetMessage(
        "비밀번호 재설정 이메일을 보내는 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.header}>로그인</h2>
        <p className={styles.subtitle}>
          이메일 또는 원하는 방식으로 로그인 해주세요
        </p>

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
        <p className={styles.termsText}>
          계정이 없으신가요?{" "}
          <a href="/signup" className={styles.link}>
            회원가입
          </a>
        </p>
        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className={styles.emailInput}
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className={styles.emailInput}
          autoComplete="current-password"
        />
        {/* Continue with Email Button */}
        <p className={styles.termsText}>
          <span className={styles.link} onClick={handlePasswordReset}>
            비밀번호를 잊으셨나요?
          </span>
        </p>

        {/* Display Reset Message */}
        {resetMessage && <p className={styles.resetMessage}>{resetMessage}</p>}

        <button
          className={`luckybug-btn ${styles.emailButton}`}
          disabled={!email}
          onClick={handleLogin}
        >
          로그인
        </button>

        {/* Terms of Use and Privacy Policy
        <p className={styles.termsText}>
          By signing in, I agree to the{" "}
          <a href="#" className={styles.link}>
            Terms of Use
          </a>{" "}
          and acknowledge having read the{" "}
          <a href="#" className={styles.link}>
            Privacy Policy
          </a>
        </p> */}
      </div>
    </div>
  );
};

export default Login;
