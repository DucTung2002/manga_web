import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet-async';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const MAX_RESET_PER_DAY = 3;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/", { replace: true });
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  function generateCaptcha() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    const q = query(
      collection(db, "users"),
      where("email", "==", email),
      limit(1)
    );
    const result = await getDocs(q);
    return !result.empty;
  };

  const canResetToday = async (email: string) => {
    const ref = doc(db, "resetAttempts", email);
    const snap = await getDoc(ref);
    const now = new Date();

    if (snap.exists()) {
      const data = snap.data();
      const last = new Date(data.lastSent);
      const sameDay =
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();

      if (sameDay && data.count >= MAX_RESET_PER_DAY) {
        throw new Error("Bạn đã gửi quá số lần cho phép trong ngày.");
      }
    }
  };

  const logResetAttempt = async (email: string) => {
    const ref = doc(db, "resetAttempts", email);
    const snap = await getDoc(ref);
    const now = new Date();

    if (snap.exists()) {
      const data = snap.data();
      const last = new Date(data.lastSent);
      const sameDay =
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate();

      await setDoc(ref, {
        count: sameDay ? data.count + 1 : 1,
        lastSent: now.toISOString(),
      });
    } else {
      await setDoc(ref, {
        count: 1,
        lastSent: now.toISOString(),
      });
    }
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setIsLoading(true);

    if (!email) {
      setError("Vui lòng nhập email.");
      setIsLoading(false);
      refreshCaptcha();
      return;
    }

    if (captchaInput.toUpperCase() !== captchaCode) {
      setError("Captcha không đúng.");
      setIsLoading(false);
      refreshCaptcha();
      return;
    }

    try {
      const exists = await checkEmailExists(email);
      if (!exists) {
        setError("Không tìm thấy tài khoản với email này.");
        setIsLoading(false);
        refreshCaptcha();
        return;
      }

      await canResetToday(email);

      await Promise.race([
        sendPasswordResetEmail(auth, email),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout gửi email")), 2000)),
      ]);

      setMessage("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
      setEmail("");
      setCaptchaInput("");
      refreshCaptcha();

      logResetAttempt(email).catch(() => { });
    } catch (err: any) {
      if (err.message.includes("quá số lần")) {
        setError(err.message);
      } else if (err.message.includes("Timeout")) {
        setError("Quá thời gian xử lý. Vui lòng thử lại.");
      } else if (err.code === "auth/invalid-email") {
        setError("Email không hợp lệ.");
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
      }
      refreshCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) return null;

  return (
    <>
      <Helmet>
        <title>Quên mật khẩu</title>
      </Helmet>
      <Header />
      <Navbar />

      <div className="flex justify-center mt-10">
        <div className="w-[600px] bg-white p-6 shadow rounded">
          <h2 className="text-2xl font-bold text-center mb-2 text-black">QUÊN MẬT KHẨU</h2>
          <div className="h-1 w-20 bg-pink-500 mb-4 mx-auto" />

          <p className="text-red-600 text-sm mb-4">
            Trường hợp không nhận được email để đặt lại mật khẩu, vui lòng{" "}
            <a href="#" className="text-blue-600 hover:underline">liên hệ</a> với chúng tôi
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-black">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white text-black"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 mb-4">
            <div
              className="w-1/4 flex items-center justify-center border border-gray-300 rounded bg-gray-50 text-blue-600 font-bold text-lg select-none"
              onCopy={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              {captchaCode}
            </div>
            <button
              onClick={refreshCaptcha}
              className="p-2 flex items-center justify-center border border-gray-300 rounded bg-white hover:bg-gray-100 transition-colors"
              aria-label="Làm mới captcha"
              disabled={isLoading}
            >
              <RefreshCw size={24} className="text-blue-600" />
            </button>
            <Input
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Nhập Captcha"
              className="flex-1 bg-white text-black"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
          {message && <p className="text-green-600 text-sm text-center mb-2">{message}</p>}

          <Button
            onClick={handleSubmit}
            className="w-full bg-yellow-400 text-black mt-2 border-none"
            disabled={!email || isLoading}
          >
            {isLoading ? "Đang gửi..." : "Gửi"}
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
};
