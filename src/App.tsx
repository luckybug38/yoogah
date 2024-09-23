import Navbar from "./components/navbar/Navbar";
import { Navigate, Route, Routes } from "react-router-dom";
import Auth from "./components/pages/auth/Auth";
import Settings from "./components/pages/settings/Settings";
import Courses from "./components/pages/Courses/Courses";
import Faq from "./components/pages/faq/Faq";
import PricingPage from "./components/pages/pricing/Pricing";
import IntroProgramming from "./components/pages/Courses/IntroProgramming";
import AllCourses from "./components/pages/Courses/AllCourses";
// import HubSpot from "./components/chat/HubSpot";
import "@fontsource/nanum-pen-script";
import Discuss from "./components/pages/forum/Discuss";
import Post from "./components/pages/forum/Post";
import PrivateRoutes from "./PrivateRoutes";
import PrivateRoutes2 from "./PrivateRoutes2";
import WritePost from "./components/pages/forum/WritePost";
import Diaries from "./components/pages/diary/Diaries";
import WriteDiary from "./components/pages/diary/WriteDiary";
import Diary from "./components/pages/diary/Diary";
import FamilyTree from "./components/pages/family/FamilyTree";
import AddMember from "./components/pages/family/AddMember";
import EditMember from "./components/pages/family/EditMember";
import AddPartner from "./components/pages/family/AddPartner";
import Login from "./components/pages/auth/Login";
import Signup from "./components/pages/auth/Signup";
import VerifyEmail from "./components/pages/auth/VerifyEmail";

const App = () => {
  return (
    <div
      className="main-container"
      style={{ backgroundColor: "#faf2ff", minHeight: "100vh" }}
    >
      <Navbar />
      <Routes>
        <Route path="/verify" element={<VerifyEmail />} />

        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Discuss />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post">
            <Route index element={<Discuss />} />
            <Route path=":postId" element={<Post />} />
            <Route path="write" element={<WritePost />} />
          </Route>
          <Route path="/memories">
            <Route index element={<Diaries />} />
            <Route path=":diaryId" element={<Diary />} />
            <Route path="write" element={<WriteDiary />} />
          </Route>
          <Route path="/courses" element={<AllCourses />}>
            <Route path="" element={<Navigate to="overview" />} />
            <Route path="overview" element={<Courses />} />
            <Route path="1" element={<IntroProgramming />} />
          </Route>
          <Route path="/faq" element={<Faq />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/family">
            <Route index element={<FamilyTree />} />
            <Route path="add" element={<AddMember />} />
            <Route path="edit" element={<EditMember />} />
            <Route path="partner" element={<AddPartner />} />
          </Route>
        </Route>
        <Route path="/auth" element={<Auth />} />
        <Route element={<PrivateRoutes2 />}>
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      {/* <HubSpot /> */}
    </div>
  );
};

export default App;
