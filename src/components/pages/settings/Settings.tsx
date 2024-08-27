import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styles from "./Settings.module.css";
import { auth, db, storage } from "../../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../../features/users/currentUserSlice";
import imageCompression from "browser-image-compression";
import "react-image-crop/dist/ReactCrop.css";
import defaultProfilePic from "../../../assets/bom.jpeg"; // Import default image
import CropModal from "./CropModal"; // Import CropModal component

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
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const [showCropModal, setShowCropModal] = useState(false); // Control modal visibility

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

        const profilePicRef = ref(storage, `profilePictures/${userId}`);
        try {
          const url = await getDownloadURL(profilePicRef);
          setProfilePictureUrl(url);
        } catch (error) {
          console.log("No profile picture found, using default.");
          setProfilePictureUrl(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setPreviewUrl(reader.result as string);
        setShowCropModal(true); // Show the modal after selecting an image
      });
      reader.readAsDataURL(file);

      // Reset the file input value to allow re-selection of the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  function blobToFile(blob: Blob, fileName: string): File {
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  }
  const handleCropConfirm = async (croppedImage: Blob) => {
    if (!userId) return;

    try {
      const compressedImage = await imageCompression(
        blobToFile(croppedImage, "cropped-image.png"),
        {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        }
      );
      console.log("compressed");
      const storageRef = ref(storage, `profilePictures/${userId}`);
      await uploadBytes(storageRef, compressedImage);
      console.log("done uploading");
      const downloadURL = await getDownloadURL(storageRef);
      console.log("got download url");
      setProfilePictureUrl(downloadURL);
      setShowCropModal(false); // Close the modal after confirming the crop
    } catch (error) {
      console.error("Error uploading the image:", error);
    }
  };

  const handleCancelCrop = () => {
    console.log("cancelling");
    setShowCropModal(false); // Close the modal without saving
    setPreviewUrl(null);
  };
  const handleSave = async () => {
    if (!userId) return;

    try {
      await runTransaction(db, async (transaction) => {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await transaction.get(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error("User profile not found");
        }

        const usernameDocRef = doc(db, "usernames", profile.username);
        const usernameDocSnap = await transaction.get(usernameDocRef);

        if (
          usernameDocSnap.exists() &&
          usernameDocSnap.data().userId !== userId
        ) {
          throw new Error(
            "유저네임이 존재합니다. 다른 유저네임을 선택해주세요!"
          );
        }

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

        transaction.set(usernameDocRef, { userId: userId });

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

      // if (
      //   selectedFile &&
      //   completedCrop &&
      //   imgRef.current &&
      //   previewCanvasRef.current
      // ) {
      //   setCanvasPreview(
      //     imgRef.current,
      //     previewCanvasRef.current,
      //     completedCrop
      //   );
      //   const canvas = previewCanvasRef.current;
      //   canvas.toBlob(async (blob) => {
      //     if (!blob) return;

      //     const compressedBlob = await imageCompression(blob, {
      //       maxSizeMB: 1,
      //       maxWidthOrHeight: 1024,
      //       useWebWorker: true,
      //     });

      //     const storageRef = ref(storage, `profilePictures/${userId}`);
      //     await uploadBytes(storageRef, compressedBlob);

      //     const downloadURL = await getDownloadURL(storageRef);
      //     setProfilePictureUrl(downloadURL);
      //     setPreviewUrl(null);
      //     setSelectedFile(null);
      //   });
      // }

      setFirebaseProfile(profile);
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

  const handleEditClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleModalClose = () => {
    setShowCropModal(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>프로필</h1>
      <div className={styles.profilePictureContainer}>
        <img
          src={profilePictureUrl || defaultProfilePic}
          alt="Profile"
          className={styles.profilePicture}
        />

        <button
          type="button"
          className={styles.editButton}
          onClick={handleEditClick}
        >
          ✎
        </button>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
          ref={fileInputRef}
          style={{ display: "none" }} // Hide the file input
        />
      </div>
      {showCropModal && previewUrl && (
        <CropModal
          isOpen={showCropModal}
          onRequestClose={handleModalClose}
          src={previewUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCancelCrop}
        />
      )}
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
            {/* ... other options ... */}
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
          className="luckybug-btn"
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
