import React, { useEffect, useRef, useState, type ChangeEvent } from "react";
import imageCompression from "browser-image-compression";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { onAuthStateChanged, type User, updatePassword, updateProfile } from "firebase/auth";
import {
  BookOpen,
  Lock,
  LogOut,
  UserCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import defaultAvatar from "@/assets/anonymous.png";
import { useFollow } from "@/hooks/useFollow";
import { useHistory } from "@/hooks/useHistory";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/formatDate";
import { normalizeSlug } from "@/utils/slug";

interface UserData {
  displayName: string;
  email: string;
  accountType: string;
  avatar: string;
  bio?: string;
}

type TabKey =
  | "info"
  | "followed"
  | "password"
  | "logout";

const validateUserData = (data: any): any => {
  const validData = { ...data };
  if (validData.name) {
    validData.displayName = validData.name;
    delete validData.name;
  }
  return validData;
};

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const { follows, isLoading, unfollow } = useFollow();
  const { accountHistory, isLoggedIn } = useHistory();
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "">("");
  const [loading, setLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 36;

  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentFollows = follows.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(follows.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [follows]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setLoadingUserData(false);
        navigate("/dang-nhap");
        return;
      }

      try {
        setUser(u);
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        const provider = u.providerData[0]?.providerId;
        const accountType =
          provider === "google.com"
            ? "GOOGLE"
            : provider === "password"
              ? "EMAIL"
              : "KHÁC";

        if (docSnap.exists()) {
          const data = docSnap.data();
          const validatedData = validateUserData(data);
          if (data.name) {
            await updateDoc(docRef, {
              displayName: validatedData.displayName || u.displayName || "",
              name: deleteField(),
            });
          }
          setUserData({
            displayName: validatedData.displayName || u.displayName || "",
            email: u.email || "",
            accountType,
            avatar: validatedData.avatar || "",
            bio: validatedData.bio || "",
          });
        } else {
          const newUserData = validateUserData({
            displayName: u.displayName || "",
            email: u.email || "",
            accountType,
            avatar: "",
            bio: "",
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          });
          await updateDoc(docRef, newUserData);
          setUserData({
            displayName: newUserData.displayName,
            email: newUserData.email,
            accountType: newUserData.accountType,
            avatar: newUserData.avatar,
            bio: newUserData.bio,
          });
        }
      } catch (err) {
      } finally {
        setLoadingUserData(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUploadConfirmed = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);

    try {
      const compressedFile = await imageCompression(selectedFile, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", "manga_avatar");
      formData.append("folder", "avatars");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dfixwzsbz/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      const uploadedURL = data.secure_url;

      const updateData = validateUserData({
        avatar: uploadedURL,
        name: deleteField(),
      });
      await updateDoc(doc(db, "users", user.uid), updateData);

      await updateProfile(user, { photoURL: uploadedURL });

      setUserData((prev) =>
        prev ? { ...prev, avatar: uploadedURL } : prev
      );
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
    } finally {
      setUploading(false);
    }
  };

  const getAvatarSrc = (): string => {
    if (previewUrl) return previewUrl;
    if (!userData) return defaultAvatar;
    return userData.avatar?.startsWith("http") ? userData.avatar : defaultAvatar;
  };

  const getLastReadChapter = (slug: string, title?: string): string | null => {
    if (!isLoggedIn) {
      return null;
    }
    if (!accountHistory.length) {
      return null;
    }
    let historyItem = accountHistory
      .filter((item) => item.slug === slug)
      .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())[0];

    if (!historyItem && title) {
      const normalizedTitleSlug = normalizeSlug(title);
      historyItem = accountHistory
        .filter((item) => item.slug === normalizedTitleSlug || item.title === title)
        .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())[0];
    }

    if (!historyItem) {
      historyItem = accountHistory
        .filter((item) => {
          try {
            return (
              (item.slug && slug && item.slug.includes(slug.slice(0, 30))) ||
              (item.slug && slug && slug.includes(item.slug.slice(0, 30)))
            );
          } catch {
            return false;
          }
        })
        .sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())[0];
    }

    if (!historyItem) {
      return null;
    }

    return historyItem.chapter;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!newPassword || !confirmPassword) {
      setMessage("Vui lòng nhập đầy đủ thông tin.");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu không khớp.");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const current = auth.currentUser;
      if (current) {
        await updatePassword(current, newPassword);
        await updateDoc(doc(db, "users", current.uid), {
          name: deleteField(),
        });
        navigate("/");
      } else {
        setMessage("Không tìm thấy người dùng.");
        setMessageType("error");
      }
    } catch (error: any) {
      setMessage("Đổi mật khẩu thất bại: " + (error?.message || error));
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const current = auth.currentUser;
    if (current) {
      const isGoogle = current.providerData.some(
        (provider) => provider.providerId === "google.com"
      );
      setIsGoogleUser(isGoogle);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "password") {
      setNewPassword("");
      setConfirmPassword("");
      setMessage("");
      setMessageType("");
    }
  }, [activeTab]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "Thông tin tài khoản", icon: <UserCircle size={16} /> },
    { key: "followed", label: "Truyện theo dõi", icon: <BookOpen size={16} /> },
    ...(!isGoogleUser
      ? [
        {
          key: "password" as TabKey,
          label: "Đổi mật khẩu",
          icon: <Lock size={16} />,
        },
      ]
      : []),
    { key: "logout", label: "Thoát", icon: <LogOut size={16} /> },
  ];

  if (loadingUserData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-gray-900">
      <Header />
      <Navbar />

      <main className="max-w-6xl mx-auto p-6 flex gap-6">
        <aside className="w-64 p-4 bg-white text-sm space-y-3">
          <div className="text-center mb-4">
            <img
              src={getAvatarSrc()}
              alt="Avatar"
              className="w-20 h-20 object-cover mx-auto mb-2 border"
            />
            <p className="text-xs text-gray-600">Tài khoản của</p>
            <p className="font-bold uppercase text-base text-black">
              {userData?.displayName}
            </p>
          </div>

          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={async () => {
                  if (tab.key === "logout") {
                    try {
                      await auth.signOut();
                      navigate("/");
                    } catch (error) {
                    }
                  } else {
                    setActiveTab(tab.key);
                  }
                }}
                className={`flex items-center gap-2 px-2 py-1 w-full text-left transition-colors duration-150 border-none outline-none focus:outline-none ${activeTab === tab.key
                  ? "bg-gray-200 text-black font-semibold"
                  : "bg-white text-black hover:bg-gray-100"
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex-1 space-y-6">
          {activeTab === "info" && userData && (
            <>
              <div className="border rounded-xl p-4 bg-white shadow">
                <h2 className="text-lg font-bold mb-4 border-b pb-2">
                  THÔNG TIN CHUNG
                </h2>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Họ và tên:</strong> {userData.displayName}
                  </p>
                  <p>
                    <strong>Email:</strong> {userData.email}
                  </p>
                  <p>
                    <strong>Tài khoản:</strong> {userData.accountType}
                  </p>
                  <div className="text-center mt-1">
                    <Link
                      to="/cap-nhat-thong-tin"
                      className="text-blue-600 hover:text-purple-600 transition-colors duration-200 underline-offset-4 hover:underline inline-block"
                      state={{ displayName: userData.displayName, email: userData.email }}
                    >
                      Thay đổi
                    </Link>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl p-4 bg-white shadow">
                <h3 className="font-semibold mb-4 text-lg">AVATAR</h3>
                <div className="flex items-center gap-6">
                  <img
                    src={getAvatarSrc()}
                    alt="Avatar preview"
                    className="w-24 h-24 object-cover border"
                  />
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button
                      className="bg-red-500 text-white"
                      onClick={handleChooseFile}
                      disabled={uploading}
                    >
                      {uploading ? "Đang tải..." : "Chọn ảnh"}
                    </Button>
                    <p className="text-xs text-red-500 mt-1">
                      Avatar tục tĩu sẽ bị khóa vĩnh viễn
                    </p>

                    {selectedFile && previewUrl && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 mt-1">
                          Avatar đẹp đấy, Upload thôi !!!
                        </p>
                        <Button
                          className="mt-1 bg-green-600 text-white"
                          onClick={handleUploadConfirmed}
                          disabled={uploading}
                        >
                          {uploading ? "Đang tải..." : "Upload ảnh"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "followed" && (
            <div className="p-4 bg-white rounded-xl shadow">
              <h2 className="font-semibold text-lg mb-4">
                TRUYỆN ĐANG THEO DÕI ({follows.length})
              </h2>

              {isLoading ? (
                <p>Đang tải danh sách...</p>
              ) : follows.length === 0 ? (
                <p>Bạn chưa theo dõi truyện nào.</p>
              ) : (
                <>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-sm bg-black text-white">
                        <th className="p-3 whitespace-nowrap">TÊN TRUYỆN</th>
                        <th className="p-3 whitespace-nowrap">XEM GẦN NHẤT</th>
                        <th className="p-3 whitespace-nowrap">CHAP MỚI NHẤT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFollows.map((item) => {
                        const chapter = getLastReadChapter(item.slug, item.title);
                        return (
                          <tr key={item.slug} className="border-b">
                            <td className="p-3">
                              <div className="flex items-start gap-3">
                                <img
                                  src={item.cover}
                                  alt={item.title}
                                  title={item.title}
                                  className="w-12 h-12 object-cover cursor-pointer"
                                  onClick={() => navigate(`/truyen-tranh/${item.slug}`)}
                                />
                                <div className="flex flex-col">
                                  <Link
                                    to={`/truyen-tranh/${item.slug}`}
                                    title={item.title}
                                    className="text-blue-600 hover:text-purple-600 truncate max-w-[400px]"
                                  >
                                    {item.title}
                                  </Link>
                                  <button
                                    onClick={() => unfollow(item.slug)}
                                    className="text-red-600 text-xs mt-1 text-left bg-transparent border-none outline-none focus:outline-none p-0 w-fit"
                                  >
                                    ❌ Bỏ theo dõi
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-sm text-gray-600">
                              <div>
                                {chapter ? (
                                  <Link
                                    title={chapter}
                                    to={`/truyen-tranh/${item.slug}/chuong-${chapter.replace("Chapter ", "")}`}
                                    className="text-black hover:text-blue-600 font-normal"
                                  >
                                    {chapter}
                                  </Link>
                                ) : null}

                                {item.lastReadAt && (
                                  <p className="italic">{formatDate(item.lastReadAt)}</p>
                                )}
                              </div>
                            </td>
                            {item.latestChapter?.title ? (
                              <td className="p-3 text-sm text-gray-600">
                                <a
                                  title={item.latestChapter.title}
                                  href={`/truyen-tranh/${item.slug}/${item.latestChapter.title
                                    ?.toLowerCase()
                                    ?.replace(/\s+/g, "-")}`}
                                  className="text-black hover:text-blue-600 font-normal"
                                >
                                  {item.latestChapter.title}
                                </a>
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border border-gray-300 bg-white outline-none focus:outline-none text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        &lt;
                      </button>

                      <span className="px-3 py-1">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border border-gray-300 bg-white outline-none focus:outline-none text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "password" && (
            <div className="p-4 bg-white rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4 border-b pb-2">ĐỔI MẬT KHẨU</h2>
              <form className="space-y-4" onSubmit={handleChangePassword}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      title="Nhập mật khẩu mới"
                      placeholder="Vui lòng nhập từ 6 ký tự"
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white mt-1 block w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 bg-transparent hover:text-black focus:outline-none focus:ring-0 hover:outline-none hover:ring-0 active:outline-none border-0 shadow-none focus:shadow-none hover:shadow-none"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      title="Nhập xác nhận mật khẩu mới"
                      placeholder="Nhập lại mật khẩu mới"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white mt-1 block w-full p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 bg-transparent hover:text-black focus:outline-none focus:ring-0 hover:outline-none hover:ring-0 active:outline-none border-0 shadow-none focus:shadow-none hover:shadow-none"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {message && (
                  <p className={`text-sm mt-2 ${messageType === "error" ? "text-red-500" : "text-green-500"}`}>
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-600 text-white py-2 px-4 rounded-md ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
