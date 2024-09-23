import { useEffect, useState } from "react";
import { auth } from "../../../config/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import styles from "./VerifyEmail.module.css";

const VerifyEmail = () => {
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Function to check if email is verified
  const checkEmailVerification = async () => {
    const user = auth.currentUser;
    if (user) {
      await user.reload(); // Refresh the user's data
      console.log(user);
      if (user.emailVerified) {
        navigate("/"); // Redirect to home page once email is verified
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(checkEmailVerification, 3000); // Check every 3 seconds
    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  const handleResendVerificationEmail = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        setIsVerificationSent(true);
        setErrorMessage(""); // Clear any previous error messages
      } catch (error: any) {
        console.error(error);
        setErrorMessage(
          "이메일 재전송에 실패했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.header}>이메일 인증</h2>
        <p className={styles.subtitle}>
          회원가입을 완료하려면 이메일을 확인하고 인증 링크를 클릭해주세요.
        </p>

        {isVerificationSent ? (
          <p className={styles.successMessage}>
            인증 이메일이 재전송되었습니다. 이메일을 확인하세요.
          </p>
        ) : (
          <button
            className={`luckybug-btn ${styles.emailButton}`}
            onClick={handleResendVerificationEmail}
          >
            인증 이메일 다시 보내기
          </button>
        )}

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;
