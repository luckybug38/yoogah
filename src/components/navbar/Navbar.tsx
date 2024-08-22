import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import yookah_logo from "../../assets/yookah_logo.webp";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import Auth from "../pages/auth/Auth";
import LogoutButton from "../pages/auth/LogoutButton";
import { useDispatch, useSelector } from "react-redux";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { clearUserData, setUser } from "../../features/users/currentUserSlice";
import { RootState } from "../../app/store";
import "./Navbar.css";
import { CiSearch } from "react-icons/ci";

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

  useEffect(() => {
    const fetchUserProfile = async (fbUser: User) => {
      try {
        const docRef = doc(db, "users", fbUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userProfile = docSnap.data();
          const { lastUsernameUpdate, ...userProfileWithoutTimestamp } =
            userProfile;
          dispatch(
            setUser({
              id: fbUser.uid,
              photoURL: fbUser.photoURL || undefined,
              ...userProfileWithoutTimestamp,
            })
          );
        } else {
          console.error("User profile not found");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        fetchUserProfile(fbUser);
      } else {
        dispatch(clearUserData());
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

      // Ignore small scrolls (like the bounce effect)
      if (scrollDifference < 10) {
        return;
      }

      // If user is near the bottom of the page, keep navbar hidden
      if (currentScrollY + windowHeight >= documentHeight - 10) {
        setIsVisible(false);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // If scrolling down and passed a certain point, hide the navbar
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // If scrolling up, show the navbar
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
            <div className="position-relative">
              <input
                className={`form-control discussSearchInput`}
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              {/* <span className="position-absolute top-50 translate-middle-y ms-3"> */}
              <CiSearch className="search-icon" />
              {/* </span> */}
            </div>
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
                fill="#e8eaed"
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
                  Community
                </NavLink>
              </li>

              <li className="nav-auth-container">
                {!currentUser.id ? (
                  <Auth />
                ) : (
                  <NavLink
                    className={`nav-link ${navLinkStyle}`}
                    to="/settings"
                    onClick={closeMenu}
                  >
                    Settings
                  </NavLink>
                )}
              </li>
              <li className="nav-auth-container">
                {currentUser.id && <LogoutButton />}
              </li>
            </ul>
          </div>
          <div className="auth-container">
            {!currentUser.id ? (
              <Auth />
            ) : (
              <div>
                <div className="btn-group">
                  <button
                    className="circular-button"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="my image"
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
                        <button className="dropdown-item">Settings</button>
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
