import React from "react";
import styles from "./IntroProgramming.module.css";

const IntroProgramming: React.FC = () => {
  return (
    <div className={styles.coursePage}>
      <header className={styles.header}>
        <h1>코딩 기초 수업</h1>
      </header>
      <section className={styles.section}>
        <h2>코스 소개</h2>
        <p>
          안녕하세요! 코딩 기초 수업에 오신 것을 환영합니다. 이 수업은
          프로그래밍 세계에 첫 발을 내딛고 싶은 6학년부터 12학년 학생들을
          대상으로 합니다. 이 코스는 기본적인 프로그래밍 개념을 배우고 실습할 수
          있도록 설계되었습니다.
        </p>
      </section>
      <section className={styles.section}>
        <h2>왜 이 코스를 들어야 하나요?</h2>
        <ul>
          <li>
            <strong>미래를 준비하세요</strong>: 코딩은 다양한 직업에서 필수적인
            기술이 되었습니다. 이 코스는 여러분이 미래의 직업을 준비할 수 있도록
            도와줍니다.
          </li>
          <li>
            <strong>논리적 사고 개발</strong>: 프로그래밍을 배우는 것은 문제
            해결 능력과 논리적 사고를 발전시키는 데 큰 도움이 됩니다.
          </li>
          <li>
            <strong>즐거운 학습</strong>: 재미있고 흥미로운 프로젝트를 통해 학습
            동기를 유지합니다.
          </li>
        </ul>
      </section>
      <section className={styles.section}>
        <h2>커리큘럼</h2>
        <ul>
          <li>
            <strong>파이썬 기초</strong>: 변수, 자료형, 조건문, 반복문 등
          </li>
          <li>
            <strong>HTML & CSS</strong>: 웹 페이지 구조와 스타일링 기초
          </li>
          <li>
            <strong>JavaScript</strong>: 웹 페이지에 동적 기능 추가
          </li>
          <li>
            <strong>프로젝트</strong>: 자신의 웹사이트 만들기
          </li>
        </ul>
      </section>
      <section className={styles.section}>
        <h2>강사 소개</h2>
        <p>
          Google, Apple, Netflix, Meta 등 세계적인 기업에서의 경험을 바탕으로
          여러분에게 최고의 코딩 교육을 제공할 것입니다. 다양한 프로젝트와 실무
          경험을 통해 쌓은 지식을 여러분과 공유하겠습니다.
        </p>
      </section>
      <section className={styles.section}>
        <h2>수업 방식</h2>
        <ul>
          <li>
            <strong>온라인 강의</strong>: 언제 어디서든 편리하게 학습할 수
            있습니다.
          </li>
          <li>
            <strong>실시간 Q&A 세션</strong>: 주기적인 실시간 세션을 통해 궁금한
            점을 해결하세요.
          </li>
          <li>
            <strong>커뮤니티 지원</strong>: 다른 학생들과의 협업을 통해 학습
            효과를 극대화하세요.
          </li>
        </ul>
      </section>
      <section className={styles.section}>
        <h2>등록 방법</h2>
        <p>
          아래 버튼을 클릭하여 등록 페이지로 이동하세요. 코딩의 세계로 첫 발을
          내딛을 준비가 되셨나요? 지금 바로 등록하세요!
        </p>
        <button
          className={styles.button}
          onClick={() => (window.location.href = "/register")}
        >
          등록하기
        </button>
      </section>
    </div>
  );
};

export default IntroProgramming;
