import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PostRow.module.css";
import { getTime } from "../../../utils/dateUtils";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { MdOutlineMessage } from "react-icons/md";
import { IoIosTrendingUp } from "react-icons/io";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../../../config/firebase";
import defaultProfilePic from "../../../assets/default_profile.svg"; // Import default image

interface PostRowProps {
  post: any;
}

const PostRow: React.FC<PostRowProps> = ({ post }) => {
  const user = useSelector((state: RootState) => state.currentUser.user);
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );

  const tagColors: { [key: string]: string } = {
    meta: "#64dc96",
    google: "#aa5eff",
    airbnb: "#5dbeff",
    "system design": "#f48c04",
  };

  const navigateToPost = (id: string) => {
    navigate(`/post/${id}`, { state: { fromDiscuss: true } });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
  };

  const hasUserLikedPost = () => {
    if (post.id && user.likedPosts && user.likedPosts[post.id]) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        if (post.userId) {
          const profilePicRef = ref(storage, `profilePictures/${post.userId}`);
          const url = await getDownloadURL(profilePicRef);
          setProfilePictureUrl(url);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        setProfilePictureUrl(defaultProfilePic); // Fallback to default if error occurs
      }
    };

    fetchProfilePicture();
  }, [post.userId]);

  return (
    <li
      key={post.id}
      className={`${styles.forumQuestion}`}
      onClick={() => navigateToPost(post.id)}
    >
      <div className={styles.questionDetails}>
        <div className={styles.header}>
          <div className={styles.profileContainer}>
            <img
              src={profilePictureUrl || defaultProfilePic}
              alt="Profile"
              className={styles.profileImage}
            />
          </div>
          <div>
            <div className={styles.author}>
              <span>{post.username}</span>
              <span>•</span>
              {getTime(post.created)}
            </div>
            {/* <div className={styles.author}>
              <span>Georgia</span>
              <span>•</span>
              생후 4개월
            </div> */}
          </div>
        </div>
        <div className={styles.title}>{post.title}</div>
        <div className={styles.postBody}>{truncateText(post.body, 200)}</div>
        <div className={styles.spacer} />
        {post.images && post.images.length > 0 && (
          <div className={styles.postImages}>
            <div className={styles.postImage}>
              <img
                key={0} // Key is optional here since you're only rendering one item
                src={post.images[0]}
                alt="Post Image"
              />
            </div>
          </div>
        )}

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
          <div className={styles.likes}>
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
      </div>
    </li>
  );
};

export default PostRow;
