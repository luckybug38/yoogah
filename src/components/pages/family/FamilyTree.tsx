// FamilyTree.tsx

import React from "react";
import FamilyNode from "./FamilyNode";
import styles from "./FamilyTree.module.css";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";

const FamilyTree: React.FC = () => {
  const family = useSelector((state: RootState) => state.family.family);

  return (
    <div className={styles.familyTree}>
      <FamilyNode family={family} />
    </div>
  );
};

export default FamilyTree;
