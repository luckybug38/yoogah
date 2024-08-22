import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  runTransaction,
  limit,
  getDocFromServer,
} from "firebase/firestore";
import { db, storage } from "../../../config/firebase";
import styles from "./Post.module.css";
import "./quill.css";
import Comment from "./Comment";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { getTime } from "../../../utils/dateUtils";
import { toggleLikedPost } from "../../../features/users/currentUserSlice";
import { deleteObject, ref } from "firebase/storage";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { MdOutlineMessage } from "react-icons/md";
import { IoIosTrendingUp } from "react-icons/io";

const Post: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<any>(null);
  const [commentContent, setCommentContent] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.currentUser.user);
  const dispatch = useDispatch();
  const tagColors: { [key: string]: string } = {
    meta: "#64dc96",
    google: "#aa5eff",
    airbnb: "#5dbeff",
    "system design": "#f48c04",
  };
  const location = useLocation();
  const { shouldNotIncrementView, shouldLoadFromServer } = location.state;
  const fetchComments = async () => {
    if (postId) {
      const commentsQuery = query(
        collection(db, "posts", postId, "comments"),
        orderBy("created", "desc"),
        limit(100)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentsList = commentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsList);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (postId) {
        const docRef = doc(db, "posts", postId);
        if (shouldLoadFromServer) {
          console.log("loadin from server");
        }
        const docSnap = shouldLoadFromServer
          ? await getDocFromServer(docRef)
          : await getDoc(docRef);
        if (docSnap.exists()) {
          setPost(docSnap.data());
          if (import.meta.env.PROD && !shouldNotIncrementView) {
            // Increment the view count only in production mode
            await updateDoc(docRef, {
              views: increment(1),
            });
          }
        } else {
          console.error("No such document!");
        }
      }
    };

    fetchPost();
    fetchComments();
  }, [postId]);

  const handlePostComment = async () => {
    if (!commentContent.trim()) return;
    if (!postId) {
      return;
    }
    const commentRef = collection(db, "posts", postId, "comments");
    await addDoc(commentRef, {
      content: commentContent,
      created: serverTimestamp(),
      userId: user.id,
      ...(user.username && { username: user.username }),
      ...(user.photoURL && { photoURL: user.photoURL }),
    });
    // Optionally update the comments count
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });

    // Clear the comment input field
    setCommentContent("");
    // Fetch the updated comments
    const commentsQuery = query(collection(db, "posts", postId, "comments"));
    const commentsSnapshot = await getDocs(commentsQuery);
    const commentsList = commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setComments(commentsList);
  };

  const fetchReplies = async (commentId: string) => {
    if (!postId) return [];
    const repliesQuery = query(
      collection(db, "posts", postId, "comments", commentId, "replies"),
      orderBy("created", "desc"),
      limit(100)
    );
    const repliesSnapshot = await getDocs(repliesQuery);
    return repliesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  const handleEditPost = () => {
    console.log(post);
    navigate("/post/write", {
      state: {
        id: postId,
        existingImages: post.images,
        title: post.title,
        content: post.body,
        tags: post.tags,
        isEdit: true,
      },
    });
  };

  const handleDeletePost = async () => {
    if (!postId) return;

    const confirmDelete = window.confirm("이 게시물을 삭제하시겠습니까?");
    if (confirmDelete) {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const imageUrls = postData?.images || [];

        // Delete images from Firebase Storage
        await Promise.all(
          imageUrls.map(async (url: string) => {
            try {
              const storageRef = ref(storage, url);
              await deleteObject(storageRef);
            } catch (error) {
              console.warn(`Failed to delete image at ${url}: `, error);
            }
          })
        );

        // Delete post from Firestore
        await deleteDoc(postRef);
        alert("포스트가 삭제되었습니다.");
        navigate("/");
      } else {
        alert("포스트를 찾을 수 없습니다.");
      }
    }
  };

  if (!post) {
    return <div>Loading...</div>;
  }

  const hasUserLikedPost = () => {
    if (postId && user.likedPosts && user.likedPosts[postId]) {
      return true;
    }
    return false;
  };

  const handleLikeClick = async () => {
    if (user.id && postId) {
      const id = user.id;
      const docRef = doc(db, "users", user.id);
      let diffLike = 0;
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(docRef);
        if (userDoc.exists()) {
          const postRef = doc(db, "posts", postId);

          const likedPosts = userDoc.data().likedPosts || {};
          if (likedPosts.hasOwnProperty(postId)) {
            diffLike = -1;
            transaction.update(postRef, {
              likeCount: increment(-1),
            });
            delete likedPosts[postId];
          } else {
            diffLike = 1;
            transaction.update(postRef, {
              likeCount: increment(1),
            });
            likedPosts[postId] = true;
          }
          transaction.update(doc(db, "users", id), {
            likedPosts: likedPosts,
          });
          const updateUser = {
            likedPosts,
          };
          dispatch(toggleLikedPost(updateUser));
        }
      });
      setPost((prevPost: any) => ({
        ...prevPost,
        likeCount: (prevPost?.likeCount || 0) + diffLike,
      }));
    }
  };

  const isOwner = post.userId === user.id;

  return (
    <div className={styles.mainContainer}>
      <div className={styles.postContainer}>
        <div className={styles.postHeader}>
          <div className={styles.postTitle}>
            {post.title}
            {isOwner && (
              <div className={styles.postActions}>
                <button
                  onClick={handleEditPost}
                  className="luckybug-btn luckybug-grey"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeletePost}
                  className="luckybug-btn luckybug-black"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <div className={styles.postMetadata}>
          <span className={styles.postAuthor}>{post.username}</span>
          <span className={styles.postDate}>•</span>
          <span className={styles.postDate}>{getTime(post.created)}</span>
        </div>
        <div className={styles.postContent}>
          <p className={styles.postBody}>{post.body}</p>
          {post.images && post.images.length > 0 && (
            <div className={styles.postImages}>
              {post.images.map((imageUrl: string, idx: number) => (
                <div className={styles.postImage}>
                  <img
                    key={idx}
                    src={imageUrl}
                    alt={`Post Image ${idx}`}
                    className=""
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags?.map((tag: string, idx: number) => (
              <span
                key={idx}
                className={styles.tag}
                style={{ backgroundColor: tagColors[tag] || "#4f4f4f" }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className={styles.stats}>
          <div className={styles.likes} onClick={handleLikeClick}>
            {hasUserLikedPost() ? (
              <FaHeart size="20px" color="rgb(255, 16, 138)" />
            ) : (
              <FaRegHeart className={styles.heart} size="20px" />
            )}
            {post.likeCount || 0} likes
          </div>
          <span>•</span>
          <MdOutlineMessage size="20px" color="grey" />
          <span>{post.commentsCount || 0} comments</span>
          <span>•</span>
          <IoIosTrendingUp size="20px" color="grey" />
          <span>{post.views || 0} views</span>
        </div>
        <div className={styles.postComments}>
          <div className={styles.commentSection}>
            <textarea
              placeholder="Write a comment here"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            ></textarea>
            <button
              className="luckybug-btn"
              onClick={handlePostComment}
              disabled={!commentContent.trim()}
            >
              Post
            </button>
          </div>
          <div className={styles.commentList}>
            {comments.map((comment: any) => (
              <Comment
                key={comment.id}
                comment={comment}
                postId={postId!}
                fetchReplies={fetchReplies}
                reloadComments={fetchComments}
              />
            ))}
          </div>
        </div>
        {/* <PostModal
          isOpen={isModalOpen}
          onRequestClose={handleModalClose}
          onSaveContent={handleSaveContent}
          title={post.title}
          content={post.body}
          tags={post.tags}
        /> */}
      </div>
    </div>
  );
};

export default Post;
