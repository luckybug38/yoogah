import React from "react";

interface TimeSlotProps {
  time: string;
  onClick: () => void;
  selected: boolean;
  available: boolean;
}

const TimeSlot: React.FC<TimeSlotProps> = ({
  time,
  onClick,
  selected,
  available,
}) => {
  return (
    <button
      className={`time-slot ${selected ? "selected" : ""}`}
      onClick={onClick}
      disabled={!available}
    >
      {time}
    </button>
  );
};

export default TimeSlot;
