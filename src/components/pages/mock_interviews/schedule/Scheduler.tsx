import React, { useState, useEffect, ChangeEvent } from "react";
import { addDays, format } from "date-fns";
import TimeSlot from "../TimeSlot";
import "./Scheduler.css";
import { getAvailableTimes, getUnavailableTimes } from "../firestoreService";
import { auth } from "../../../../config/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import moment from "moment-timezone";
import { useNavigate } from "react-router-dom";
import { SessionType, TargetLevel } from "./ScheduleDetailProps";
import Auth from "../../auth/Auth";

const Scheduler: React.FC = () => {
  const curDate = new Date();
  const start = addDays(curDate, 1);
  const [selectedTime, setSelectedTime] = useState<{
    date: string;
    time: number;
    dateObject: Date;
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(start);
  const [pageNumber, setPageNumber] = useState(0);
  const [availableTimes, setAvailableTimes] = useState<
    Map<number, { start: number; end: number }[]>
  >(new Map());
  const [unavailable, setUnavailable] = useState<UnavailTime[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("Target Company");
  const [selectedOption, setSelectedOption] = useState<SessionType>(
    SessionType.Default
  );
  const [selectedLevel, setSelectedLevel] = useState<TargetLevel>(
    TargetLevel.Default
  );
  const handleCompanyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(event.target.value);
  };
  const handleLevelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLevel(event.target.value as TargetLevel);
  };
  // const handleCompanyChangeOther = (event: ChangeEvent<HTMLInputElement>) => {
  //   // setSelectedCompany(event.target.value);
  // };
  const selectOptionHandleChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedOption(event.target.value as SessionType);
  };
  const navigate = useNavigate();
  const handleConfirmClick = () => {
    const state = {
      date: selectedTime?.dateObject,
      time: selectedTime?.time,
      sessionType: selectedOption,
      targetCompany: selectedCompany,
      targetLevel: selectedLevel,
    };
    navigate("/interviews/schedule/confirm", { state });
  };
  const sessionTypeOptions = [
    { id: "0", label: SessionType.Default },
    { id: "1", label: SessionType.AlgorithmsDataStructures },
    { id: "2", label: SessionType.SystemDesign },
    { id: "3", label: SessionType.Mentoring },
  ];

  const targetCompanyOptions = [
    { id: "0", label: "Target Company" },
    { id: "1", label: "Google" },
    { id: "2", label: "Meta" },
    { id: "3", label: "Netflix" },
    { id: "4", label: "Apple" },
    { id: "5", label: "Slack" },
    { id: "6", label: "Bloomberg" },
    { id: "7", label: "Other" },
  ];

  const levelOptions = [
    { id: "0", label: TargetLevel.Default },
    { id: "1", label: TargetLevel.NewGradToSenior },
    { id: "2", label: TargetLevel.StaffManager },
  ];
  const isEnabled = () => {
    return (
      selectedOption !== SessionType.Default &&
      selectedCompany !== "Target Company" &&
      selectedLevel !== TargetLevel.Default
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (user) {
        const availTimes = await getAvailableTimes();
        const unavailTimes = await getUnavailableTimes();
        setAvailableTimes(availTimes);
        setUnavailable(unavailTimes);
      }
    };
    if (!loading) {
      fetchAvailableTimes();
    }
  }, [user, loading, startDate]);

  const handleTimeSelect = (date: string, time: number, dateObject: Date) => {
    setSelectedTime({ date, time, dateObject });
  };

  const renderDays = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startDate, i);
      return (
        <div key={i} className="day-column">
          <div className="day-header">
            <div>{format(day, "EEEE")}</div>
            <div>{format(day, "MM-dd")}</div>
          </div>
          {renderTimeSlots(day)}
        </div>
      );
    });
  };

  const renderTimeSlots = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const timeSlots = Array.from({ length: 17 }, (_, i) => {
      const hour = 7 + i;
      return hour;
    });

    function toString(hour: number): string {
      const period = hour < 12 ? "AM" : "PM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return `${displayHour}:00 ${period}`;
    }
    const intervals = availableTimes.get(day.getDay());
    function isAvailable(hour: number): boolean {
      if (intervals) {
        for (const interval of intervals) {
          if (day.getDate() === start.getDate() && hour < start.getHours()) {
            return false;
          }
          if (interval.start <= hour && interval.end > hour) {
            const date = new Date(day);
            date.setHours(hour);
            date.setMinutes(0);
            date.setSeconds(0, 0);
            const endDate = new Date(day);
            endDate.setHours(hour + 1);
            endDate.setMinutes(0);
            endDate.setSeconds(0, 0);
            for (const unavail of unavailable) {
              if (unavail.end > date && unavail.start < endDate) {
                return false;
              }
            }
            return true;
          }
        }
        return false;
      } else {
        return false;
      }
    }

    return timeSlots.map((time) => (
      <TimeSlot
        key={time}
        time={toString(time)}
        onClick={() => handleTimeSelect(dayKey, time, day)}
        selected={
          isEnabled() &&
          selectedTime?.date === dayKey &&
          selectedTime?.time === time
        }
        available={isEnabled() && isAvailable(time)}
      />
    ));
  };

  const handlePrevWeek = () => {
    setStartDate((prev) => addDays(prev, -7));
    setPageNumber(pageNumber - 1);
  };

  const handleNextWeek = () => {
    setStartDate((prev) => addDays(prev, 7));
    setPageNumber(pageNumber + 1);
  };

  if (loading) {
    return <div>Loading...</div>; // Or some loading spinner/component
  }
  const currentTimeZone = moment.tz.guess();
  return !user ? (
    <div className="whole-container">
      <h4 className="login-message">로그인한 후 세션을 예약해주세요.</h4>
      <Auth />
    </div>
  ) : (
    <div className="whole-container">
      <div className="scheduler-dropdown-container">
        <div className="scheduler-dropdown">
          <select
            className="form-select"
            onChange={selectOptionHandleChange}
            disabled={!user}
          >
            {sessionTypeOptions.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            onChange={handleCompanyChange}
            disabled={!user}
          >
            {targetCompanyOptions.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="form-select"
            onChange={handleLevelChange}
            disabled={!user}
          >
            {levelOptions.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {/* {selectedCompany === "Other" && (
          <input
            type="text"
            className="form-control mt-2"
            placeholder="Company name. This will not be company specific session."
            onChange={handleCompanyChangeOther}
          />
        )} */}
      </div>
      <button
        className="btn btn-primary confirm-button"
        disabled={!isEnabled() || selectedTime == null}
        onClick={handleConfirmClick}
      >
        Next
      </button>
      <div className="timezone">Timezone: {currentTimeZone}</div>
      <div className="scheduler-container">
        <button
          onClick={handlePrevWeek}
          className="nav-button"
          disabled={pageNumber === 0}
        >
          {"<"}
        </button>
        <div className="scheduler">{renderDays()}</div>
        <button
          onClick={handleNextWeek}
          className="nav-button"
          disabled={pageNumber === 2}
        >
          {">"}
        </button>
      </div>
    </div>
  );
};

export default Scheduler;
