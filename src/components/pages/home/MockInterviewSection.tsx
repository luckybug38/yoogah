import { useNavigate } from "react-router-dom";
import "./Home.css";
const MockInterviewSection = () => {
  const navigate = useNavigate();
  return (
    <div className="container-mock-interview-overall">
      <div className="container-mock-interview-section col-xl-10 col-xxl-8 px-3">
        <div className="row align-items-start py-5">
          <div className="col-lg-5 text-lg-start">
            <h1 className="hero-title1 display-6 fw-bold text-body-emphasis lh-1 mb-3">
              <span>Mock Interview</span>
            </h1>
            <h1 className="hero-title2 display-6 fw-bold text-body-emphasis lh-1 mb-3">
              <span>모의 인터뷰</span>
            </h1>
          </div>
          <div className="home-body col-lg-7">
            <p>
              원하는 시간에 모의 인터뷰를 예약합니다.
              <br /> FAANG 및 기타 대형 IT 기업의 시니어 엔지니어와 모의 인터뷰
              세션을 진행합니다.
              <br /> 솔직하고 자세한 피드백을 받아 실제 면접에서 합격할 가능성과
              개선이 필요한 점을 파악합니다.
            </p>
            <div className="hero-button d-grid gap-2 d-md-flex justify-content-md-start">
              <button
                type="button"
                className="px-4"
                onClick={() => navigate("/interviews")}
              >
                신청하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockInterviewSection;
