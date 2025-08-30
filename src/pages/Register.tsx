import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const Register = () => {
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/", { replace: true });
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const saveUserToFirestore = async (user: any, nameOverride?: string) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const createdAt = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      await setDoc(
        userRef,
        {
          uid: user.uid,
          displayName: nameOverride || user.displayName || "Anonymous",
          email: user.email,
          createdAt: createdAt,
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      throw new Error("Không thể lưu thông tin người dùng vào Firestore");
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError("Vui lòng nhập đầy đủ Tên, Email và Mật khẩu");
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError("Email không hợp lệ");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name });
      await saveUserToFirestore(res.user, name);
      navigate("/");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setError("Địa chỉ email đã tồn tại");
      } else if (error.code === "auth/invalid-email") {
        setError("Email không hợp lệ");
      } else if (error.code === "auth/weak-password") {
        setError("Mật khẩu quá yếu (ít nhất 6 ký tự)");
      } else {
        setError(error.message || "Đăng ký thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(res.user);
      navigate("/");
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        setError("Bạn đã đóng cửa sổ đăng nhập trước khi hoàn tất");
      } else {
        setError("Đăng ký bằng Google thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return null;
  }

  return (
    <>
      <Header />
      <Navbar />

      <div className="flex justify-center mt-10">
        <div className="w-[600px] bg-white p-6 shadow rounded">
          <h2 className="text-2xl font-bold text-center mb-2 !text-black">
            ĐĂNG KÝ
          </h2>
          <div className="h-1 w-20 bg-pink-500 mb-4 mx-auto" />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Name
            </label>
            <Input
              type="text"
              placeholder="Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white text-black"
              title="Vui lòng nhập tên"
              autoComplete="name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Email
            </label>
            <Input
              type="email"
              placeholder="Email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="bg-white text-black"
              title="Vui lòng nhập email"
              autoComplete="email"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Vui lòng nhập từ 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white text-black pr-10"
                title="Vui lòng nhập mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent text-gray-500 hover:text-black"
                style={{ border: "none", outline: "none" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white text-black pr-10"
                title="Vui lòng nhập lại mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent text-gray-500 hover:text-black"
                style={{ border: "none", outline: "none" }}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end text-sm mb-4">
            <Link
              to="/dang-nhap"
              tabIndex={-1}
              className="text-blue-600 hover:underline hover:text-purple-600 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>

          {error && (
            <div className="text-red-600 text-sm mb-4 mt-4 text-center">
              {error}
            </div>
          )}

          <Button
            className="w-full bg-yellow-400 text-black mt-2 border-none outline-none focus:outline-none"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>

          <Button
            className="w-full mt-4 bg-red-500 text-white flex items-center justify-center border-none outline-none focus:outline-none"
            onClick={handleGoogleRegister}
            disabled={loading}
          >
            {loading ? (
              "Đang đăng ký bằng Google..."
            ) : (
              <>
                <span className="mr-2 text-xl">G</span> Đăng ký bằng Google
              </>
            )}
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
};
