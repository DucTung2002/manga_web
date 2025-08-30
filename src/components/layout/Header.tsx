import { useState, useEffect, useRef } from "react";
import { Search, User, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import bg from "@/assets/header-bg.jpg";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, onSnapshot, setDoc } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [allMangaCache, setAllMangaCache] = useState<any[]>([]);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);
  const unsubscribeSnapshot = useRef<(() => void) | null>(null);

  const handleLogout = async () => {
    if (unsubscribeSnapshot.current) {
      unsubscribeSnapshot.current();
      unsubscribeSnapshot.current = null;
    }
    await signOut(auth);
    setUser(null);
    setIsAccountLocked(false);
  };

  useEffect(() => {
    if (isAccountLocked && user && location.pathname === "/") {
      toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.", {
        position: "top-center",
        autoClose: 3000,
        toastId: `locked-${user.uid}`,
        onClose: handleLogout,
      });
    }
  }, [isAccountLocked, user, location.pathname]);

  useEffect(() => {
    isMounted.current = true;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted.current) return;

      setUser(currentUser);

      if (currentUser) {
        if (unsubscribeSnapshot.current) {
          unsubscribeSnapshot.current();
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeSnapshot.current = onSnapshot(userDocRef, async (docSnap) => {
          if (!isMounted.current) return;

          if (!docSnap.exists()) {
            await setDoc(userDocRef, {
              status: "Hoạt động",
              createdAt: new Date().toISOString(),
              displayName: currentUser.displayName,
              email: currentUser.email,
              avatar: currentUser.photoURL || "/default-avatar.png",
            });
            return;
          }

          const userData = docSnap.data();
          if (userData.status === "Khóa") {
            setIsAccountLocked(true);
            if (location.pathname !== "/") {
              navigate("/");
            }
          } else {
            setIsAccountLocked(false);
          }
        });
      } else {
        if (unsubscribeSnapshot.current) {
          unsubscribeSnapshot.current();
          unsubscribeSnapshot.current = null;
        }
      }
    });

    return () => {
      isMounted.current = false;
      if (unsubscribeSnapshot.current) {
        unsubscribeSnapshot.current();
      }
      unsubscribeAuth();
    };
  }, [location.pathname]);

  useEffect(() => {
    const fetchAllManga = async () => {
      const snapshot = await getDocs(collection(db, "comics"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllMangaCache(data);
    };
    fetchAllManga();
  }, []);

  useEffect(() => {
    setSearchText("");
    setSuggestions([]);
    setSelectedIndex(-1);
  }, [location.pathname]);

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const handleSearch = () => {
    if (!searchText.trim()) return;
    const keywordRaw = searchText.trim();
    const keywordNormalized = removeVietnameseTones(keywordRaw.toLowerCase());
    const results = allMangaCache.filter((item: any) => {
      const name = removeVietnameseTones((item.title || "").toLowerCase());
      return name.includes(keywordNormalized);
    });
    localStorage.setItem("searchResults", JSON.stringify(results));
    const encoded = encodeURIComponent(keywordRaw).replace(/%20/g, "+");
    navigate(`/tim-truyen?keyword=${encoded}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigate(`/truyen-tranh/${suggestions[selectedIndex].id}`);
        setSuggestions([]);
        setSearchText("");
        setSelectedIndex(-1);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }
  };

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }
    const keywordNormalized = removeVietnameseTones(searchText.toLowerCase());
    const filteredSuggestions = allMangaCache
      .filter((item: any) => {
        const name = removeVietnameseTones((item.title || "").toLowerCase());
        return name.includes(keywordNormalized);
      })
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        cover: item.cover,
        latestChapter: item.chapters?.[0]?.title,
        author:
          typeof item.author === "string" && item.author.trim()
            ? item.author
            : "Unknown",
        genres: Array.isArray(item.genres) ? item.genres : [],
      }))
      .slice(0, 10);
    setSuggestions(filteredSuggestions);
  }, [searchText, allMangaCache]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <header
        className="w-full text-white"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between">
          <img
            src={logo}
            alt="NetTruyen"
            className="w-40 object-contain cursor-pointer"
            onClick={() => navigate(`/`)}
          />
          <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Tìm truyện..."
                className="w-full pr-10 text-base bg-white text-black border border-gray-300 rounded-none placeholder:text-base focus:outline-none focus:border-gray-300 focus:ring-0"
                value={searchText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <div
                className="absolute right-0 top-0 h-full flex items-center px-3 cursor-pointer hover:bg-gray-200 transition"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4 text-gray-500" />
              </div>
            </div>
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white text-black shadow-lg mt-1 z-[1000] max-h-[460px] overflow-y-auto divide-y divide-gray-300">
                {suggestions.map((item, index) => (
                  <Link
                    key={item.id}
                    to={`/truyen-tranh/${item.id}`}
                    className={`flex items-center gap-2 p-2 hover:bg-gray-200 transition-colors ${index === selectedIndex ? "bg-gray-100 !text-gray-900" : ""
                      }`}
                    onClick={() => {
                      setSuggestions([]);
                      setSearchText("");
                      setSelectedIndex(-1);
                    }}
                  >
                    <img
                      src={item.cover || "/default-thumbnail.jpg"}
                      alt={item.title}
                      className="w-12 h-16 object-cover"
                    />
                    <div>
                      <p className="text-lg font-bold text-gray-900 truncate max-w-[350px]">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 italic truncate max-w-[350px]">
                        {item.latestChapter}
                      </p>
                      <p className="text-xs text-gray-600 italic truncate max-w-[350px]">
                        {item.author}
                      </p>
                      <p className="text-xs text-gray-600 italic truncate max-w-[350px]">
                        {item.genres.length > 0 ? item.genres.join(", ") : "N/A"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="relative group">
            <div className="flex items-center gap-1 text-sm cursor-pointer">
              <User className="w-4 h-4" />
              <span>Tài khoản ▼</span>
            </div>
            <div className="absolute top-full right-0 mt-1 w-40 bg-white text-black rounded shadow-lg opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-[999]">
              <ul className="py-2 text-sm">
                {user ? (
                  <>
                    <li>
                      <Link
                        to="/trang-ca-nhan"
                        className="px-4 py-2 text-black hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Trang cá nhân
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="bg-white border-none outline-none focus:outline-none w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2 rounded-none"
                      >
                        <LogIn className="w-4 h-4 rotate-180" />
                        Thoát
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/dang-nhap"
                        className="px-4 py-2 text-black hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        Đăng nhập
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dang-ky"
                        className="px-4 py-2 text-black hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Đăng ký
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
