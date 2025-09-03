import { useState, useEffect, Component } from "react";
import { useNavigate } from "react-router-dom";
import { useHistory } from "@/hooks/useHistory";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface HistoryItem {
  slug: string;
  title: string;
  cover: string;
  chapter: string;
  chaptersRead: string[];
  readAt: string;
}

interface TruyenData {
  slug: string;
  title: string;
  cover: string;
  exists: boolean;
}

class HistoryTabErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex justify-center mt-10">
          <div className="w-[350px] border p-3 bg-white text-sm shadow">
            <p className="text-red-600">Đã xảy ra lỗi khi tải lịch sử đọc.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const HistoryTab = () => {
  const navigate = useNavigate();
  const { deviceHistory, accountHistory, isLoggedIn, remove } = useHistory();
  const [truyenData, setTruyenData] = useState<Record<string, TruyenData>>({});
  const history = isLoggedIn ? accountHistory : deviceHistory;

  useEffect(() => {
    const fetchTruyenData = async () => {
      const newTruyenData: Record<string, TruyenData> = {};
      const recentHistory = [...history].reverse().slice(0, 3);
      for (const item of recentHistory) {
        if (!newTruyenData[item.slug]) {
          const docRef = doc(db, "comics", item.slug);
          const docSnap = await getDoc(docRef);
          newTruyenData[item.slug] = {
            slug: item.slug,
            title: docSnap.exists() ? docSnap.data().title : item.title,
            cover: docSnap.exists() ? docSnap.data().cover : item.cover,
            exists: docSnap.exists(),
          };
        }
      }
      setTruyenData(newTruyenData);
    };

    if (Array.isArray(history) && history.length > 0) {
      fetchTruyenData();
    }
  }, [history, isLoggedIn]);

  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  const recentHistory = [...history].reverse().slice(0, 3);

  return (
    <HistoryTabErrorBoundary>
      <div className="flex justify-center mt-10">
        <div className="w-[350px] border p-3 bg-white text-sm shadow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-blue-600 font-medium">Lịch sử đọc tại NetTruyen</span>
            <span
              className="text-gray-600 italic text-xs hover:underline cursor-pointer hover:text-blue-600"
              onClick={() => navigate("/lich-su-truyen-tranh")}
            >
              Xem tất cả
            </span>
          </div>

          <ul className="space-y-3">
            {recentHistory.map((item) => {
              const truyen = truyenData[item.slug] || {
                slug: item.slug,
                title: item.title,
                cover: item.cover,
                exists: false,
              };

              return (
                <li
                  key={`${item.slug}-${item.chapter}`}
                  className="w-[245px] flex gap-2 border-t pt-3 first:pt-0 first:border-t-0"
                >
                  <img
                    src={truyen.cover}
                    alt={truyen.title}
                    title={truyen.title}
                    className={`w-[60px] h-[60px] object-cover flex-shrink-0 ${truyen.exists ? "cursor-pointer" : "opacity-50"}`}
                    onClick={() => truyen.exists && navigate(`/truyen-tranh/${truyen.slug}`)}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      onClick={() => truyen.exists && navigate(`/truyen-tranh/${truyen.slug}`)}
                      className={`font-semibold text-black truncate ${truyen.exists ? "hover:text-blue-600 cursor-pointer" : "text-gray-400"}`}
                      title={truyen.title}
                    >
                      {truyen.title}
                    </span>
                    <div className="flex justify-between items-center mt-auto min-w-0">
                      <span
                        onClick={() =>
                          truyen.exists &&
                          navigate(`/truyen-tranh/${truyen.slug}/chuong-${getChapterNumber(item.chapter)}`)
                        }
                        className={`text-[10px] truncate ${truyen.exists ? "text-gray-500 hover:text-blue-600 cursor-pointer" : "text-gray-400"}`}
                      >
                        Đọc tiếp {item.chapter}&gt;
                      </span>
                      <button
                        onClick={() => remove(item.slug, isLoggedIn ? "account" : "device")}
                        className="text-xs text-black hover:text-blue-600 bg-transparent border-none outline-none focus:outline-none ml-2 flex-shrink-0"
                      >
                        ✖ <span className="italic ml-1">Xóa</span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </HistoryTabErrorBoundary>
  );
};

const getChapterNumber = (title: string) => {
  const match = title.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]).toString() : "";
};
