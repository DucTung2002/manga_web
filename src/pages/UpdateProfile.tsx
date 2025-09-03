import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, updateDoc, getDoc, deleteField } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { Helmet } from 'react-helmet-async';

interface LocationState {
  displayName?: string;
  email?: string;
}

export const UpdateProfile = () => {
  const { state } = useLocation() as { state: LocationState | null };
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "">("");
  const [isNameReadOnly, setIsNameReadOnly] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const checkUpdateLimit = async () => {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const data = userDoc.data();
          if (data?.name) {
            await updateDoc(doc(db, "users", user.uid), {
              displayName: data.name,
              name: deleteField(),
            });
          }
          const lastUpdate = data?.lastNameUpdate?.toDate();
          if (lastUpdate) {
            const now = new Date();
            const diffDays = (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);
            if (diffDays < 30) {
              setIsNameReadOnly(true);
              setMessage("Bạn chỉ có thể cập nhật họ và tên 1 lần trong 30 ngày.");
              setMessageType("error");
            }
          }
          setDisplayName(data?.displayName || state?.displayName || user.displayName || "");
          setEmail(data?.email || state?.email || user.email || "");
        };
        await checkUpdateLimit();
      } else {
        navigate("/dang-nhap");
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [state, navigate]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setMessage("Vui lòng nhập họ và tên.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage("Không tìm thấy người dùng.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      const updateData = {
        displayName: displayName,
        lastNameUpdate: new Date(),
        name: deleteField(),
      };
      await updateDoc(doc(db, "users", user.uid), updateData);

      await updateProfile(user, { displayName: displayName });

      setMessage("Cập nhật thông tin thành công!");
      setMessageType("success");
      setIsNameReadOnly(true);
      setTimeout(() => navigate("/trang-ca-nhan"), 1000);
    } catch (error) {
      setMessage("Cập nhật thất bại. Vui lòng thử lại.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Helmet>
        <title>Cập nhật thông tin tài khoản</title>
      </Helmet>
      <Header />
      <Navbar />
      <div className="flex justify-center mt-10">
        <div className="w-[600px] bg-white p-6 shadow rounded">
          <h2 className="text-2xl font-bold text-center mb-2 !text-black">
            THÔNG TIN TÀI KHOẢN
          </h2>
          <div className="h-1 w-20 bg-pink-500 mb-4 mx-auto" />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Email
            </label>
            <Input
              type="email"
              name="email"
              value={email}
              readOnly
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-100 text-gray-600 cursor-not-allowed focus:ring-0 focus:border-gray-300"
              style={{ cursor: "not-allowed" }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Họ và tên
            </label>
            <Input
              type="text"
              placeholder="Họ và tên"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              readOnly={isNameReadOnly}
              className={isNameReadOnly ? "bg-gray-100 text-gray-600 cursor-not-allowed focus:ring-0 focus:border-gray-300" : "bg-white text-black"}
              title={isNameReadOnly ? "Họ và tên chỉ có thể cập nhật sau 30 ngày" : "Vui lòng nhập họ và tên"}
              autoComplete="name"
              style={isNameReadOnly ? { cursor: "not-allowed" } : undefined}
            />
            <p className="text-sm text-red-500 mt-1">
              Lưu ý: "Họ và tên" chỉ được phép cập nhật 1 lần trong 30 ngày
            </p>
          </div>

          {message && (
            <p className={`text-sm mt-2 ${messageType === "error" ? "text-red-500" : "text-green-500"}`}>
              {message}
            </p>
          )}

          <Button
            className={`w-full !bg-yellow-400 text-black mt-2 
              ${(loading || isNameReadOnly) ?
                '!bg-yellow-400/50 cursor-not-allowed hover:!bg-yellow-400/50' :
                'hover:!bg-yellow-500'
              }`}
            onClick={handleUpdateProfile}
            disabled={loading || isNameReadOnly}
          >
            {loading ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
};
