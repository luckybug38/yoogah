import React, { useState } from "react";
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import styles from "./Comment.module.css";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { getTime } from "../../../utils/dateUtils";

interface CommentProps {
  comment: any;
  postId: string;
  fetchReplies: (commentId: string) => Promise<any[]>;
  reloadComments: () => Promise<void>;
}

const Comment: React.FC<CommentProps> = ({
  comment,
  postId,
  fetchReplies,
  reloadComments,
}) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [reply, setReply] = useState<string>("");
  const user = useSelector((state: RootState) => state.currentUser.user);

  const toggleReplies = async () => {
    if (!showReplies) {
      const fetchedReplies = await fetchReplies(comment.id);
      setReplies(fetchedReplies);
    }
    setShowReplies(!showReplies);
  };
  const handlePostReply = async (commentId: string) => {
    if (!reply.trim()) return;
    if (!postId) {
      return;
    }
    const replyRef = collection(
      db,
      "posts",
      postId,
      "comments",
      commentId,
      "replies"
    );
    await addDoc(replyRef, {
      content: reply,
      created: serverTimestamp(),
      userId: user.id,
      ...(user.username && { username: user.username }),
      ...(user.imageUrl && { photoURL: user.imageUrl }),
    });

    // Increment the replies count in the comment document
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await updateDoc(commentRef, {
      repliesCount: increment(1),
    });

    // Clear the reply input field
    setReply("");
    // Fetch the updated comments
    const fetchedReplies = await fetchReplies(comment.id);
    setReplies(fetchedReplies);
  };

  const handleDeleteComment = async () => {
    if (!postId || !comment.id) return;

    const confirmDelete = window.confirm("이 댓글을 삭제하시겠습니까?");
    if (confirmDelete) {
      // Delete the comment
      await deleteDoc(doc(db, "posts", postId, "comments", comment.id));

      // Decrement the comments count in the parent post document
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1),
      });

      await reloadComments();
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!postId || !comment.id || !replyId) return;
    const confirmDelete = window.confirm("이 댓글을 삭제하시겠습니까?");
    if (confirmDelete) {
      // Delete the reply
      await deleteDoc(
        doc(db, "posts", postId, "comments", comment.id, "replies", replyId)
      );

      // Decrement the replies count in the comment document
      const commentRef = doc(db, "posts", postId, "comments", comment.id);
      await updateDoc(commentRef, {
        repliesCount: increment(-1),
      });

      const fetchedReplies = await fetchReplies(comment.id);
      setReplies(fetchedReplies);
    }
  };

  const replyCount = replies.length > 0 ? replies.length : comment.repliesCount;
  return (
    <div className={styles.comment}>
      <span className={styles.commentAuthor}>{comment.username}</span>
      <span className={styles.commentDate}>{getTime(comment.created)}</span>
      {comment.userId === user.id && (
        <button
          onClick={() => handleDeleteComment()}
          className="luckybug-btn luckybug-black luckybug-small luckybug-ml"
        >
          Delete
        </button>
      )}
      <p className={styles.commentContent}>{comment.content}</p>
      <div className={styles.commentActions}>
        <button
          className="luckybug-btn luckybug-white luckybug-small"
          onClick={toggleReplies}
        >
          {showReplies
            ? `Hide replies ${replyCount > 0 ? ` (${replyCount})` : ""}`
            : `Replies${replyCount > 0 ? ` (${replyCount})` : ""}`}
        </button>
      </div>
      {showReplies && (
        <div className={styles.replySection}>
          {replies.map((reply, idx) => (
            <div key={idx} className={styles.reply}>
              <span className={styles.commentAuthor}>{reply.username}</span>
              <span className={styles.commentDate}>
                {getTime(reply.created)}
              </span>
              {reply.userId === user.id && (
                <button
                  onClick={() => handleDeleteReply(reply.id)}
                  className="luckybug-btn luckybug-black luckybug-small luckybug-ml"
                >
                  Delete
                </button>
              )}
              <p className={styles.commentContent}>{reply.content}</p>
            </div>
          ))}
          <div className={styles.replyContainer}>
            <textarea
              className="luckybug-pl"
              placeholder="Reply here"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            ></textarea>
            <button
              className="luckybug-btn luckybug-small luckybug-ml"
              onClick={() => handlePostReply(comment.id)}
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comment;
