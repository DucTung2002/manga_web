import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import {
  Info,
  Home,
  List,
  ChevronLeft,
  ChevronRight,
  Heart,
  X
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useHistory } from "@/hooks/useHistory";
import { useFollow } from "@/hooks/useFollow";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  increment,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from "firebase/firestore";

const NavigationBar = ({
  truyenSlug,
  currentChapter,
  sortedChapters,
  currentIndex,
  goToChapter,
  navigate,
  handleFollowClick,
  handleUnfollowClick,
  isFollowed
}: any) => {
  return (
    <div className="flex justify-center gap-2 items-center">
      <Home
        size={24}
        className="text-red-500 hover:text-red-600 cursor-pointer"
        onClick={() => navigate("/")}
      />
      <List
        size={24}
        className="text-red-500 hover:text-red-600 cursor-pointer"
        onClick={() => navigate(`/truyen-tranh/${truyenSlug}`)}
      />

      <Button
        onClick={() => currentIndex > 0 && goToChapter(currentIndex - 1)}
        disabled={currentIndex === 0}
        className={`text-white px-2.5 py-2 rounded border-none outline-none focus:outline-none ${currentIndex === 0
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-600"
          }`}
      >
        <ChevronLeft size={20} />
      </Button>

      <select
        value={currentChapter?.title || ""}
        onChange={(e) => {
          const idx = sortedChapters.findIndex(
            (c: any) => c.title === e.target.value
          );
          if (idx !== -1) goToChapter(idx);
        }}
        className="bg-white border px-3 py-2 w-80 focus:outline-none text-black"
      >
        {sortedChapters.map((c: any, idx: number) => (
          <option key={idx} value={c.title}>
            {c.title}
          </option>
        ))}
      </select>

      <Button
        onClick={() =>
          currentIndex < sortedChapters.length - 1 &&
          goToChapter(currentIndex + 1)
        }
        disabled={currentIndex === sortedChapters.length - 1}
        className={`text-white px-2.5 py-2 rounded border-none outline-none focus:outline-none ${currentIndex === sortedChapters.length - 1
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-red-500 hover:bg-red-600"
          }`}
      >
        <ChevronRight size={20} />
      </Button>

      {isFollowed ? (
        <Button
          onClick={handleUnfollowClick}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded flex items-center gap-2 border-none outline-none focus:outline-none"
        >
          <X size={20} /> Bỏ theo dõi
        </Button>
      ) : (
        <Button
          onClick={handleFollowClick}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded flex items-center gap-2 border-none outline-none focus:outline-none"
        >
          <Heart size={20} /> Theo dõi
        </Button>
      )}
    </div>
  );
};

export const ChapterReader = () => {
  const { slug = "", chapterSlug = "" } = useParams<{
    slug?: string;
    chapterSlug?: string;
  }>();

  const navigate = useNavigate();
  const { addChapter } = useHistory();
  const { follow, unfollow, isFollowed, updateLastReadTime, isLoggedIn } = useFollow();
  const [truyen, setTruyen] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowedState, setIsFollowed] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>(undefined);
  const [imageErrors, setImageErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchTruyen = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "comics"),
          where("slug", "==", slug)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const truyenData = querySnapshot.docs[0].data();
          setTruyen(truyenData);
        } else {
          setTruyen(null);
        }
      } catch (error) {
        setTruyen(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTruyen();
  }, [slug]);

  const sortedChapters = useMemo(() => {
    if (!truyen || !truyen.chapters) {
      return [];
    }
    return [...truyen.chapters].sort((a: any, b: any) => {
      const aNum = parseFloat(a.title.match(/[\d.]+/)?.[0] || "0");
      const bNum = parseFloat(b.title.match(/[\d.]+/)?.[0] || "0");
      return aNum - bNum;
    });
  }, [truyen?.chapters]);

  const normalizeSlug = (slug: string) => {
    return slug
      .replace(/^chuong-/, "")
      .replace(/^chapter-/, "")
      .replace(/[^0-9.]/g, "")
      .trim();
  };

  const chapNumber = normalizeSlug(chapterSlug);
  const currentIndex = sortedChapters.findIndex((c: any) => {
    const cNumber = normalizeSlug(c.title);
    return cNumber === chapNumber;
  });
  const currentChapter = sortedChapters[currentIndex];
  const truyenSlug = truyen?.slug || slug;

  useEffect(() => {
    if (truyen) {
      const truyenSlug = truyen.slug || slug;
      setIsFollowed(isFollowed(truyenSlug || ""));
    }
  }, [isFollowed, slug, truyen]);

  const fetchFollowerCount = async () => {
    try {
      if (!truyen) return;
      const truyenSlug = truyen.slug || slug;
      const q = query(collection(db, "follows"), where("slug", "==", truyenSlug));
      const snapshot = await getDocs(q);
      setFollowerCount(snapshot.size);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchFollowerCount();
  }, [slug, truyen]);

  const handleFollowClick = async () => {
    if (!isLoggedIn) {
      navigate("/dang-nhap");
      return;
    }
    const truyenSlug = truyen?.slug || slug;
    await follow({
      slug: truyenSlug || "",
      title: truyen?.title || "",
      cover: truyen?.cover || "",
      latestChapter: {
        title: truyen?.chapters?.[0]?.title || ""
      }
    });
    setIsFollowed(true);
    setFollowerCount((prev) => (prev ?? 0) + 1);
  };

  const handleUnfollowClick = async () => {
    if (!isLoggedIn) return;
    const truyenSlug = truyen?.slug || slug;
    await unfollow(truyenSlug || "");
    setIsFollowed(false);
    setFollowerCount((prev) => Math.max((prev ?? 0) - 1, 0));
  };

  const navRef = useRef<HTMLDivElement>(null);
  const [showFixedNav, setShowFixedNav] = useState(false);
  const [hasCountedView, setHasCountedView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current) return;
      const rect = navRef.current.getBoundingClientRect();
      setShowFixedNav(rect.bottom < 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterSlug]);

  useEffect(() => {
    setHasCountedView(false);
  }, [currentChapter]);

  useEffect(() => {
    if (!currentChapter || !truyenSlug || hasCountedView) return;

    const timeout = setTimeout(async () => {
      try {
        const raw = sessionStorage.getItem("sessionReadChapters");
        const sessionReadChapters: Record<string, string[]> = raw ? JSON.parse(raw) : {};
        if (!sessionReadChapters[truyenSlug]) {
          sessionReadChapters[truyenSlug] = [];
        }
        if (!sessionReadChapters[truyenSlug].includes(currentChapter.title)) {
          sessionReadChapters[truyenSlug].push(currentChapter.title);
        }
        sessionStorage.setItem("sessionReadChapters", JSON.stringify(sessionReadChapters));

        addChapter({
          slug: truyenSlug,
          title: truyen?.title || "",
          cover: truyen?.cover || "",
          chapter: currentChapter.title,
          chaptersRead: [currentChapter.title],
        });

        updateLastReadTime(truyenSlug);

        try {
          const chapNum = normalizeSlug(currentChapter.title);
          const chapterId = `chuong-${chapNum}`;

          const chapterRef = doc(db, "comics", truyenSlug, "chapters", chapterId);
          await setDoc(chapterRef, { views: increment(1) }, { merge: true });

          const today = new Date().toISOString().split("T")[0];
          const statRef = doc(db, "comics", truyenSlug, "viewStats", today);
          await setDoc(statRef, { count: increment(1), updatedAt: serverTimestamp() }, { merge: true });
          setHasCountedView(true);
        } catch (error) {
          setHasCountedView(true);
        }
      } catch (err) {
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [currentChapter, truyenSlug, addChapter, updateLastReadTime, hasCountedView, truyen]);

  const goToChapter = (idx: number) => {
    const c = sortedChapters[idx];
    const cNumber = normalizeSlug(c.title);
    navigate(`/truyen-tranh/${truyenSlug}/chuong-${cNumber}`);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        goToChapter(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < sortedChapters.length - 1) {
        goToChapter(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, sortedChapters, goToChapter, truyenSlug]);

  if (isLoading) {
    return (
      <>
        <Header />
        <Navbar />
        <div className="min-h-screen bg-white" />
        <Footer />
      </>
    );
  }

  if (!truyen || !currentChapter) {
    return (
      <>
        <Header />
        <Navbar />
        <div className="text-center text-red-500 py-6">
          Không tìm thấy chương truyện.
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Navbar />
      <div className="bg-black min-h-screen text-white">
        <div className="max-w-[950px] mx-auto px-2 py-6">
          <div className="bg-gray-100 border rounded p-3 mb-4 text-black text-sm">
            <div className="mb-2 text-center">
              <Link
                to={`/truyen-tranh/${truyenSlug}`}
                className="text-blue-600 text-xl hover:underline cursor-pointer"
              >
                {truyen.title}
              </Link>{" "}
              - <span className="text-xl">{currentChapter.title}</span>
            </div>
            <div className="bg-blue-100 text-blue-700 text-base p-2 rounded mb-2 flex justify-center items-center gap-1">
              <Info size={16} />
              Sử dụng mũi tên trái (←) hoặc phải (→) để chuyển chương
            </div>
            <div ref={navRef}>
              <NavigationBar
                truyenSlug={truyenSlug}
                currentChapter={currentChapter}
                sortedChapters={sortedChapters}
                currentIndex={currentIndex}
                goToChapter={goToChapter}
                navigate={navigate}
                handleFollowClick={handleFollowClick}
                handleUnfollowClick={handleUnfollowClick}
                isFollowed={isFollowedState}
                followerCount={followerCount}
              />
            </div>
          </div>
          {imageErrors.length > 0 && (
            <div className="text-center text-red-500 py-2">
              Không thể tải {imageErrors.length} ảnh. Vui lòng kiểm tra đường dẫn ảnh.
            </div>
          )}
          {currentChapter.local_images.map((img: string, idx: number) => (
            <div key={idx} className="flex justify-center mb-2">
              <img
                src={img}
                alt={`Trang ${idx + 1}`}
                loading="lazy"
                onError={() => {
                  setImageErrors(prev => [...new Set([...prev, img])]);
                }}
              />
            </div>
          ))}
        </div>
        {showFixedNav && (
          <div className="fixed bottom-0 left-0 w-full bg-gray-100 border-t py-2 shadow z-50">
            <NavigationBar
              truyenSlug={truyenSlug}
              currentChapter={currentChapter}
              sortedChapters={sortedChapters}
              currentIndex={currentIndex}
              goToChapter={goToChapter}
              navigate={navigate}
              handleFollowClick={handleFollowClick}
              handleUnfollowClick={handleUnfollowClick}
              isFollowed={isFollowedState}
              followerCount={followerCount}
            />
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};
