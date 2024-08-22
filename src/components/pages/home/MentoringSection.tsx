const MentoringSection = () => {
  return (
    <div className="container col-xxl-8 px-4 py-5">
      <div className="row flex-lg-row-reverse align-items-center g-5 py-5">
        <div className="col-10 col-sm-8 col-lg-6"></div>
        <div>
          <h1 className="display-7 fw-bold text-body-emphasis lh-1 mb-3 text-center">
            1:1 멘토링
          </h1>
          <p className="lead">
            우리의 미래는 디지털 혁신과 개인 역량에 달려 있습니다. 코딩을 배우는
            것은 필수이며, 인터뷰 스킬은 성공적인 커리어에 중요합니다. 저희
            플랫폼은 한국인을 위한 온라인 코딩 강의와 인터뷰 준비 프로그램을
            제공합니다. 초보자부터 전문가까지 다양한 코스와 인터뷰 팁으로 목표
            달성을 돕습니다. 코딩 실력을 키우고, 인터뷰 기술을 연마해 경력을
            도약시키세요. 지금 시작하세요. 우리의 미래는 여기서 열립니다.
          </p>
          <div className="d-grid gap-2 d-md-flex justify-content-md-start">
            <button
              type="button"
              className="btn btn-primary btn-lg px-4 me-md-2"
            >
              신청하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentoringSection;
