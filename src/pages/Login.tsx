import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, googleProvider, db } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react";
import { signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Helmet } from 'react-helmet-async';

const toastedUsers = new Set<string>();

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      isAccountLocked &&
      user &&
      location.pathname === "/" &&
      !toastedUsers.has(user.uid)
    ) {
      const toastId = `locked-${user.uid}`;
      toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", {
        position: "top-center",
        autoClose: 3000,
        toastId,
        onClose: () => {
          toastedUsers.add(user.uid);
          handleSignOut();
        },
      });
    }
  }, [isAccountLocked, user, location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === "Khóa") {
            setIsAccountLocked(true);
            if (location.pathname !== "/") {
              navigate("/", { replace: true });
            }
            return;
          }
        }
        navigate("/", { replace: true });
      } else {
        setUser(null);
        setIsAccountLocked(false);
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    if (user) toastedUsers.delete(user.uid);
    setUser(null);
    setIsAccountLocked(false);
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      setUser(currentUser);

      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === "Khóa") {
          setIsAccountLocked(true);
          navigate("/", { replace: true });
          setLoading(false);
          return;
        }
      }
      navigate("/", { replace: true });
    } catch (error: any) {
      switch (error.code) {
        case "auth/invalid-email":
          setError("Email không hợp lệ");
          break;
        case "auth/user-not-found":
          setError("Không tìm thấy người dùng với email này");
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Sai mật khẩu hoặc thông tin đăng nhập không hợp lệ");
          break;
        case "auth/too-many-requests":
          setError("Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.");
          break;
        default:
          setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.");
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      setUser(currentUser);

      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: currentUser.uid,
          displayName: currentUser.displayName || "Không tên",
          email: currentUser.email,
          status: "Hoạt động",
          createdAt: serverTimestamp(),
        });
      } else {
        const data = docSnap.data();
        if (data.status === "Khóa") {
          setIsAccountLocked(true);
          navigate("/", { replace: true });
          setLoading(false);
          return;
        }
      }
      navigate("/", { replace: true });
    } catch (error: any) {
      switch (error.code) {
        case "auth/popup-closed-by-user":
          setError("Bạn đã đóng cửa sổ đăng nhập Google");
          break;
        case "auth/cancelled-popup-request":
          setError("Yêu cầu đăng nhập bị hủy do popup trước đó");
          break;
        case "auth/popup-blocked":
          setError("Trình duyệt đã chặn popup. Vui lòng bật popup cho trang này");
          break;
        default:
          setError("Đăng nhập Google thất bại. Vui lòng thử lại");
      }
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Đăng nhập</title>
      </Helmet>
      <ToastContainer position="top-center" autoClose={3000} />
      <Header />
      <Navbar />

      <div className="flex justify-center mt-10">
        <div className="w-[600px] bg-white p-6 shadow rounded">
          <h2 className="text-2xl font-bold text-center mb-2 !text-black">
            ĐĂNG NHẬP
          </h2>
          <div className="h-1 w-20 bg-pink-500 mb-4 mx-auto" />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Email
            </label>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white text-black"
              title="Vui lòng nhập email của bạn"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white text-black pr-10"
                title="Vui lòng nhập mật khẩu của bạn"
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

          <div className="flex justify-between text-sm mb-4">
            <Link
              to="/quen-mat-khau"
              tabIndex={-1}
              className="text-blue-600 hover:underline hover:text-purple-600 transition-colors"
            >
              Quên mật khẩu
            </Link>
            <Link
              to="/dang-ky"
              tabIndex={-1}
              className="text-blue-600 hover:underline hover:text-purple-600 transition-colors"
            >
              Đăng ký
            </Link>
          </div>

          {error && (
            <div className="mb-4 mt-4 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full bg-yellow-400 text-black mt-2 border-none outline-none focus:outline-none ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full mt-4 bg-red-500 text-white flex items-center justify-center border-none outline-none focus:outline-none ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? (
              "Đang đăng nhập Google..."
            ) : (
              <>
                <span className="mr-2 text-xl">G</span> Đăng nhập bằng Google
              </>
            )}
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
};
