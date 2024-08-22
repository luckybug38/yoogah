import { useState, useEffect } from "react";
import { auth, db } from "../../../../../config/firebase";
import {
  Timestamp,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import UpcomingRow from "./UpcomingRow";
import styles from "./Upcoming.module.css";

interface SessionWrapper {
  id: string;
  session: Session;
}

interface Session {
  sessionType: string;
  startTime: Timestamp;
  status: string;
  targetCompany: string;
}

const Upcoming = () => {
  const [sessions, setSessions] = useState<SessionWrapper[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchSessions = async () => {
        try {
          const now = new Date();
          now.setMinutes(0);
          now.setSeconds(0, 0);
          const q = query(
            collection(db, "users", userId, "sessions"),
            where("startTime", ">=", now),
            orderBy("startTime")
          );
          const querySnapshot = await getDocs(q);
          const sessions = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            session: doc.data() as Session,
          }));

          setSessions(sessions);
        } catch (error) {
          console.error("Error fetching sessions: ", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSessions();
    }
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <ul className={`list-group ${styles.upcoming}`}>
        {sessions.map(({ id, session }) => (
          <UpcomingRow
            key={id}
            session={{
              sessionType: session.sessionType,
              startTime: session.startTime.toDate(),
              status: session.status,
              targetCompany: session.targetCompany,
            }}
          />
        ))}
      </ul>
    </div>
  );
};

export default Upcoming;
