import React, { useState, useEffect } from "react";
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
import imageCompression from "browser-image-compression"; // Import the library
import { db } from "../../../config/firebase";
import styles from "./WritePost.module.css";
import AutocompleteInput from "./post_components/AutocompleteInput";
import SimpleEditor from "./SimpleEditor";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { FaTrash, FaRegImage } from "react-icons/fa";

const WritePost: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.currentUser.user);

  const {
    id = "",
    existingImages = [],
    title = "",
    content = "",
    tags = [],
    isEdit = false,
  } = location.state || {};
  const [modalTitle, setModalTitle] = useState(title);
  const [editorContent, setEditorContent] = useState(content);
  const [selectedTags, setSelectedTags] = useState<string[]>(tags);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] =
    useState<string[]>(existingImages);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  console.log(existingImages);
  useEffect(() => {
    setModalTitle(title);
    setEditorContent(content);
    setSelectedTags(tags);
  }, [title, content, tags]);

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
        const imageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
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
          const postRef = doc(db, "posts", id);
          await updateDoc(postRef, {
            title: modalTitle,
            body: editorContent,
            lastEdited: serverTimestamp(),
            tags: selectedTags,
            images: finalImageUrls,
          });
          alert("포스트가 수정되었습니다.");
        } catch (error) {
          console.error("Error updating post: ", error);
          alert("포스트 수정에 실패했습니다. 다시 시도해주세요.");
        }
        navigate(`/post/${id}`, {
          state: { shouldLoadFromServer: true },
          replace: true,
        });
      } else {
        const counterRef = doc(db, "counters", "postCounter");
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

          const postRef = doc(db, "posts", newCount.toString());
          transaction.set(postRef, {
            title: modalTitle,
            body: editorContent,
            created: serverTimestamp(),
            commentsCount: 0,
            views: 0,
            userId: user.id,
            tags: selectedTags,
            images: finalImageUrls, // Save combined image URLs to Firestore
            ...(user.username && { username: user.username }),
            ...(user.photoURL && { photoURL: user.photoURL }),
          });
        });

        alert("저장완료");
        navigate(`/post/${count}`, {
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
        <div className={styles.modalButton}>
          <input
            className="form-control"
            placeholder="제목"
            aria-label="title"
            value={modalTitle}
            onChange={(e) => setModalTitle(e.target.value)}
          />
        </div>
        <AutocompleteInput
          setSelectedTags={setSelectedTags}
          prevSelectedTags={selectedTags}
        />
        <SimpleEditor content={editorContent} setContent={setEditorContent} />
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
            disabled={!modalTitle.trim() || !editorContent.trim() || uploading}
          >
            {uploading ? "Uploading..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritePost;
