import HeroSection from "./HeroSection";
import CompanyLogo from "./CompanyLogo";
import MockInterviewSection from "./MockInterviewSection";
import InterviewTypesSection from "./InterviewTypesSection";

const Home = () => {
  return (
    <>
      <div>
        <HeroSection />
        <CompanyLogo />
        <MockInterviewSection />
        <InterviewTypesSection />
      </div>
    </>
  );
};

export default Home;
