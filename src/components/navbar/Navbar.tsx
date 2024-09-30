import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import yookah_logo from "../../assets/yookah_logo.webp";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import LogoutButton from "../pages/auth/LogoutButton";
import { useDispatch, useSelector } from "react-redux";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../config/firebase";
import { clearUserData, setUser } from "../../features/users/currentUserSlice";
import { setFamily } from "../../features/family/familySlice";
import { RootState } from "../../app/store";
import "./Navbar.css";
import { User as UserProfile } from "../../features/users/currentUserSlice";
import { Child } from "../../features/family/familySlice";
import { SearchBox } from "react-instantsearch";
import { FaHome } from "react-icons/fa";
import { IoBook } from "react-icons/io5";
import { MdFamilyRestroom } from "react-icons/md";

const Navbar: React.FC = () => {
  const auth = getAuth();
  const location = useLocation();
  const [background, setBackground] = useState(
    "linear-gradient(to right, #0188FB 83%, rgb(50, 115, 212))"
  );
  const [navLinkStyle, setNavLinkStyle] = useState("nav-link-white");
  const [menuButtonColor, setMenuButtonColor] = useState("#fff");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.currentUser.user);

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    currentUser?.imageUrl || null
  );

  useEffect(() => {
    if (currentUser?.imageUrl) {
      setProfilePictureUrl(currentUser.imageUrl);
    }
  }, [currentUser.imageUrl]);

  useEffect(() => {
    const fetchDocument = async (collection: string, docId: string) => {
      const docRef = doc(db, collection, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      throw new Error(`${collection} document with ID ${docId} not found`);
    };

    const fetchProfilePicture = async (userId: string) => {
      try {
        const profilePicRef = ref(storage, `profilePictures/${userId}`);
        return await getDownloadURL(profilePicRef);
      } catch (error) {
        console.error(`Error fetching profile picture for ${userId}:`, error);
        return null;
      }
    };

    const fetchParentProfile = async (
      parentId: string,
      currentUser: UserProfile
    ) => {
      if (!parentId) {
        return null;
      }
      if (parentId === currentUser.id) {
        return currentUser; // Parent is the current user
      }
      const parentProfile = await fetchDocument("users", parentId);
      const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
        parentProfile;
      return userProfileWithoutTimestamp;
    };

    const fetchFamilyProfile = async (
      familyId: string,
      currentUser: UserProfile
    ) => {
      const familyProfile = await fetchDocument("families", familyId);

      const { momId, dadId, children } = familyProfile;

      const mom = await fetchParentProfile(momId, currentUser);
      const dad = await fetchParentProfile(dadId, currentUser);
      // Here we get the children directly from familyProfile
      const fetchedChildren: Child[] = await Promise.all(
        children.map(async (child: Child) => {
          const childWithImageUrl = {
            ...child,
            imageUrl: child.imageUrl || (await fetchProfilePicture(child.id)), // Use imageUrl if available, otherwise fetch it
          };
          return childWithImageUrl;
        })
      );

      return { mom, dad, children: fetchedChildren };
    };

    const fetchUserProfile = async (fbUser: User) => {
      try {
        // Fetch user profile
        const userProfile = await fetchDocument("users", fbUser.uid);
        const familyId = userProfile.familyId;
        const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
          userProfile;
        const user = {
          id: fbUser.uid,
          photoURL: fbUser.photoURL || undefined,
          ...userProfileWithoutTimestamp,
        };

        // Set user profile in the store
        dispatch(setUser(user));

        console.log(user);

        // If familyId exists, fetch family details
        if (familyId) {
          const { mom, dad, children } = await fetchFamilyProfile(
            familyId,
            user
          );
          console.log("Mom:", mom, "Dad:", dad, "Children:", children);
          dispatch(setFamily({ mom, dad, children }));
        }

        // Fetch and set the profile picture
        const profilePictureUrl = await fetchProfilePicture(fbUser.uid);
        setProfilePictureUrl(profilePictureUrl);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    // const fetchUserProfile = async (fbUser: User) => {
    //   try {
    //     const docRef = doc(db, "users", fbUser.uid);
    //     const docSnap = await getDoc(docRef);
    //     if (docSnap.exists()) {
    //       const userProfile = docSnap.data();
    //       const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
    //         userProfile;
    //       const user = {
    //         id: fbUser.uid,
    //         photoURL: fbUser.photoURL || undefined,
    //         ...userProfileWithoutTimestamp,
    //       };
    //       dispatch(setUser(user));
    //       console.log(user);
    //       const familyId = userProfile.familyId;
    //       if (familyId) {
    //         const docRef = doc(db, "families", familyId);
    //         const familyDocSnap = await getDoc(docRef);
    //         if (familyDocSnap.exists()) {
    //           const familyProfile = familyDocSnap.data();
    //           const momId = familyProfile.momId;
    //           const dadId = familyProfile.dadId;
    //           let mom: UserProfile;
    //           let dad: UserProfile;
    //           if (momId == user.id) {
    //             mom = user;
    //             const dadDocRef = doc(db, "users", dadId);
    //             const dadDocSnap = await getDoc(dadDocRef);
    //             if (dadDocSnap.exists()) {
    //               const dadUserProfile = dadDocSnap.data();
    //               const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
    //                 dadUserProfile;
    //               dad = userProfileWithoutTimestamp;
    //             }
    //           } else if (dadId == user.id) {
    //             dad = user;
    //             const momDocRef = doc(db, "users", momId);
    //             const momDocSnap = await getDoc(momDocRef);
    //             if (momDocSnap.exists()) {
    //               const momUserProfile = momDocSnap.data();
    //               const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
    //                 momUserProfile;
    //               mom = userProfileWithoutTimestamp;
    //             }
    //           }
    //         }
    //       }
    //       // Fetch the profile picture from Firebase Storage
    //       const profilePicRef = ref(storage, `profilePictures/${fbUser.uid}`);
    //       try {
    //         const url = await getDownloadURL(profilePicRef);
    //         setProfilePictureUrl(url);
    //       } catch (error) {
    //         console.error("Error fetching profile picture:", error);
    //         setProfilePictureUrl(null);
    //       }
    //     } else {
    //       console.error("User profile not found");
    //     }
    //   } catch (error) {
    //     console.error("Error fetching user profile:", error);
    //   }
    // };

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        fetchUserProfile(fbUser);
      } else {
        dispatch(clearUserData());
        setProfilePictureUrl(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const isActiveLink = () => {
      return true;
    };

    if (isActiveLink()) {
      setMenuButtonColor("#000");
      setBackground("white");
      setNavLinkStyle("nav-link-active");
    } else {
      setMenuButtonColor("#fff");
      setBackground(
        "linear-gradient(to right, #0188FB 83%, rgb(50, 115, 212))"
      );
      setNavLinkStyle("nav-link-white");
    }
  }, [location.pathname]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const navigate = useNavigate();

  const login = () => {
    navigate("/login");
    toggleMenu();
  };

  // Scroll control for hiding/showing the navbar
  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname !== "/") {
        setIsVisible(true);
        return;
      }
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      if (scrollDifference < 10) {
        return;
      }

      if (currentScrollY + windowHeight >= documentHeight - 10) {
        setIsVisible(false);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  return (
    <div
      className={`main-navbar ${navLinkStyle} ${
        isVisible ? "visible" : "hidden"
      }`}
      style={{ background }}
    >
      <div>
        <nav className="luckybug-navbar-nav">
          <div className="luckybug-navbar-logo-search">
            <Link className="navbar-brand" to="/" onClick={closeMenu}>
              <img src={yookah_logo} alt="logo" className="main_logo" />
            </Link>
            <div className="searchbox-wrapper">
              <div className="searchbox">
                <SearchBox
                  placeholder="검색어 입력"
                  searchAsYouType={false}
                  onSubmit={() => navigate("/search")}
                />
              </div>
            </div>
            {/* <div className="position-relative">
              <input
                className={`form-control discussSearchInput`}
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <CiSearch className="search-icon" />
            </div> */}
          </div>
          <input
            type="checkbox"
            id="sidebar-active"
            checked={menuOpen}
            onChange={toggleMenu}
            style={{ display: "none" }}
          />
          <label
            className={`open-sidebar-button ${navLinkStyle}`}
            htmlFor="sidebar-active"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="32px"
              viewBox="0 -960 960 960"
              width="32px"
              fill={menuButtonColor}
            >
              <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
            </svg>
          </label>
          <label id="overlay" htmlFor="sidebar-active"></label>
          <div className="links-container">
            <label className="close-sidebar-button" htmlFor="sidebar-active">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="32px"
                viewBox="0 -960 960 960"
                width="32px"
                fill="#666"
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
            </label>
            <ul className="luckybug-ul">
              <li>
                <NavLink
                  className={`nav-link ${navLinkStyle}`}
                  to="/"
                  onClick={closeMenu}
                >
                  <FaHome size={20} />
                  <span>커뮤니티</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={`nav-link ${navLinkStyle}`}
                  to="/memories"
                  onClick={closeMenu}
                >
                  <IoBook size={20} />
                  <span>메모리</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={`nav-link ${navLinkStyle}`}
                  to="/family"
                  onClick={closeMenu}
                >
                  <MdFamilyRestroom size={20} />
                  <span>가족</span>
                </NavLink>
              </li>

              <li className="nav-auth-container">
                {!currentUser.id ? (
                  <button className="luckybug-btn" onClick={login}>
                    로그인
                  </button>
                ) : (
                  <NavLink
                    className={`nav-link ${navLinkStyle}`}
                    to="/settings"
                    onClick={closeMenu}
                  >
                    프로필
                  </NavLink>
                )}
              </li>
              <li className="nav-auth-container">
                {currentUser.id && (
                  <div className="logout-button-container">
                    <LogoutButton />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <div className="auth-container">
            {!currentUser.id ? (
              <button className="luckybug-btn" onClick={login}>
                로그인
              </button>
            ) : (
              <div>
                <div className="btn-group">
                  <button
                    className="circular-button"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt="Profile"
                        onClick={() => {}}
                      />
                    ) : (
                      <span>Profile</span>
                    )}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end center-dropdown">
                    <li>
                      <h6 className="dropdown-header">{currentUser.email}</h6>
                    </li>
                    <li>
                      <Link
                        className="nav-link"
                        to="/settings"
                        onClick={closeMenu}
                      >
                        <button className="dropdown-item">프로필</button>
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <LogoutButton />
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
