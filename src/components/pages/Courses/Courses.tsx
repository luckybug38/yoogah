import React from "react";
import { Link } from "react-router-dom";
import styles from "./Courses.module.css";

const courses = [
  {
    id: 1,
    title: "코딩 기초 수업",
    description: "프로그램 세계에 첫 발을 내딛고 싶은 학생들을 위한 코스",
  },
  {
    id: 2,
    title: "고급 코딩 수업",
    description: "이미 코딩에 익숙한 학생들을 위한 고급 코스",
  },
  // 추가적인 코스들...
];

const Courses: React.FC = () => {
  return (
    <div className={styles.courseList}>
      <h1>코스 목록</h1>
      <div className={styles.cards}>
        {courses.map((course) => (
          <Link
            to={`/courses/${course.id}`}
            className={styles.card}
            key={course.id}
          >
            <h2>{course.title}</h2>
            <p>{course.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Courses;
