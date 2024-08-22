import { db } from '../../../config/firebase';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import moment from 'moment-timezone';
import Config from '../../../config/config';

interface Availability {
    day: number;
    start: number;
    end: number;
}
  
interface AvailabilityDocument {
    available: Availability[];
    timezone: string;
}  

export const getAvailableTimes = async (): Promise<Map<number, { start: number, end: number}[]>> => {
    // Query the 'availability' collection
    const querySnapshot = await getDocs(collection(db, "availability"));
    // Array to store all availability data
    const allAvailabilities: Availability[] = [];
    // Process each document
    querySnapshot.forEach((doc) => {
        if (doc.exists()) {
            const data = doc.data() as AvailabilityDocument;
            const localAvailability = convertToLocalTime(data.available, data.timezone);
            allAvailabilities.push(...localAvailability);
        }
    });
    return groupAvailability(allAvailabilities);
};

export const getUnavailableTimes = async(): Promise<UnavailTime[]> => {
  // Define the dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setTime(endDate.getTime() + (21 * 24 * 60 * 60 * 1000)); // Add 21 days

  // Construct the query with corrected date handling
  const q = query(
    collection(db, "availability", Config.ADMIN_ID, "unavailables"),
    where("start", ">=", startDate),
    where("end", "<=", endDate)
  );
  const querySnapshot = await getDocs(q);

  const unavailTimes = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      start: data.start.toDate(), // Convert Firestore Timestamp to JavaScript Date
      end: data.end.toDate(), // Convert Firestore Timestamp to JavaScript Date
    };
  });
  return unavailTimes;
}

const groupAvailability = (availabilities: Availability[]): Map<number, { start: number, end: number}[]> => {
    const availabilityMap = new Map<number, { start: number, end: number }[]>();

    for (const availability of availabilities) {
      if (!availabilityMap.has(availability.day)) {
        availabilityMap.set(availability.day, []);
      }
      availabilityMap.get(availability.day)!.push({ start: availability.start, end: availability.end });
    }
  
    return availabilityMap;
}


const getDay = (day: number, offset: number): number => {
    return (day + offset + 7) % 7;
};


const convertToLocalTime = (availability: Availability[], timezone: string): Availability[] => {
    return availability.flatMap(slot => {
      const { day, start, end } = slot;
      if (start >= end) {
        return [];
      }
      const currentTime = moment().tz(timezone);
      const offset = new Date().getTimezoneOffset();
      let localStart = start - (offset/60) - (currentTime.utcOffset()/60);
      let localEnd = end - (offset/60) - (currentTime.utcOffset()/60);


      if (localStart < 0) {
        if (localEnd <= 0) {
            localStart += 24;
            localEnd += 24;
            const prevDay = getDay(day, -1);
            return [
                {day: prevDay, start: localStart, end: localEnd}
            ];
        } else {
            localStart += 24;
            const prevDay = getDay(day, -1);
            return [
                { day: prevDay, start: localStart, end: 24},
                { day, start: 0, end: localEnd}
            ];
        }
      } else if (localStart < 24 ){
        if (localEnd <=24) {
            return [
                {day, start: localStart, end: localEnd}
            ];
        } else {
            localEnd -=24;
            const nextDay = getDay(day, 1);
            return [
                {day, start: localStart, end:24},
                {day: nextDay, start: 0, end: localEnd}
            ];
        }
      } else {
        const nextDay = getDay(day, 1);
        localStart -= 24;
        localEnd -= 24;
        return [
            {day: nextDay, start: localStart, end: localEnd}
        ]
      }
    });
  };

  

// Function to add an available time to Firestore
// export const addAvailableTime = async (availableTime: AvailableTime): Promise<void> => {
//   const timesCollection = collection(db, 'availableTimes');
//   await addDoc(timesCollection, availableTime);
// };

// Function to remove an available time from Firestore
export const removeAvailableTime = async (date: string, time: string): Promise<void> => {
  const timesCollection = collection(db, 'availableTimes');
  const timesSnapshot = await getDocs(timesCollection);
  const timeToDelete = timesSnapshot.docs.find(doc => doc.data().date === date && doc.data().time === time);

  if (timeToDelete) {
    const timeDoc = doc(db, 'availableTimes', timeToDelete.id);
    await deleteDoc(timeDoc);
  }
};
