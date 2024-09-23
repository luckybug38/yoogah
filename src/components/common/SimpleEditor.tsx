import React from "react";
import styles from "./SimpleEditor.module.css";
import { PostType } from "../pages/common/post_components/AutocompleteInput";

interface SimpleEditorProps {
  content: string;
  setContent: (value: string) => void;
  type?: PostType;
}

const SimpleEditor: React.FC<SimpleEditorProps> = ({
  content,
  setContent,
  type = PostType.POST,
}) => {
  const style =
    type == PostType.POST ? styles.simpleEditor : styles.simpleEditorDiary;
  return (
    <textarea
      className={style}
      placeholder="글을 써주세요"
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
      }}
    ></textarea>
  );
};

export default SimpleEditor;
