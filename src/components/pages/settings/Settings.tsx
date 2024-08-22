// src/Settings.tsx
import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import styles from "./Settings.module.css";
import { auth, db } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../../features/users/currentUserSlice";

interface UserProfile {
  username: string;
  name: string;
  parentType: string;
  description: string;
  currentCompany: string;
  title: string;
  region: string;
  childName: string;
  childGender: string;
  childBirthday: string;
}

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    name: "",
    parentType: "",
    description: "",
    currentCompany: "",
    title: "",
    region: "",
    childName: "",
    childGender: "",
    childBirthday: "",
  });

  const [firebaseProfile, setFirebaseProfile] = useState<UserProfile>({
    username: "",
    name: "",
    parentType: "",
    description: "",
    currentCompany: "",
    title: "",
    region: "",
    childName: "",
    childGender: "",
    childBirthday: "",
  });

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState("저장하기");
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchProfile = async () => {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
          setFirebaseProfile(docSnap.data() as UserProfile);
        }
        setLoading(false);
      };

      fetchProfile();
    }
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    const username = profile.username;
    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await transaction.get(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error("User profile not found");
        }

        const userData = userDocSnap.data();
        const lastUsernameUpdate = userData.lastUsernameUpdate?.toDate();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        // Check if the user has updated the username in the last month
        if (
          profile.username !== firebaseProfile.username &&
          lastUsernameUpdate &&
          lastUsernameUpdate > oneMonthAgo
        ) {
          const diffInTime =
            lastUsernameUpdate.getTime() - oneMonthAgo.getTime();
          const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));
          throw new Error(
            `유저네임은 한 달에 한 번만 변경할 수 있습니다. 남은 일수: ${diffInDays}일.`
          );
        }

        const usernameDocRef = doc(db, "usernames", username);
        const usernameDocSnap = await transaction.get(usernameDocRef);

        // Check if the username exists and is used by another user
        if (
          usernameDocSnap.exists() &&
          usernameDocSnap.data().userId !== userId
        ) {
          throw new Error(
            "유저네임이 존재합니다. 다른 유저네임을 선택해주세요!"
          );
        }

        // If the username has changed, remove the old username
        if (
          firebaseProfile.username &&
          profile.username !== firebaseProfile.username
        ) {
          const oldUsernameDocRef = doc(
            db,
            "usernames",
            firebaseProfile.username
          );
          transaction.delete(oldUsernameDocRef);
        }

        // Set the new username
        transaction.set(usernameDocRef, { userId: userId });

        // Save the user profile to the "users" collection
        if (profile.username !== firebaseProfile.username) {
          transaction.set(userDocRef, {
            ...profile,
            lastUsernameUpdate: serverTimestamp(),
          });
        } else {
          transaction.set(userDocRef, {
            ...profile,
          });
        }
      });
      setFirebaseProfile(profile);
      // Update the Redux store with the new profile
      dispatch(updateProfile(profile));
      setButtonText("저장되었습니다!");
      setTimeout(() => {
        setButtonText("저장하기");
      }, 1500);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("알 수 없는 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>프로필</h1>
      <form className={styles.form}>
        <div className="mb-3">
          <label className="form-label">유저네임 (필수)</label>
          <input
            type="text"
            name="username"
            className="form-control"
            value={profile.username}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ display: "block" }}>
            엄마/아빠
          </label>
          <select
            name="parentType"
            value={profile.parentType}
            onChange={handleChange}
          >
            <option value="">선택하기</option>
            <option value="mom">엄마</option>
            <option value="dad">아빠</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ display: "block" }}>
            지역
          </label>
          <select name="region" value={profile.region} onChange={handleChange}>
            <option value="">선택하기</option>
            <option value="AL">Alabama</option>
            <option value="AK">Alaska</option>
            <option value="AZ">Arizona</option>
            <option value="AR">Arkansas</option>
            <option value="CA">California</option>
            <option value="CO">Colorado</option>
            <option value="CT">Connecticut</option>
            <option value="DE">Delaware</option>
            <option value="DC">District Of Columbia</option>
            <option value="FL">Florida</option>
            <option value="GA">Georgia</option>
            <option value="HI">Hawaii</option>
            <option value="ID">Idaho</option>
            <option value="IL">Illinois</option>
            <option value="IN">Indiana</option>
            <option value="IA">Iowa</option>
            <option value="KS">Kansas</option>
            <option value="KY">Kentucky</option>
            <option value="LA">Louisiana</option>
            <option value="ME">Maine</option>
            <option value="MD">Maryland</option>
            <option value="MA">Massachusetts</option>
            <option value="MI">Michigan</option>
            <option value="MN">Minnesota</option>
            <option value="MS">Mississippi</option>
            <option value="MO">Missouri</option>
            <option value="MT">Montana</option>
            <option value="NE">Nebraska</option>
            <option value="NV">Nevada</option>
            <option value="NH">New Hampshire</option>
            <option value="NJ">New Jersey</option>
            <option value="NM">New Mexico</option>
            <option value="NY">New York</option>
            <option value="NC">North Carolina</option>
            <option value="ND">North Dakota</option>
            <option value="OH">Ohio</option>
            <option value="OK">Oklahoma</option>
            <option value="OR">Oregon</option>
            <option value="PA">Pennsylvania</option>
            <option value="RI">Rhode Island</option>
            <option value="SC">South Carolina</option>
            <option value="SD">South Dakota</option>
            <option value="TN">Tennessee</option>
            <option value="TX">Texas</option>
            <option value="UT">Utah</option>
            <option value="VT">Vermont</option>
            <option value="VA">Virginia</option>
            <option value="WA">Washington</option>
            <option value="WV">West Virginia</option>
            <option value="WI">Wisconsin</option>
            <option value="WY">Wyoming</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">자녀</label>
          <div className={styles.children}>
            <div className="mb-3">
              <label className="form-label">이름/태명</label>
              <input
                type="text"
                name="childName"
                className="form-control"
                value={profile.childName}
                onChange={handleChange}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ display: "block" }}>
                성별
              </label>
              <select
                name="childGender"
                value={profile.childGender}
                onChange={handleChange}
              >
                <option value="">선택하기</option>
                <option value="M">남</option>
                <option value="F">여</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ display: "block" }}>
                생일/예정일
              </label>
              <input
                type="date"
                name="childBirthday"
                value={profile.childBirthday}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!profile.username}
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
};

export default Settings;
