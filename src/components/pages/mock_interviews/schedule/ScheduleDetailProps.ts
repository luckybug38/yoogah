export interface ScheduleDetailProps {
    date: Date;
    time: number;
    sessionType: SessionType;
    targetCompany: string;
    targetLevel: TargetLevel
}

export enum SessionType {
    Default = "Session Type",
    AlgorithmsDataStructures = "Algorithms/Data structures",
    SystemDesign = "System Design",
    Mentoring = "Mentoring"
}

export enum TargetLevel {
    Default = "Target Level",
    NewGradToSenior = "New grad to senior",
    StaffManager = "Staff/Manager"
}