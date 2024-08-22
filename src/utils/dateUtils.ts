import { Timestamp } from 'firebase/firestore'; // Make sure to import Timestamp if needed

export const getTime = (timestamp: Timestamp) => {
  const createdAtDate = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diffMilliseconds = now.getTime() - createdAtDate.getTime();
  const inMinutes = diffMilliseconds / (1000 * 60);
  if (inMinutes < 60) {
    const round = Math.trunc(inMinutes);
    if (round === 1) {
      return "posted " + round + " min ago";
    }
    return "posted " + round + " mins ago";
  }
  const inHours = inMinutes / 60;
  if (inHours < 24) {
    const round = Math.trunc(inHours);
    if (round === 1) {
      return "posted " + round + " hour ago";
    }
    return "posted " + round + " hours ago";
  }
  const days = inHours / 24;
  if (days < 4) {
    const round = Math.trunc(days);
    if (round === 1) {
      return "posted " + round + " day ago";
    }
    return "posted " + round + " days ago";
  }
  return "posted at: " + createdAtDate.toLocaleDateString();
};
