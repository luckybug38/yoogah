import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./EditMember.module.css";
import defaultProfilePic from "../../../assets/default_profile.svg"; // Import default image
import imageCompression from "browser-image-compression";
import CropModal from "../settings/CropModal";
import Modal from "react-modal";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, db } from "../../../config/firebase"; // Import db for Firestore
import { updateDoc, doc, getDoc } from "firebase/firestore"; // Update Firestore document
import "react-image-crop/dist/ReactCrop.css";
import { useDispatch } from "react-redux";
import { editChild, removeChild } from "../../../features/family/familySlice";

// Constants for family member types
export enum FamilyMemberType {
  PARTNER = "partner",
  CHILD = "child",
}

const EditMember = () => {
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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { familyId, memberData } = location.state || {}; // Assuming memberData is passed in location.state

  useEffect(() => {
    // Populate form with existing member data if available
    if (memberData) {
      setProfile({
        childName: memberData.displayName,
        childGender: memberData.gender,
        childBirthday: memberData.birthday,
      });
      setProfilePictureUrl(memberData.imageUrl || defaultProfilePic);
    }
  }, [memberData]);

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

  const updateFamilyMember = async () => {
    if (
      !familyId ||
      !profile.childName ||
      !profile.childGender ||
      !profile.childBirthday
    ) {
      alert("모든 필드를 입력해 주세요.");
      return;
    }

    const updatedMember = {
      id: memberData.id, // Keep the original ID
      displayName: profile.childName,
      gender: profile.childGender,
      birthday: profile.childBirthday,
      imageUrl: profilePictureUrl || null,
    };

    try {
      const familyRef = doc(db, "families", familyId);
      const familySnap = await getDoc(familyRef);

      if (familySnap.exists()) {
        const familyData = familySnap.data();
        const children = familyData.children || [];

        // Find the index of the child to update
        const updatedChildren = children.map((child: any) =>
          child.id === memberData.id ? updatedMember : child
        );

        // Update the entire children array in Firestore
        await updateDoc(familyRef, {
          children: updatedChildren,
        });
        dispatch(editChild(updatedMember));
        alert("자녀가 성공적으로 업데이트되었습니다.");
        navigate("/family");
      } else {
        alert("Family document not found.");
      }
    } catch (error) {
      console.error("Error updating family member:", error);
      alert("자녀 업데이트에 실패했습니다.");
    }
  };

  const deleteFamilyMember = async () => {
    if (!window.confirm("정말로 자녀를 삭제하시겠습니까?")) {
      return; // If the user cancels, do nothing
    }

    try {
      const familyRef = doc(db, "families", familyId);
      const familySnap = await getDoc(familyRef);

      if (familySnap.exists()) {
        const familyData = familySnap.data();
        const updatedChildren = familyData.children.filter(
          (child: any) => child.id !== memberData.id
        );

        // Update Firestore document with the updated children array
        await updateDoc(familyRef, {
          children: updatedChildren,
        });
        dispatch(removeChild(memberData.id));
        alert("자녀가 성공적으로 삭제되었습니다.");
        navigate("/family"); // Redirect to family page after deletion
      } else {
        alert("Family document not found.");
      }
    } catch (error) {
      console.error("Error deleting family member:", error);
      alert("자녀 삭제에 실패했습니다.");
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
          <button onClick={updateFamilyMember} className="luckybug-btn">
            저장하기
          </button>
          <button
            onClick={deleteFamilyMember}
            className="luckybug-btn luckybug-red"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMember;
