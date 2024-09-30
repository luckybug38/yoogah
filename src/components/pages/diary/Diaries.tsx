import { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import styles from "./Diaries.module.css";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import DiaryRow from "./DiaryRow";
import { useNavigate } from "react-router-dom";
import { IoIosAdd } from "react-icons/io";

const paginationLimit = 6;

const Diaries = () => {
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFullButton, setShowFullButton] = useState(true);
  const lastScrollY = useRef(0); // UseRef to track the last scroll position

  const user = useSelector((state: RootState) => state.currentUser.user);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      // Ignore small scrolls (like the bounce effect)
      if (scrollDifference < 10) {
        return;
      }

      // If user is near the bottom of the page, keep button minimized
      if (currentScrollY + windowHeight >= documentHeight - 10) {
        setShowFullButton(false);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // If scrolling down and passed a certain point, minimize the button
        setShowFullButton(false);
      } else if (currentScrollY < lastScrollY.current) {
        // If scrolling up, expand the button
        setShowFullButton(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    fetchDiaries(true);
  }, []);

  const fetchDiaries = async (isInitialLoad = false) => {
    if (!isInitialLoad && !lastVisible) {
      return;
    }
    const isLastVisible = isInitialLoad ? null : lastVisible;
    setLoading(isInitialLoad);
    setIsLoadingMore(!isInitialLoad);

    try {
      const diariesRef = collection(db, "diaries");
      const diariessQuery = isLastVisible
        ? query(
            diariesRef,
            orderBy("date", "desc"),
            startAfter(isLastVisible),
            limit(paginationLimit)
          )
        : query(diariesRef, orderBy("date", "desc"), limit(paginationLimit));

      const querySnapshot = await getDocs(diariessQuery);
      const diariesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDiaries((prevDiaries) =>
        isInitialLoad ? diariesData : [...prevDiaries, ...diariesData]
      );

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setLoading(false);
      setIsLoadingMore(false);
    } catch (error) {
      console.error("Error fetching discussions: ", error);
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleCreatePost = () => {
    if (!user.id) {
      alert("로그인 후 등록해주세요!");
    } else {
      navigate("/memories/write", {
        state: {
          title: "",
          content: "",
          tags: [],
          shouldClear: true,
        },
      });
    }
  };

  return (
    <div className={styles.forumPage}>
      <div className={styles.forumHeader}>
        <div className={styles.stickyHeader}>
          <button
            className={`luckybug-btn ${styles.discussSearchInput}`}
            type="button"
            onClick={handleCreatePost}
          >
            + 글쓰기
          </button>
        </div>
      </div>
      <div className={styles.forumContent}>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : (
          <ul className={`${styles.forumQuestions}`}>
            {diaries.map((item) => (
              <DiaryRow key={item.id} post={item} />
            ))}
          </ul>
        )}
        <div className={styles.loadMoreContainer}>
          {isLoadingMore ? (
            <p>Loading more...</p>
          ) : (
            <button
              className={`luckybug-btn ${styles.loadMoreBtn}`}
              hidden={!lastVisible}
              onClick={() => fetchDiaries()}
            >
              Load More
            </button>
          )}
        </div>
      </div>

      {/* Floating Add Post Button */}
      <button
        className={`${styles.floatingButton} ${
          showFullButton ? styles.grow : styles.shrink
        }`}
        type="button"
        onClick={handleCreatePost}
      >
        <IoIosAdd size={38} />
        <span>{showFullButton ? "글쓰기" : null}</span>
      </button>
    </div>
  );
};

export default Diaries;
