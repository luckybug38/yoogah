import React, { useEffect, useState } from "react";
import styles from "./Confirm.module.css"; // Import the CSS module
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./CheckoutForm";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../../config/firebase";
import { useLocation } from "react-router-dom";
import { PuffLoader } from "react-spinners"; // Import a loader component
import { ScheduleDetailProps, TargetLevel } from "./ScheduleDetailProps";

const stripePromise = loadStripe(
  "pk_test_51PMZPO2KtiawV391mWm0gekfO5txp43Iucq0zDSWVtm07kpWNzn4WZaUO4HmeEHaJ3x1lj15F9WSRYna9Txp4wTm00GS4WOg9R"
);

interface PaymentIntentResponse {
  clientSecret: string;
}

const Confirm: React.FC = () => {
  const location = useLocation();
  const { date, time, sessionType, targetCompany, targetLevel } =
    location.state as ScheduleDetailProps;

  function toString(hour: number): string {
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  }
  const [clientSecret, setClientSecret] = useState<string>("");

  useEffect(() => {
    const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
    createPaymentIntent({ items: [{ id: "xl-tshirt" }] })
      .then((result) => {
        const data = result.data as PaymentIntentResponse;
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
      });
  }, []);

  const appearance: { theme: "stripe" | "night" | "flat" | undefined } = {
    theme: "stripe",
  };
  const options = {
    clientSecret,
    appearance,
  };

  function calculateCost(): number {
    const isCompanySpecific = targetCompany.toLocaleLowerCase() !== "other";
    switch (targetLevel) {
      case TargetLevel.NewGradToSenior:
        return isCompanySpecific ? 190 : 150;
      case TargetLevel.StaffManager:
        return isCompanySpecific ? 250 : 200;
    }
    return 150;
  }

  return (
    <div className={styles.confirmContainer}>
      <div>
        <h2>Confirmation Details</h2>
        <div className={styles.confirmDetails}>
          <p>
            <strong>Date:</strong> {date.toLocaleDateString()}
          </p>
          <p>
            <strong>Time:</strong> {toString(time)}
          </p>
          <p>
            <strong>Session Type:</strong> {sessionType}
          </p>
          {targetCompany.length > 0 && (
            <p>
              <strong>Target Company:</strong> {targetCompany}
            </p>
          )}
          <p>
            <strong>Target Level:</strong> {targetLevel}
          </p>
          <p>
            <strong>Cost:</strong> {"$" + calculateCost()}
          </p>
        </div>
      </div>
      <div className={styles.stripeContainer}>
        {clientSecret ? (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm
              date={date}
              time={time}
              sessionType={sessionType}
              targetCompany={targetCompany}
              targetLevel={targetLevel}
            />
          </Elements>
        ) : (
          <div className={styles.loaderContainer}>
            <PuffLoader color="#36d7b7" loading={true} size={60} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Confirm;
