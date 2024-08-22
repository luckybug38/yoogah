import apple_logo from "../../../assets/company_logos/apple.png";
import bloomberg_logo from "../../../assets/company_logos/bloomberg.png";
import google_logo from "../../../assets/company_logos/google.png";
import meta_logo from "../../../assets/company_logos/meta.png";
import slack_logo from "../../../assets/company_logos/slack.png";
import netflix_logo from "../../../assets/company_logos/netflix.png";
import "./Home.css";
const CompanyLogo = () => {
  return (
    <div>
      <p className="career-experience-text">커리어 경력</p>
      <div className="logo-container py-2">
        <div className="company-logos">
          <img src={google_logo} alt="google" className="logo" />
          <img src={meta_logo} alt="meta" className="logo" />
          <img src={netflix_logo} alt="google" className="logo" />
          <img src={apple_logo} alt="google" className="logo2" />
          <img src={slack_logo} alt="google" className="logo" />
          <img src={bloomberg_logo} alt="google" className="logo" />
        </div>
      </div>
    </div>
  );
};

export default CompanyLogo;
