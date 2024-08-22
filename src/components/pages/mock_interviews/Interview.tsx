import { NavLink, Outlet } from "react-router-dom";
import styles from "./Interview.module.css";
const Interview = () => {
  return (
    <div className={styles.interviewContainer}>
      <ul className="nav nav-pills">
        <li className="nav-item">
          <NavLink className="nav-link" to="/interviews/schedule">
            Schedule
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link" to="/interviews/upcoming">
            Upcoming
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link" to="/interviews/history">
            History
          </NavLink>
        </li>
      </ul>
      <Outlet />
    </div>
  );
};

export default Interview;
