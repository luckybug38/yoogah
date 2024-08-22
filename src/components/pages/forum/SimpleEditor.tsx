import React from "react";
import styles from "./SimpleEditor.module.css";
interface SimpleEditorProps {
  content: string;
  setContent: (value: string) => void;
}

const SimpleEditor: React.FC<SimpleEditorProps> = ({ content, setContent }) => {
  return (
    <textarea
      className={styles.simpleEditor}
      placeholder="글을 써주세요"
      value={content}
      onChange={(e) => {
        console.log(e.target.value);
        setContent(e.target.value);
      }}
    ></textarea>
  );
};

export default SimpleEditor;
