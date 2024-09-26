import { Timestamp } from 'firebase/firestore'; // Make sure to import Timestamp if needed

export const getTime = (timestamp: Timestamp) => {
  const createdAtDate = new Date(timestamp.seconds * 1000);
  return getT(createdAtDate);
};

export const getTimeFromNumber = (timestamp: number) => {
  const createdAtDate = new Date(timestamp);
  return getT(createdAtDate)
}

const getT = (createdAtDate: Date) => {
  const now = new Date();
  const diffMilliseconds = now.getTime() - createdAtDate.getTime();
  const inMinutes = diffMilliseconds / (1000 * 60);
  const prefix = "";//"posted ";
  const prefix2 = "";//"posted at: ";
  if (inMinutes < 60) {
    const round = Math.trunc(inMinutes);
    if (round === 1) {
      return prefix + round + " min ago";
    }
    return prefix + round + " mins ago";
  }
  const inHours = inMinutes / 60;
  if (inHours < 24) {
    const round = Math.trunc(inHours);
    if (round === 1) {
      return prefix + round + " hour ago";
    }
    return prefix + round + " hours ago";
  }
  const days = inHours / 24;
  if (days < 4) {
    const round = Math.trunc(days);
    if (round === 1) {
      return prefix + round + " day ago";
    }
    return prefix + round + " days ago";
  }
  return prefix2 + createdAtDate.toLocaleDateString();
}