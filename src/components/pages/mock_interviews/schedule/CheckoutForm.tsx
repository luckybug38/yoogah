import React, { useEffect, useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripePaymentElementOptions } from "@stripe/stripe-js";
import styles from "./Confirm.module.css"; // Import the CSS module
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../../../config/firebase";
import {
  serverTimestamp,
  Timestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import Config from "../../../../config/config";
import { ScheduleDetailProps } from "./ScheduleDetailProps";

const CheckoutForm: React.FC<ScheduleDetailProps> = ({
  date,
  time,
  sessionType,
  targetCompany,
  targetLevel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (paymentIntent) {
        switch (paymentIntent.status) {
          case "succeeded":
            setMessage("Payment succeeded!");
            break;
          case "processing":
            setMessage("Your payment is processing.");
            break;
          case "requires_payment_method":
            setMessage("Your payment was not successful, please try again.");
            break;
          default:
            setMessage("Something went wrong.");
            break;
        }
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: FormEvent) => {
    setMessage("");
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    if (!auth.currentUser) {
      setMessage("User not logged in. Please try refreshing or login again.");
      return;
    }
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required",
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message ?? "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else {
      const state = {
        date,
        time,
        sessionType,
        targetCompany,
        targetLevel,
      };
      const id = auth.currentUser.uid;
      await updateFirestore(id);
      navigate("/interviews/schedule/success", { state });
    }

    setIsLoading(false);
  };

  const updateFirestore = async (id: string) => {
    date.setHours(time, 0, 0, 0);
    const sessionData = {
      sessionType,
      startTime: Timestamp.fromDate(date),
      status: "upcoming",
      targetCompany,
      targetLevel,
      created: serverTimestamp(),
    };

    const docRef = collection(
      db,
      "availability",
      Config.ADMIN_ID,
      "unavailables"
    );
    const endDate = new Date(date);
    endDate.setTime(endDate.getTime() + 1 * 60 * 60 * 1000);
    const newValue = {
      start: Timestamp.fromDate(date),
      end: Timestamp.fromDate(endDate),
    };
    const availabilityAddDocPromise = addDoc(docRef, newValue);
    const addDocPromise = addDoc(
      collection(db, "users", id, "sessions"),
      sessionData
    );
    const baseSessionData = { ...sessionData };

    const sessionDataWithUser = {
      ...baseSessionData,
      interviewee: id,
    };
    const addSessionsPromise = addDoc(
      collection(db, "sessions"),
      sessionDataWithUser
    );
    await Promise.all([
      availabilityAddDocPromise,
      addDocPromise,
      addSessionsPromise,
    ]);
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <button
        className={styles.button}
        disabled={isLoading || !stripe || !elements}
        id="submit"
      >
        <span id="button-text">
          {isLoading ? (
            <div className={styles.spinner} id="spinner"></div>
          ) : (
            "Pay now"
          )}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
};

export default CheckoutForm;
