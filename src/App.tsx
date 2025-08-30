import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Home } from "@/pages/Home";
import { About } from "@/pages/About";
import { Contact } from "@/pages/Contact";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { History } from "@/pages/History";
import { FollowComic } from "@/pages/FollowComic";
import { FindComic } from "@/pages/FindComic";
import { ComicDetail } from "@/pages/ComicDetail";
import { ChapterReader } from "@/pages/ChapterReader";
import { UpdateProfile } from "@/pages/UpdateProfile";
import UserProfile from "@/pages/UserProfile";
import Dashboard from "@/pages/Dashboard";
import AddComic from "@/pages/AddComic";
import EditComic from "@/pages/EditComic";
import ManagerChapter from "@/pages/ManagerChapter";
import AddChapter from "@/pages/AddChapter";
import EditChapter from "@/pages/EditChapter";

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Component kiểm tra quyền truy cập cho các route /dashboard/*
  const ProtectedDashboard = () => {
    if (loading) {
      return <div>Đang tải...</div>;
    }
    if (!user || user.email !== "tungct2k2@gmail.com") {
      return <Navigate to="/" replace />;
    }
    return <Outlet />; // Render các route con của /dashboard/*
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gioi-thieu" element={<About />} />
      <Route path="/lien-he" element={<Contact />} />
      <Route path="/dang-nhap" element={<Login />} />
      <Route path="/dang-ky" element={<Register />} />
      <Route path="/quen-mat-khau" element={<ForgotPassword />} />
      <Route path="/dat-lai-mat-khau" element={<ResetPassword />} />
      <Route path="/lich-su-truyen-tranh" element={<History />} />
      <Route path="/theo-doi" element={<FollowComic />} />
      <Route path="/tim-truyen" element={<FindComic />} />
      <Route path="/tim-truyen/:category" element={<FindComic />} />
      <Route path="/truyen-tranh/:slug" element={<ComicDetail />} />
      <Route path="/truyen-tranh/:slug/:chapterSlug" element={<ChapterReader />} />
      <Route path="/cap-nhat-thong-tin" element={<UpdateProfile />} />
      <Route path="/trang-ca-nhan" element={<UserProfile />} />
      <Route path="/dashboard/*" element={<ProtectedDashboard />}>
        <Route index element={<Dashboard />} />
        <Route path="quan-ly-truyen" element={<Dashboard />} />
        <Route path="quan-ly-the-loai" element={<Dashboard />} />
        <Route path="quan-ly-nguoi-dung" element={<Dashboard />} />
        <Route path="quan-ly-truyen/them-truyen" element={<AddComic />} />
        <Route path="quan-ly-truyen/chinh-sua-truyen/:slug" element={<EditComic />} />
        <Route path="quan-ly-chapter/:slug" element={<ManagerChapter />} />
        <Route path="quan-ly-truyen/them-chapter/:slug" element={<AddChapter />} />
        <Route path="quan-ly-chapter/chinh-sua-chapter/:slug/:chapterId" element={<EditChapter />} />
      </Route>
    </Routes>
  );
};

export default App;
