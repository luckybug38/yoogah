import React from "react";
import styles from "./FamilyNode.module.css";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { db } from "../../../config/firebase"; // Import Firestore
import { doc, setDoc, updateDoc } from "firebase/firestore"; // Firestore functions
import { v4 as uuidv4 } from "uuid"; // For generating unique familyId
import { updateProfile } from "../../../features/users/currentUserSlice";
import { Child, Family } from "../../../features/family/familySlice";
import defaultProfilePic from "../../../assets/default_profile.svg"; // Import default image

interface FamilyNodeProps {
  family: Family; // Use Family interface instead of FamilyMember
}

const FamilyNode: React.FC<FamilyNodeProps> = ({ family }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const currentUser = useSelector((state: RootState) => state.currentUser.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddPartner = () => {
    createFamilyIfNotExists()
      .then((familyId) => {
        navigate("/family/partner", {
          state: { memberType: "partner", familyId },
        });
      })
      .catch((error) => console.error("Error creating family:", error));
  };

  const handleAddChild = () => {
    createFamilyIfNotExists()
      .then((familyId) => {
        navigate("/family/add", { state: { memberType: "child", familyId } });
      })
      .catch((error) => console.error("Error creating family:", error));
  };

  const handleMemberClick = (child: Child) => {
    createFamilyIfNotExists()
      .then((familyId) => {
        navigate("/family/edit", { state: { memberData: child, familyId } }); // Navigate to EditMember and pass the child data
      })
      .catch((error) => console.error("Error creating family:", error));
  };

  const handleParentClick = (id: String | undefined) => {
    console.log(id);
    if (id === currentUser.id) {
      navigate("/settings");
    }
  };

  // Function to create a family if it doesn't exist and return the familyId
  const createFamilyIfNotExists = async (): Promise<string> => {
    if (currentUser.familyId) {
      return currentUser.familyId; // Return existing familyId if already attached
    }

    // Generate a unique familyId
    const familyId = uuidv4();

    // Determine whether the current user is the mom or dad
    const newFamily = {
      momId: currentUser.parentType === "mom" ? currentUser.id : null,
      dadId: currentUser.parentType === "dad" ? currentUser.id : null,
      children: [],
    };

    // Create a new family document
    const familyRef = doc(db, "families", familyId);
    await setDoc(familyRef, newFamily); // Create the family in Firestore

    // Update the current user's familyId in their user document
    if (currentUser.id) {
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, { familyId });
      const updatedUser = { ...currentUser, familyId };
      dispatch(updateProfile(updatedUser));
    }
    return familyId; // Return the newly created familyId
  };
  const hasChildren = family.children && family.children.length > 0;
  return (
    <div>
      <div className={styles.familyNode}>
        <div className={styles.parent}>
          <div className={styles.memberContainer}>
            {/* Display mom if available */}
            {family.mom && (
              <div
                className={styles.member}
                onClick={() => handleParentClick(family.mom?.id)}
              >
                <img
                  src={family.mom.imageUrl || defaultProfilePic}
                  alt={`${family.mom.username}`}
                  className={styles.femaleBorder}
                />
                <p>{family.mom.username}</p>
                <p>엄마</p>
              </div>
            )}
            {hasChildren && family.mom && (
              <div className={styles.lineVerticalSmall} />
            )}
          </div>
          {family.dad && family.mom && (
            <div className={styles.lineHorizontalSmall} />
          )}
          <div className={styles.memberContainer}>
            {/* Display dad if available */}
            {family.dad && (
              <div
                className={styles.member}
                onClick={() => handleParentClick(family.dad?.id)}
              >
                <img
                  src={family.dad.imageUrl || defaultProfilePic}
                  className={styles.maleBorder}
                  alt={`${family.dad.username}`}
                />
                <p>{family.dad.username}</p>
                <p>아빠</p>
              </div>
            )}
            {hasChildren && family.dad && (
              <div className={styles.lineVerticalSmall} />
            )}
          </div>
        </div>
        <div className={styles.lineHorizontalFull} />

        <div className={styles.children}>
          {/* Display each child */}
          {family.children?.map((child: Child) => (
            <div key={child.id}>
              <div className={styles.memberContainer}>
                <div className={styles.lineVerticalSmall} />
                <div
                  className={styles.member}
                  onClick={() => handleMemberClick(child)}
                >
                  <img
                    src={child?.imageUrl || defaultProfilePic}
                    className={
                      child.gender === "F"
                        ? styles.femaleBorder
                        : styles.maleBorder
                    }
                    alt={`${child.displayName}`}
                  />
                  <p>{child.displayName}</p>
                  <p>{child.gender === "F" ? "딸" : "아들"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.addChild}>
          <button className="luckybug-btn" onClick={handleClick}>
            +
          </button>
        </div>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          <MenuItem onClick={handleAddPartner}>배우자</MenuItem>
          <MenuItem onClick={handleAddChild}>자녀</MenuItem>
        </Menu>
      </div>
    </div>
  );
};

export default FamilyNode;
