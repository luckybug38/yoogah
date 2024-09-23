import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { db } from "../../../config/firebase";
import styles from "./WriteDiary.module.css";
import SimpleEditor from "../../common/SimpleEditor";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { FaTrash, FaRegImage } from "react-icons/fa";
import AutocompleteInput, {
  PostType,
} from "../common/post_components/AutocompleteInput";

const WriteDiary: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.currentUser.user);

  const {
    id = "",
    existingImages = [],
    content = "",
    isEdit = false,
    tags = [],
  } = location.state || {};

  const [selectedTags, setSelectedTags] = useState<string[]>(tags);
  const [editorContent, setEditorContent] = useState(content);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] =
    useState<string[]>(existingImages);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);

      const compressedImages = await Promise.all(
        fileArray.map(async (file) => {
          try {
            const options = {
              maxSizeMB: 1, // Adjust the max size here (1MB)
              maxWidthOrHeight: 1000, // Adjust the max width or height here
              useWebWorker: true,
            };
            const compressedFile = await imageCompression(file, options);
            return compressedFile;
          } catch (error) {
            console.error("Error compressing image: ", error);
            return file; // Fallback to original file if compression fails
          }
        })
      );

      setImages((prevImages) => [...prevImages, ...compressedImages]);

      const previewArray = compressedImages.map((file) =>
        URL.createObjectURL(file)
      );
      setImagePreviews((prevPreviews) => [...prevPreviews, ...previewArray]);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    const imageUrl = existingImageUrls[index];
    setExistingImageUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
    setImagesToRemove((prev) => [...prev, imageUrl]);
  };

  const handleRemoveNewImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImagePreviews((prevPreviews) =>
      prevPreviews.filter((_, i) => i !== index)
    );
  };

  const handleSaveContent = async () => {
    setUploading(true);
    try {
      const storage = getStorage();
      const newImageUrls: string[] = [];

      // Upload new images to Firebase Storage
      for (const image of images) {
        const imageRef = ref(storage, `diaries/${Date.now()}_${image.name}`);
        await uploadBytes(imageRef, image);
        const downloadURL = await getDownloadURL(imageRef);
        newImageUrls.push(downloadURL);
      }

      // Remove the images that were marked for deletion
      for (const url of imagesToRemove) {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef).catch((error) => {
          console.error("Failed to delete image:", error);
        });
      }

      // Filter out the images marked for removal from existingImageUrls
      const remainingExistingImageUrls = existingImageUrls.filter(
        (url) => !imagesToRemove.includes(url)
      );

      // Combine new and remaining existing image URLs
      const finalImageUrls = [...remainingExistingImageUrls, ...newImageUrls];
      let count = "";
      console.log(editorContent);
      if (isEdit) {
        try {
          console.log("editing: " + id);
          const diaryRef = doc(db, "diaries", id);
          await updateDoc(diaryRef, {
            body: editorContent,
            date: selectedDate || serverTimestamp(),
            lastEdited: serverTimestamp(),
            images: finalImageUrls,
          });
          alert("포스트가 수정되었습니다.");
        } catch (error) {
          console.error("Error updating diary: ", error);
          alert("포스트 수정에 실패했습니다. 다시 시도해주세요.");
        }
        navigate(`/memories/${id}`, {
          state: { shouldLoadFromServer: true },
          replace: true,
        });
      } else {
        const counterRef = doc(db, "counters", "diaryCounter");
        await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let newCount;

          if (!counterDoc.exists || !counterDoc.data()) {
            newCount = 1;
            transaction.set(counterRef, { count: newCount });
          } else {
            const counterData = counterDoc.data();
            if (!counterData) {
              throw new Error("Counter document data is undefined!");
            }
            newCount = counterData.count + 1;
            count = newCount;
            transaction.update(counterRef, { count: newCount });
          }

          const diaryRef = doc(db, "diaries", newCount.toString());
          transaction.set(diaryRef, {
            body: editorContent,
            date: selectedDate,
            commentsCount: 0,
            views: 0,
            userId: user.id,
            images: finalImageUrls, // Save combined image URLs to Firestore
            ...(user.username && { username: user.username }),
            ...(user.imageUrl && { photoURL: user.imageUrl }),
          });
        });

        alert("저장완료");
        navigate(`/memories/${count}`, {
          state: { shouldNotIncrementView: true },
          replace: true,
        });
      }
    } catch (error) {
      alert("저장이 안되었습니다. 다시 시도해주세요!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.modalContainer}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy/MM/dd (eee)" // This format includes the day of the week
          className={`${styles.datePicker} ${styles.datePicker__wrapper}`}
        />
        <AutocompleteInput
          setSelectedTags={setSelectedTags}
          prevSelectedTags={selectedTags}
          fetchMode={PostType.DIARY}
        />
        <SimpleEditor
          content={editorContent}
          setContent={setEditorContent}
          type={PostType.DIARY}
        />
        <div className={styles.imageUpload}>
          <label className={styles.fileInputLabel}>
            <FaRegImage className={styles.plusIcon} /> Image
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className={styles.fileInput}
              disabled={uploading}
            />
          </label>
          <div className={styles.imagePreviewContainer}>
            {existingImageUrls.map((url, index) => (
              <div key={index} className={styles.imagePreview}>
                <img
                  src={url}
                  alt={`Existing Image ${index}`}
                  className="img-fluid mt-2"
                />
                <button
                  className={styles.removeImageButton}
                  onClick={() => handleRemoveExistingImage(index)}
                  disabled={uploading}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            {imagePreviews.map((preview, index) => (
              <div key={index} className={styles.imagePreview}>
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="img-fluid mt-2"
                />
                <button
                  className={styles.removeImageButton}
                  onClick={() => handleRemoveNewImage(index)}
                  disabled={uploading}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.buttons}>
          <button
            className="luckybug-btn luckybug-grey"
            onClick={() => {
              navigate(-1);
            }}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className="luckybug-btn"
            onClick={handleSaveContent}
            disabled={!editorContent.trim() || uploading}
          >
            {uploading ? "Uploading..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WriteDiary;
