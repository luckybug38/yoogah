import React, { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./AddMember.module.css";
import defaultProfilePic from "../../../assets/default_profile.svg"; // Import default image
import imageCompression from "browser-image-compression";
import CropModal from "../settings/CropModal";
import Modal from "react-modal";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../../../config/firebase"; // Import db for Firestore
import { updateDoc, doc, arrayUnion } from "firebase/firestore"; // Import arrayUnion for Firestore
import "react-image-crop/dist/ReactCrop.css";
import { v4 as uuidv4 } from "uuid"; // For generating unique familyId
import { useDispatch } from "react-redux";
import { addChild } from "../../../features/family/familySlice";

// Constants for family member types
export enum FamilyMemberType {
  PARTNER = "partner",
  CHILD = "child",
}

const AddMember = () => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    childName: "",
    childGender: "",
    childBirthday: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const { familyId } = location.state || {}; // Assuming familyId is passed in location.state
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleEditClick = () => {
    fileInputRef.current?.click(); // Opens the file input when clicking the edit button
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
    return new File([blob], fileName, { type: blob.type });
  }

  const handleCropConfirm = async (croppedImage: Blob) => {
    try {
      const compressedImage = await imageCompression(
        blobToFile(croppedImage, "cropped-image.png"),
        {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        }
      );
      const storageRef = ref(
        storage,
        `childPictures/${profile.childName}-${Date.now()}`
      );
      await uploadBytes(storageRef, compressedImage);
      const downloadURL = await getDownloadURL(storageRef);
      setProfilePictureUrl(downloadURL);
      setShowCropModal(false);
    } catch (error) {
      console.error("Error uploading the image:", error);
    }
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setPreviewUrl(null);
  };

  const addChildToFamily = async () => {
    console.log(familyId);
    if (
      !familyId ||
      !profile.childName ||
      !profile.childGender ||
      !profile.childBirthday
    ) {
      alert("모든 필드를 입력해 주세요.");
      return;
    }
    const childId = uuidv4();

    const newChild = {
      id: childId,
      displayName: profile.childName,
      gender: profile.childGender,
      birthday: profile.childBirthday,
      imageUrl: profilePictureUrl,
    };

    try {
      const familyRef = doc(db, "families", familyId);
      await updateDoc(familyRef, {
        children: arrayUnion(newChild), // Add the new child to the children array
      });
      dispatch(addChild(newChild));
      alert("자녀가 성공적으로 추가되었습니다.");
      navigate("/family");
    } catch (error) {
      console.error("Error adding child to family:", error);
      alert("자녀 추가에 실패했습니다.");
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.profilePictureContainer}>
        <img
          src={profilePictureUrl || defaultProfilePic}
          alt="Profile"
          className={
            profile.childGender === "M"
              ? styles.maleBorder
              : profile.childGender === "F"
              ? styles.femaleBorder
              : ""
          }
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
          onRequestClose={handleCancelCrop}
          src={previewUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCancelCrop}
        />
      )}
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
              <option value="M">아들</option>
              <option value="F">딸</option>
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
        <div className={styles.buttons}>
          <button onClick={addChildToFamily} className="luckybug-btn">
            자녀 추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMember;
