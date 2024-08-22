import "./InterviewTypesSection.css";

const InterviewTypesSection = () => {
  return (
    <div className="interview-types-section">
      <h2>Interview Session Types - 인터뷰 세션 타입</h2>
      <div className="cards-container">
        <div className="card">
          <h3>Algorithms/Data structures</h3>
          <hr />
          <p>
            알고리즘/자료구조 인터뷰는 문제 해결 능력과 효율적인 코드 작성을
            평가하는 인터뷰입니다. 주로 배열, 링크드 리스트, 해시 테이블,
            그래프, 트리 등의 자료구조와 정렬, 탐색, 동적 프로그래밍 등의
            알고리즘을 다룹니다.
          </p>
        </div>
        <div className="card blue">
          <h3>System Design</h3>
          <hr />
          <p>
            시스템 설계 인터뷰는 복잡한 소프트웨어 시스템의 구조와 동작을
            설계하는 능력을 평가하는 인터뷰입니다. 주로 대규모 분산 시스템,
            확장성, 성능 최적화, 데이터베이스 설계 등의 주제를 다룹니다.
          </p>
        </div>
        <div className="card light-blue">
          <h3>Mentoring</h3>
          <hr />
          <p>
            1:1로 무엇이든 물어볼수 있는 시간입니다. 커리어에 대한 질문, 인터뷰
            준비에 대한 질문, 이직을 시작하는 방법 등 멘토링을 받고 싶으시면
            신청하시면 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewTypesSection;
