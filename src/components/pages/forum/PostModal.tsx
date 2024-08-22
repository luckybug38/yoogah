import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import styles from "./Discuss.module.css";
import AutocompleteInput from "./post_components/AutocompleteInput";
import SimpleEditor from "./SimpleEditor";

interface PostModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onSaveContent: (title: string, content: string, tags: string[]) => void;
  title?: string;
  content?: string;
  tags?: string[];
  shouldClear?: boolean;
}

const PostModal: React.FC<PostModalProps> = ({
  isOpen,
  onRequestClose,
  onSaveContent,
  title = "",
  content = "",
  tags = [],
  shouldClear = true,
}) => {
  const [modalTitle, setModalTitle] = useState(title);
  const [editorContent, setEditorContent] = useState(content);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    setModalTitle(title);
    setEditorContent(content);
    setSelectedTags(tags);
  }, [title, content]);

  const handleSaveContent = () => {
    onSaveContent(modalTitle, editorContent, selectedTags);
    if (shouldClear) {
      setModalTitle("");
      setEditorContent("");
      setSelectedTags([]);
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // setImages(fileArray);

      const previewArray = fileArray.map((file) => URL.createObjectURL(file));
      setImagePreviews(previewArray);
    }
  };
  return (
    <Modal
      ariaHideApp={false}
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick={false}
      contentLabel="Edit Post"
      className={styles.Modal}
      overlayClassName={styles.Overlay}
    >
      <div className={styles.modalContainer}>
        <div className={styles.modalButton}>
          <input
            className="form-control me-2"
            placeholder="Title"
            aria-label="title"
            value={modalTitle}
            onChange={(e) => setModalTitle(e.target.value)}
          />
          <button
            className={`luckybug-btn luckybug-grey ${styles.marginRight}`}
            onClick={onRequestClose}
          >
            Cancel
          </button>
          <button
            className="luckybug-btn col-lg-1"
            onClick={handleSaveContent}
            disabled={!modalTitle.trim() || !editorContent.trim()}
          >
            Post
          </button>
        </div>
        <AutocompleteInput
          setSelectedTags={setSelectedTags}
          prevSelectedTags={tags}
        />
        <SimpleEditor content={editorContent} setContent={setEditorContent} />
        <div className={styles.imageUpload}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="form-control mt-3"
          />
          {imagePreviews.map((preview, index) => (
            <div key={index} className={styles.imagePreview}>
              <img
                src={preview}
                alt={`Preview ${index}`}
                className="img-fluid mt-2"
              />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default PostModal;
