import { Highlight } from "react-instantsearch";
import styles from "./Hit.module.css";
import sample_profile from "../../assets/yookah_logo.webp";
import { useEffect, useState } from "react";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/firebase";
import defaultProfilePic from "../../assets/default_profile.svg"; // Import default image
import { getTimeFromNumber } from "../../utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { MdOutlineMessage } from "react-icons/md";
import { IoIosTrendingUp } from "react-icons/io";

interface HitProps {
  hit: {
    objectID: string;
    userId: string;
    title: string;
    username: string;
    body: string;
    tags: string[];
    [key: string]: any;
    __position: number;
    __queryID?: string | undefined;
  };
}

export const Hit = ({ hit }: HitProps) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.currentUser.user);

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        if (hit.userId) {
          const profilePicRef = ref(storage, `profilePictures/${hit.userId}`);
          const url = await getDownloadURL(profilePicRef);
          setProfilePictureUrl(url);
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        setProfilePictureUrl(defaultProfilePic); // Fallback to default if error occurs
      }
    };

    fetchProfilePicture();
  }, [hit.userId]);

  //   <article>
  //   <div className="hit-title">
  //     <Highlight attribute="title" hit={hit} />
  //   </div>
  //   <div className="hit-body">
  //     <Highlight attribute="body" hit={hit} />
  //   </div>
  //   <div className="hit-tags">
  //     <Highlight attribute="tags" hit={hit} />
  //   </div>
  // </article>
  const navigateToPost = (id: string) => {
    navigate(`/post/${id}`, { state: { fromDiscuss: true } });
  };

  const hasUserLikedPost = () => {
    if (hit.objectID && user.likedPosts && user.likedPosts[hit.objectID]) {
      return true;
    }
    return false;
  };

  return (
    <li
      key={hit.objectID}
      className={`${styles.forumQuestion}`}
      onClick={() => navigateToPost(hit.objectID)}
    >
      <div className={styles.questionDetails}>
        <div className={styles.header}>
          <div className={styles.profileContainer}>
            <img
              src={profilePictureUrl || sample_profile}
              alt="Profile"
              className={styles.profileImage}
            />
          </div>
          <div>
            <div className={styles.author}>
              <span>{hit.username}</span>
              <span>•</span>
              {getTimeFromNumber(hit.created)}
              {}
            </div>
            {/* <div className={styles.author}>
              <span>Georgia</span>
              <span>•</span>
              생후 4개월
            </div> */}
          </div>
        </div>
        <div className={styles.title}>
          <Highlight attribute="title" hit={hit} />
        </div>
        <div className={styles.postBody}>
          <Highlight attribute="body" hit={hit} />
        </div>
        <div className={styles.spacer} />
        {hit.images && hit.images.length > 0 && (
          <div className={styles.postImages}>
            <div className={styles.postImage}>
              <img
                key={0} // Key is optional here since you're only rendering one item
                src={hit.images[0]}
                alt="Post Image"
              />
            </div>
          </div>
        )}

        {hit.tags && hit.tags.length > 0 && (
          <div className={styles.tags}>
            {hit.tags?.map((tag: string, idx: number) => (
              <span
                key={idx}
                className={styles.tag}
                style={{ backgroundColor: "#4f4f4f" }}
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
            {hit.likeCount || 0} likes
          </div>
          <span>•</span>
          <MdOutlineMessage size="20px" color="grey" />
          <span>{hit.commentsCount || 0} comments</span>
          <span>•</span>
          <IoIosTrendingUp size="20px" color="grey" />
          <span>{hit.views || 0} views</span>
        </div>
      </div>
    </li>
  );
};
