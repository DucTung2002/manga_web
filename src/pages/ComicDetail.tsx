import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HistoryTab } from "@/components/layout/HistoryTab";
import { User, Tags, BookOpen, Info, Eye, Heart, X } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useFollow } from "@/hooks/useFollow";
import type { HistoryItem } from "@/hooks/useHistory";
import { Button } from "@/components/ui/Button";
import { Helmet } from 'react-helmet-async';

interface Chapter {
  title: string;
}

interface Truyen {
  title: string;
  link: string;
  cover: string;
  author: string;
  status: string;
  genres: string[];
  views?: number;
  description: string;
  chapters: Chapter[];
  other_name?: string;
  updated_at: string;
}

function slugify(text: string) {
  const vietnameseMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    'Đ': 'D',
  };

  let slug = text
    .split('')
    .map(char => vietnameseMap[char] || char)
    .join('');

  slug = slug
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  return slug;
}

export const ComicDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [truyen, setTruyen] = useState<Truyen | null>(null);
  const [visibleChapters, setVisibleChapters] = useState(20);
  const [loading, setLoading] = useState(false);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
  const [sessionReadChapters, setSessionReadChapters] = useState<Record<string, string[]>>({});
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [isFollowedState, setIsFollowedState] = useState(false);

  const { isLoggedIn: isUserLoggedIn, isFollowed, follow, unfollow } = useFollow();
  const { deviceHistory, accountHistory, isLoggedIn, addChapter } = useHistory();

  const truyenSlug = slug || "";

  useEffect(() => {
    const raw = sessionStorage.getItem("sessionReadChapters");
    if (raw) setSessionReadChapters(JSON.parse(raw));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sessionReadChapters") {
        setSessionReadChapters(e.newValue ? JSON.parse(e.newValue) : {});
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveSession = (updated: Record<string, string[]>) => {
    sessionStorage.setItem("sessionReadChapters", JSON.stringify(updated));
    setSessionReadChapters(updated);
  };

  const markAsReadInSession = (slug: string, chapter: string) => {
    const updated = { ...sessionReadChapters };
    if (!updated[slug]) updated[slug] = [];
    if (!updated[slug].includes(chapter)) updated[slug].push(chapter);
    saveSession(updated);
  };

  useEffect(() => {
    if (!truyen || !location.pathname.includes("/chuong-")) return;
    const match = location.pathname.match(/chuong-([\d.]+)/);
    if (match) {
      const chapterNumber = match[1];
      const chapterTitle = truyen.chapters.find(chap => chap.title.match(/[\d.]+/)?.[0] === chapterNumber)?.title || `Chapter ${chapterNumber}`;
      if (!isLoggedIn) {
        markAsReadInSession(truyenSlug, chapterTitle);
      }
      addChapter({
        slug: truyenSlug,
        title: truyen.title,
        cover: truyen.cover,
        chapter: chapterTitle,
        chaptersRead: [chapterTitle],
      });
    }
  }, [location.pathname, truyen, truyenSlug, addChapter, isLoggedIn]);

  useEffect(() => {
    if (!slug) return;
    const fetchTruyen = async () => {
      try {
        const docRef = doc(db, "comics", slug);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setTruyen(null);
          return;
        }
        const data = snap.data();
        const truyenData: Truyen = {
          title: data.title,
          link: data.link,
          cover: data.cover,
          author: data.author,
          status: data.status,
          genres: Array.isArray(data.genres) ? data.genres : [],
          views: data.views,
          description: data.description,
          chapters: data.chapters || [],
          other_name: data.other_name || "",
          updated_at: data.updated_at,
        };
        setTruyen(truyenData);
      } catch {
        setTruyen(null);
      }
    };
    fetchTruyen();
  }, [slug]);

  useEffect(() => {
    if (truyenSlug) {
      setIsFollowedState(isFollowed(truyenSlug));
    }
  }, [isFollowed, truyenSlug]);

  useEffect(() => {
    const fetchTotalViews = async () => {
      try {
        const snapshot = await getDocs(collection(db, "comics", truyenSlug, "chapters"));
        let sum = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (typeof data.views === "number") sum += data.views;
        });
        setTotalViews(sum);
      } catch {
        setTotalViews(null);
      }
    };
    if (truyenSlug) fetchTotalViews();
  }, [truyenSlug]);

  useEffect(() => {
    const fetchFollowerCount = async () => {
      try {
        const q = query(collection(db, "follows"), where("slug", "==", truyenSlug));
        const snapshot = await getDocs(q);
        setFollowerCount(snapshot.size);
        const cachedCountsRaw = localStorage.getItem("followerCounts");
        const cachedData = cachedCountsRaw ? JSON.parse(cachedCountsRaw) : { counts: {}, timestamp: 0 };
        cachedData.counts[truyenSlug] = snapshot.size;
        localStorage.setItem("followerCounts", JSON.stringify(cachedData));
      } catch {
        setFollowerCount(null);
      }
    };
    if (truyenSlug) fetchFollowerCount();
  }, [truyenSlug]);

  useEffect(() => {
    if (truyen) {
      const timeout = setTimeout(() => setIsReady(true), 600);
      return () => clearTimeout(timeout);
    }
  }, [truyen]);

  useEffect(() => {
    const updateLastReadIfNeeded = async () => {
      if (!isUserLoggedIn || !isFollowedState || !truyenSlug) return;
      try {
        const docRef = doc(db, "follows", auth.currentUser!.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;
        const comics = snap.data().comics || {};
        const existing = comics[truyenSlug];
        if (!existing) return;
        const today = new Date().toDateString();
        const lastReadDate = existing.lastReadAt ? new Date(existing.lastReadAt).toDateString() : null;
        if (lastReadDate === today) return;
        await follow({
          slug: truyenSlug,
          title: existing.title,
          cover: existing.cover,
          latestChapter: existing.latestChapter || { title: "" },
          lastReadAt: new Date().toISOString(),
        });
      } catch { }
    };
    updateLastReadIfNeeded();
  }, [isUserLoggedIn, isFollowedState, truyenSlug]);

  const handleFollowClick = async () => {
    if (!isUserLoggedIn) return navigate("/dang-nhap");
    if (!truyen) return;
    await follow({
      slug: truyenSlug,
      title: truyen.title,
      cover: truyen.cover,
      latestChapter: truyen.chapters?.[0] || { title: "" },
    });
    setIsFollowedState(true);
    setFollowerCount((prev) => (prev ?? 0) + 1);
    const cachedCountsRaw = localStorage.getItem("followerCounts");
    const cachedData = cachedCountsRaw ? JSON.parse(cachedCountsRaw) : { counts: {}, timestamp: 0 };
    cachedData.counts[truyenSlug] = (cachedData.counts[truyenSlug] || 0) + 1;
    localStorage.setItem("followerCounts", JSON.stringify(cachedData));
    window.dispatchEvent(new StorageEvent("storage", { key: "followerCounts", newValue: JSON.stringify(cachedData) }));
  };

  const handleUnfollowClick = async () => {
    if (!isUserLoggedIn) return;
    await unfollow(truyenSlug);
    setIsFollowedState(false);
    setFollowerCount((prev) => Math.max((prev ?? 1) - 1, 0));
    const cachedCountsRaw = localStorage.getItem("followerCounts");
    const cachedData = cachedCountsRaw ? JSON.parse(cachedCountsRaw) : { counts: {}, timestamp: 0 };
    cachedData.counts[truyenSlug] = Math.max((cachedData.counts[truyenSlug] || 1) - 1, 0);
    localStorage.setItem("followerCounts", JSON.stringify(cachedData));
    window.dispatchEvent(new StorageEvent("storage", { key: "followerCounts", newValue: JSON.stringify(cachedData) }));
  };

  const handleChapterClick = async (chapter: string) => {
    if (!truyen) return;
    if (!isLoggedIn) {
      markAsReadInSession(truyenSlug, chapter);
    }
    try {
      await addChapter({
        slug: truyenSlug,
        title: truyen.title,
        cover: truyen.cover,
        chapter,
        chaptersRead: [chapter],
      });
    } catch (error) {
    }
  };

  const handleLoadMore = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!truyen) return;
    setClickPos({ x: e.clientX, y: e.clientY });
    setLoading(true);
    const loadTime = Math.min((truyen.chapters.length - visibleChapters) * 100, 3000);
    setTimeout(() => {
      setVisibleChapters(truyen.chapters.length);
      setLoading(false);
      setClickPos(null);
    }, loadTime);
  };

  if (!truyen) return <div className="bg-white min-h-screen w-full"></div>;

  const accountChapters = isLoggedIn ? (accountHistory.find((h: HistoryItem) => h.slug === truyenSlug)?.chaptersRead || []) : [];
  const deviceChapters = !isLoggedIn ? (deviceHistory.find((h: HistoryItem) => h.slug === truyenSlug)?.chaptersRead || []) : [];
  const sessionChapters = sessionReadChapters[truyenSlug] || [];

  const lastRead = isLoggedIn
    ? accountChapters.slice(-1)[0]
    : deviceChapters.slice(-1)[0] || sessionChapters.slice(-1)[0];
  const chapNumber = lastRead?.match(/[\d.]+/)?.[0] || lastRead || "";
  const isChapterRead = (title: string) =>
    isLoggedIn
      ? accountChapters.includes(title)
      : sessionChapters.includes(title) || deviceChapters.includes(title);

  if (!isReady) return <div className="bg-white min-h-screen w-full"></div>;

  return (
    <>
      <Helmet>
        <title>{truyen?.title}</title>
      </Helmet>
      <Header />
      <Navbar />
      <section className="w-full bg-gray-100 px-4 py-6 min-h-screen">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white p-4 rounded shadow border">
            <div className="text-center mb-4">
              <h1 className="text-3xl font-bold text-black">{truyen.title}</h1>
              <p className="italic text-gray-600">{truyen.updated_at}</p>
            </div>
            <div className="flex gap-4 mb-4">
              <img src={truyen.cover} alt={truyen.title} className="w-52 h-72 object-cover rounded border" />
              <div className="flex-1 text-black space-y-1">
                {truyen.other_name && (
                  <InfoRow icon={<Info size={16} />} label="Tên khác:" value={truyen.other_name} />
                )}
                <InfoRow icon={<User size={16} />} label="Tác giả:" value={truyen.author} />
                <InfoRow icon={<BookOpen size={16} />} label="Tình trạng:" value={truyen.status} />
                <InfoRow
                  icon={<Tags size={16} />}
                  label="Thể loại:"
                  value={
                    <div className="flex flex-wrap gap-1">
                      {truyen.genres.map((genre, idx) => (
                        <React.Fragment key={genre}>
                          <Link
                            to={`/tim-truyen/${slugify(genre)}`}
                            className="text-blue-600 hover:text-purple-600 hover:underline"
                          >
                            {genre}
                          </Link>
                          {idx !== truyen.genres.length - 1 && <span className="mx-1">-</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  }
                />
                <InfoRow icon={<Eye size={16} />} label="Lượt xem:" value={totalViews ?? "?"} />
                <p className="text-sm text-gray-700 whitespace-pre-line">{truyen.description}</p>
                <ActionButtons
                  isFollowed={isFollowedState}
                  handleFollowClick={handleFollowClick}
                  handleUnfollowClick={handleUnfollowClick}
                  followerCount={followerCount}
                  truyenSlug={truyenSlug}
                  truyen={truyen}
                  chapNumber={chapNumber}
                  lastRead={lastRead}
                  handleChapterClick={handleChapterClick}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg text-black font-semibold mb-2">Danh sách chương</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-center text-black">
                    <th className="p-2">Số chương</th>
                  </tr>
                </thead>
                <tbody>
                  {truyen.chapters.slice(0, visibleChapters).map((chap, idx) => {
                    const chapNum = chap.title.match(/[\d.]+/)?.[0] || "";
                    const isRead = isChapterRead(chap.title);
                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-2 border text-center">
                          <Link
                            to={`/truyen-tranh/${truyenSlug}/chuong-${chapNum}`}
                            className={`hover:text-blue-600 ${isRead ? "text-gray-400" : "text-black"}`}
                            onClick={() => handleChapterClick(chap.title)}
                          >
                            {chap.title}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {visibleChapters < truyen.chapters.length && (
                <div
                  onClick={handleLoadMore}
                  className="border border-t-0 border-gray-300 rounded-b text-center py-2 text-blue-600 hover:underline cursor-pointer text-sm"
                >
                  + Xem thêm
                </div>
              )}

              {loading && clickPos && (
                <div
                  className="fixed z-50 bg-black text-white text-xs px-2 py-1 rounded shadow"
                  style={{ top: clickPos.y + 10, left: clickPos.x + 10 }}
                >
                  <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 010-16z"
                    />
                  </svg>
                  Đang tải chương...
                </div>
              )}
            </div>
          </div>

          <div className="w-[270px] flex-shrink-0 space-y-6 mt-[-39px]">
            <HistoryTab />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center">
    <span className="flex items-center gap-1 w-[130px] font-semibold">
      {icon} {label}
    </span>
    <span>{value}</span>
  </div>
);

interface ActionButtonsProps {
  isFollowed: boolean;
  handleFollowClick: () => void;
  handleUnfollowClick: () => void;
  followerCount: number | null;
  truyenSlug: string;
  truyen: Truyen;
  chapNumber: string;
  lastRead: string | undefined;
  handleChapterClick: (chapter: string) => void;
}

const ActionButtons = ({
  isFollowed,
  handleFollowClick,
  handleUnfollowClick,
  followerCount,
  truyenSlug,
  truyen,
  chapNumber,
  lastRead,
  handleChapterClick,
}: ActionButtonsProps) => (
  <div className="mt-4 space-y-2">
    <div className="flex gap-2">
      {isFollowed ? (
        <Button
          className="bg-gray-400 hover:bg-gray-500 text-white text-sm px-4 py-2 rounded inline-flex items-center gap-2"
          onClick={handleUnfollowClick}
        >
          <X className="w-4 h-4" /> Bỏ theo dõi
        </Button>
      ) : (
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded inline-flex items-center gap-2"
          onClick={handleFollowClick}
        >
          <Heart className="w-4 h-4" /> Theo dõi
        </Button>
      )}
      {typeof followerCount === "number" && followerCount > 0 && (
        <div className="text-lg text-gray-700 flex items-center gap-1">
          <span className="text-lg font-bold text-black">{followerCount}</span> người theo dõi
        </div>
      )}
    </div>

    <div className="flex flex-wrap gap-2">
      <Link
        to={`/truyen-tranh/${truyenSlug}/chuong-1`}
        className="bg-green-500 hover:bg-green-600 hover:text-white text-white text-sm px-4 py-2 rounded"
        onClick={() => handleChapterClick("Chapter 1")}
      >
        Đọc từ đầu
      </Link>

      <Link
        to={`/truyen-tranh/${truyenSlug}/chuong-${truyen.chapters.length}`}
        className="bg-purple-500 hover:bg-purple-600 hover:text-white text-white text-sm px-4 py-2 rounded"
        onClick={() => handleChapterClick(`Chapter ${truyen.chapters.length}`)}
      >
        Đọc mới nhất
      </Link>

      {lastRead && chapNumber && (
        <Link
          to={`/truyen-tranh/${truyenSlug}/chuong-${chapNumber}`}
          className="bg-yellow-500 hover:bg-yellow-600 hover:text-white text-white text-sm px-4 py-2 rounded"
          onClick={() => handleChapterClick(lastRead)}
        >
          Đọc tiếp
        </Link>
      )}
    </div>
  </div>
);
