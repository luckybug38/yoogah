import styles from "./UpcomingRow.module.css";

interface UpcomingRowProps {
  session: {
    sessionType: string;
    startTime: Date;
    status: string;
    targetCompany: string;
  };
}

const UpcomingRow = ({ session }: UpcomingRowProps) => {
  return (
    <li className={styles.upcomingRow}>
      <div>
        <p>{session.sessionType}</p>
        <p>{session.targetCompany.length > 0 && session.targetCompany}</p>
        <p>Start Time: {session.startTime.toLocaleString()}</p>
        <p>Status: {session.status}</p>
      </div>
    </li>
  );
};

export default UpcomingRow;
