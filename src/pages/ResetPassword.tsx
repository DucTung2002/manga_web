import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Eye, EyeOff } from "lucide-react";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const [valid, setValid] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setValid(false);
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);
        setValid(true);
      } catch (error) {
        setValid(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  useEffect(() => {
    if (valid === false) {
      navigate("/", { replace: true });
    }
  }, [valid, navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu không khớp.");
      setLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      alert("Đổi mật khẩu thành công!");
      navigate("/dang-nhap");
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  if (valid !== true) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <p className="text-black text-sm">Đang kiểm tra liên kết...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Navbar />
      <div className="flex justify-center mt-10">
        <div className="w-[600px] bg-white p-6 shadow rounded">
          <h2 className="text-2xl font-bold text-center mb-2 !text-black">THAY ĐỔI MẬT KHẨU</h2>
          <div className="h-1 w-20 bg-pink-500 mb-4 mx-auto" />

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">Mật khẩu mới</label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Vui lòng nhập từ 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white text-black pr-10"
                title="Vui lòng nhập mật khẩu"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent text-gray-500 hover:text-black border-none outline-none focus:outline-none"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 !text-black">Nhập lại mật khẩu mới</label>
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
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-transparent text-gray-500 hover:text-black border-none outline-none focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm mb-4 mt-4 text-center">{error}</div>
          )}

          <Button
            className="w-full bg-yellow-400 text-black mt-2 border-none outline-none focus:outline-none"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi"}
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
};
