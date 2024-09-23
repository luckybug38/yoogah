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
import defaultProfilePic from "../../../assets/default_profile.svg"; // Import default image
import CropModal from "./CropModal"; // Import CropModal component
import Modal from "react-modal";

interface UserProfile {
  username: string;
  name: string;
  parentType: string;
  description: string;
  title: string;
  region: string;
  lastUsernameUpdate: string;
}

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    name: "",
    parentType: "",
    description: "",
    title: "",
    region: "",
    lastUsernameUpdate: "",
  });

  const [firebaseProfile, setFirebaseProfile] = useState<UserProfile>({
    username: "",
    name: "",
    parentType: "",
    description: "",
    title: "",
    region: "",
    lastUsernameUpdate: "",
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          console.log(url);
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
  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setPreviewUrl(reader.result as string);
        setShowCropModal(true); // Show the modal after selecting an image
      });
      reader.readAsDataURL(compressedFile);

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
      // Compress the cropped image
      const compressedImage = await imageCompression(
        blobToFile(croppedImage, "cropped-image.png"),
        {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        }
      );
      // Upload the image to Firebase Storage
      const storageRef = ref(storage, `profilePictures/${userId}`);
      await uploadBytes(storageRef, compressedImage);

      // Get the download URL of the uploaded image
      const downloadURL = await getDownloadURL(storageRef);

      // Set the profile picture URL in the component's state
      setProfilePictureUrl(downloadURL);

      // Update the profile in Firestore with the new profile picture URL
      const userDocRef = doc(db, "users", userId);
      await runTransaction(db, async (transaction) => {
        const userDocSnap = await transaction.get(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error("User profile not found");
        }

        // Update the Firestore document with the new profile picture URL
        transaction.update(userDocRef, {
          imageUrl: downloadURL,
        });
      });

      const { lastUsernameUpdate, ...userProfileWithoutTimestamp } = profile;
      // Update the profile in the Redux store
      dispatch(
        updateProfile({
          ...userProfileWithoutTimestamp,
          imageUrl: downloadURL,
        })
      );

      // Close the modal after confirming the crop
      setShowCropModal(false);
    } catch (error) {
      console.error("Error uploading the image and updating Firestore:", error);
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

        const updatedProfile = {
          ...profile,
          imageUrl: profilePictureUrl || null, // Include the profile picture URL
        };

        if (profile.username !== firebaseProfile.username) {
          transaction.set(userDocRef, {
            ...updatedProfile,
            lastUsernameUpdate: serverTimestamp(),
          });
        } else {
          transaction.set(userDocRef, updatedProfile);
        }
      });

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
          onClick={handleImageClick}
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
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        contentLabel="Image Modal"
        className={styles.imageModal}
        overlayClassName={styles.modalOverlay}
      >
        <div className={styles.modalContent} onClick={closeModal}>
          <img
            src={profilePictureUrl || defaultProfilePic}
            alt="Profile"
            className={styles.largeImage}
          />
        </div>
      </Modal>
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
            엄마/아빠 (저장후 변경 불가능)
          </label>
          <select
            name="parentType"
            value={profile.parentType}
            onChange={handleChange}
            disabled={
              profile.parentType === "mom" || profile.parentType === "dad"
            } // Disable if value is "mom" or "dad"
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
