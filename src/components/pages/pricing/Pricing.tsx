import React from "react";
import styles from "./PricingPage.module.css";

interface Pricing {
  level: string;
  generalPrice: number;
  companySpecificPrice: number;
}

const pricingData: Pricing[] = [
  { level: "Up to Senior level", generalPrice: 150, companySpecificPrice: 190 },
  { level: "Staff/Manager", generalPrice: 200, companySpecificPrice: 250 },
];

const PricingPage: React.FC = () => {
  return (
    <div className={styles.pricingPage}>
      <h1>가격</h1>
      <h3>Mock Interview</h3>
      <p>모든 타입 (Algorithms/Data structures, System Design, Mentoring)</p>
      <table className={styles.pricingTable}>
        <thead>
          <tr>
            <th>Level</th>
            <th>General</th>
            <th>Company Specific</th>
          </tr>
        </thead>
        <tbody>
          {pricingData.map((price, index) => (
            <tr key={index}>
              <td>{price.level}</td>
              <td>${price.generalPrice}</td>
              <td>${price.companySpecificPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PricingPage;
