import { useNavigate } from "react-router-dom";
import "./Home.css";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    // col-xxl-# for width padding
    <div className="hero-overall-container">
      <div className="container hero-container col-xl-10 col-xxl-8 px-3 py-5">
        <div className="row align-items-start py-5">
          <div className="col-lg-7 text-lg-start">
            <h1 className="hero-title1 display-5 fw-bold text-body-emphasis lh-1 mb-3">
              <span>FAANG 인터뷰 준비,</span>
            </h1>
            <h1 className="hero-title2 display-5 fw-bold text-body-emphasis lh-1 mb-3">
              <span>저희와 함께하세요!</span>
            </h1>
          </div>
          <div className="col-lg-5">
            <p className="home-body py-3">
              세계 최고의 기술 기업, FAANG+(페이스북, 애플, 아마존, 넷플릭스,
              구글, 그리고 그 외)에서 일하는 꿈을 이루기 위해 필요한 모든 것을
              제공합니다. 최신 인터뷰 기법부터 실전 대비 모의 면접까지, 여러분의
              성공을 위한 완벽한 가이드와 리소스를 준비했습니다.
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

export default HeroSection;
