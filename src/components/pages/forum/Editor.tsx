import React, { useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "quill/dist/quill.core.css";
import "quill/dist/quill.bubble.css"; // or 'quill.bubble.css'
import styles from "./Editor.module.css";
import { storage } from "../../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

interface EditorProps {
  content: string;
  setContent: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, setContent }) => {
  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block", "link", "image"],

    [{ list: "ordered" }, { list: "bullet" }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ align: [] }],
  ];

  const modules = useMemo(() => {
    return {
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image: imageHandler,
        },
      },
    };
  }, []);

  const quillRef = useRef<any>(null);

  function imageHandler() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (file) {
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;

        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
          img.src = e.target?.result as string;
          img.onload = async () => {
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
              const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
              width = width * ratio;
              height = height * ratio;
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  // Generate a unique file name using UUID
                  const uniqueFileName = uuidv4();
                  const storageRef = ref(storage, `images/${uniqueFileName}`);
                  await uploadBytes(storageRef, blob);
                  const url = await getDownloadURL(storageRef);
                  const range = quillRef.current.getEditor().getSelection();
                  quillRef.current
                    .getEditor()
                    .insertEmbed(range.index, "image", url);
                }
              }, file.type);
            }
          };
        };

        reader.readAsDataURL(file);
      }
    };
  }

  return (
    <div>
      <ReactQuill
        ref={quillRef}
        className={styles.editorContainer}
        theme="snow"
        modules={modules}
        bounds={".app"}
        value={content}
        onChange={(value) => {
          setContent(value);
        }}
      />
    </div>
  );
};

export default Editor;
