import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Confirm.module.css"; // Import the CSS module
import { google, CalendarEvent } from "calendar-link";
import { ScheduleDetailProps } from "./ScheduleDetailProps";
const Success = () => {
  function toString(hour: number): string {
    const period = hour < 12 ? "AM" : "PM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  }
  const location = useLocation();
  const { date, time, sessionType, targetCompany, targetLevel } =
    location.state as ScheduleDetailProps;
  date.setHours(time, 0, 0, 0);
  const event: CalendarEvent = {
    title: "luckybug Practice Interview: " + sessionType,
    start: date.toString(),
    duration: [1, "hour"],
  };
  const navigate = useNavigate();
  return (
    <div className={styles.confirmContainer}>
      <h2>Booked!</h2>
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
        <div className={styles.buttonContainer}>
          <a className="btn btn-primary" href={google(event)} target="_blank">
            Add to Google Calendar
          </a>
          <button
            className="btn btn-primary"
            onClick={() => {
              navigate("/interviews/schedule");
            }}
          >
            Schedule another session
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              navigate("/interviews/upcoming");
            }}
          >
            View all Upcoming
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;
