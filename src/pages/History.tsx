import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHistory } from "@/hooks/useHistory";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const ITEMS_PER_PAGE = 36;

function getPaginationRange(current: number, total: number): (number | string)[] {
  const delta = 2;
  const range: (number | string)[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push("...");

  for (let i = left; i <= right; i++) {
    range.push(i);
  }

  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);

  return range;
}

export const History = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    deviceHistory,
    accountHistory,
    remove,
    isLoggedIn,
    isLoading,
  } = useHistory();

  const [activeTab, setActiveTab] = useState<"device" | "account">("device");
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(page) || page < 1 ? 1 : page;
  });
  const deviceTabRef = useRef<HTMLButtonElement>(null);
  const accountTabRef = useRef<HTMLButtonElement>(null);

  const [slugCache, setSlugCache] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const getOriginalSlug = async (title: string): Promise<string> => {
    const cacheKey = title.toLowerCase();
    if (slugCache[cacheKey]) {
      return slugCache[cacheKey];
    }

    try {
      const q = query(
        collection(db, "comics"),
        where("title", "==", title)
      );
      const querySnapshot = await getDocs(q);
      let slug = "";
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        slug = data.slug || "";
      });

      setSlugCache((prev) => ({ ...prev, [cacheKey]: slug }));
      return slug;
    } catch (error) {
      return "";
    }
  };

  const currentHistory = activeTab === "device" ? deviceHistory : accountHistory;
  const sortedHistory = [...currentHistory].reverse();
  const totalPages = Math.ceil(sortedHistory.length / ITEMS_PER_PAGE);
  const currentItems = sortedHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getChapterNumber = (title: string) => {
    const match = title.match(/[\d.]+/);
    return match ? match[0] : "";
  };

  const handleRemove = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    try {
      await remove(slug, activeTab);

      const raw = sessionStorage.getItem("sessionReadChapters");
      const sessionReadChapters = raw ? JSON.parse(raw) : {};
      if (sessionReadChapters[slug]) {
        delete sessionReadChapters[slug];
        sessionStorage.setItem("sessionReadChapters", JSON.stringify(sessionReadChapters));
      }

      const newLength = currentHistory.length - 1;
      const newTotalPages = Math.ceil(newLength / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages) {
        setCurrentPage(Math.max(1, newTotalPages));
        if (newTotalPages >= 1) {
          setSearchParams({ page: Math.max(1, newTotalPages).toString() });
        } else {
          setSearchParams({});
        }
      }
    } catch (error) { }
  };

  const handleImageClick = async (title: string) => {
    const slug = await getOriginalSlug(title);
    navigate(`/truyen-tranh/${slug}`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSearchParams({ page: page.toString() });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Navbar />

      <section className="flex-1 w-full bg-gray-100 px-4 py-6">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white p-4 rounded shadow border text-black">
            <h1 className="text-3xl text-center font-semibold mb-4">
              Lịch sử đọc truyện
            </h1>

            <div className="flex justify-center border-b mb-4 gap-2">
              <div className="flex flex-col items-center">
                <button
                  ref={deviceTabRef}
                  onClick={() => setActiveTab("device")}
                  className={`bg-white px-4 py-2 text-lg border-none outline-none focus:outline-none focus-visible:outline-none transition-colors ${activeTab === "device"
                    ? "text-blue-600 font-bold"
                    : "text-gray-600"
                    } hover:text-purple-600`}
                  aria-selected={activeTab === "device"}
                >
                  Từ thiết bị
                </button>
                {activeTab === "device" && (
                  <div className="h-1 w-full bg-yellow-400 rounded-t" />
                )}
              </div>

              <div className="flex flex-col items-center">
                <button
                  ref={accountTabRef}
                  onClick={() => setActiveTab("account")}
                  className={`bg-white px-4 py-2 text-lg border-none outline-none focus:outline-none focus-visible:outline-none transition-colors ${activeTab === "account"
                    ? "text-blue-600 font-bold"
                    : "text-gray-600"
                    } hover:text-purple-600`}
                  aria-selected={activeTab === "account"}
                >
                  Theo tài khoản
                </button>
                {activeTab === "account" && (
                  <div className="h-1 w-full bg-yellow-400 rounded-t" />
                )}
              </div>
            </div>

            {activeTab === "account" && !isLoggedIn ? (
              <div className="text-center text-gray-500">
                Vui lòng{" "}
                <a
                  href="/dang-nhap"
                  className="text-blue-600 hover:underline focus:outline-none focus-visible:outline-none"
                >
                  Đăng nhập
                </a>{" "}
                để xem lịch sử đọc theo tài khoản.
              </div>
            ) : activeTab === "account" && isLoading ? (
              <div className="text-center text-gray-500">
                Đang tải lịch sử tài khoản...
              </div>
            ) : currentItems.length === 0 ? (
              <p className="text-center text-gray-500">
                Bạn chưa đọc truyện nào.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentItems.map((item) => (
                    <div
                      key={`${activeTab}-${item.slug}`}
                      className="border rounded flex flex-col w-[200px] h-[340px]"
                    >
                      <div className="relative w-full h-[240px]">
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => handleImageClick(item.title)}
                          title={item.title}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-0 flex justify-center">
                          <button
                            onClick={(e) => handleRemove(e, item.slug)}
                            className="hover:text-yellow-400 transition-colors bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none"
                            aria-label={`Xóa ${item.title} khỏi lịch sử`}
                          >
                            ✖ Xóa
                          </button>
                        </div>
                      </div>

                      <div className="p-2 flex flex-col flex-1">
                        <p
                          onClick={async () => {
                            const slug = await getOriginalSlug(item.title);
                            navigate(`/truyen-tranh/${slug}`);
                          }}
                          className="font-semibold text-sm hover:text-blue-600 cursor-pointer break-words line-clamp-2"
                          title={item.title}
                        >
                          {item.title}
                        </p>

                        <p
                          className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer mt-auto"
                          onClick={async () => {
                            const slug = await getOriginalSlug(item.title);
                            navigate(
                              `/truyen-tranh/${slug}/chuong-${getChapterNumber(item.chapter)}`
                            );
                          }}
                        >
                          Đọc tiếp {item.chapter}&gt;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded border-none outline-none focus:outline-none focus-visible:outline-none ${currentPage === 1
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        aria-label="Trang trước"
                      >
                        &lt;
                      </Button>

                      {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                        typeof page === "number" ? (
                          <Button
                            key={idx}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded border-none outline-none focus:outline-none focus-visible:outline-none ${currentPage === page
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 hover:bg-gray-300"
                              }`}
                            aria-label={`Trang ${page}`}
                          >
                            {page}
                          </Button>
                        ) : (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded bg-gray-200 text-gray-500 cursor-not-allowed"
                          >
                            ...
                          </span>
                        )
                      )}

                      <Button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded border-none outline-none focus:outline-none focus-visible:outline-none ${currentPage === totalPages
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300"
                          }`}
                        aria-label="Trang sau"
                      >
                        &gt;
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
