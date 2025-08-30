import { useState, useEffect } from "react";
import { CardComic } from "@/components/ui/CardComic";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HistoryTab } from "@/components/layout/HistoryTab";
import { collection, query, getDocs, limit, orderBy, startAfter, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useHistory } from "@/hooks/useHistory";
import { getTotalViews } from "@/hooks/useTotalViews";
import { useSearchParams } from "react-router-dom";
import type { Truyen } from "@/types/types";

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

export const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(page) || page < 1 ? 1 : page;
  });
  const [truyenList, setTruyenList] = useState<(Truyen & { likes: number; totalViews: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const { accountHistory, deviceHistory, isLoading: isHistoryLoading } = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const totalQuery = query(collection(db, "comics"));
        const totalSnapshot = await getDocs(totalQuery);
        setTotalPages(Math.ceil(totalSnapshot.size / ITEMS_PER_PAGE));

        let q = query(
          collection(db, "comics"),
          orderBy("updated_at", "desc"),
          limit(ITEMS_PER_PAGE)
        );
        if (currentPage > 1 && lastDoc) {
          q = query(
            collection(db, "comics"),
            orderBy("updated_at", "desc"),
            startAfter(lastDoc),
            limit(ITEMS_PER_PAGE)
          );
        }

        const querySnapshot = await getDocs(q);
        const currentItems = querySnapshot.docs.map(doc => doc.data() as Truyen);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);

        const result = await Promise.all(
          currentItems.map(async (truyen) => {
            const slug = truyen.slug || truyen.link.split("/").pop() || "";
            let likes = 0;
            try {
              const q = query(collection(db, "follows"), where("slug", "==", slug));
              const snapshot = await getDocs(q);
              likes = snapshot.size;
            } catch (err) {
            }

            const views = await getTotalViews(slug);
            const processedChapters = truyen.chapters.slice(0, 3).map(chap => ({
              title: chap.title,
            }));

            return {
              ...truyen,
              chapters: processedChapters,
              likes,
              totalViews: views,
            };
          })
        );

        await preloadImages(result);

        setTruyenList(result);
      } catch (error) {
        setTruyenList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  useEffect(() => {
    if (isHistoryLoading) return;

    const preloadHistoryImages = async () => {
      const historyItems = [...accountHistory, ...deviceHistory].map((item) => ({
        cover: truyenList.find((t) => t.slug === item.slug)?.cover || item.cover || "",
      }));
      await preloadImages(historyItems.filter((item) => item.cover));
    };

    preloadHistoryImages();
  }, [accountHistory, deviceHistory, isHistoryLoading, truyenList]);

  const preloadImages = async (items: (Truyen | { cover: string })[]) => {
    const imagePromises = items.map((item) => {
      return new Promise<void>((resolve) => {
        if (!item.cover) {
          resolve();
          return;
        }
        const img = new Image();
        img.src = item.cover;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(imagePromises);
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "followerCounts" && e.newValue) {
        const cachedData = JSON.parse(e.newValue);
        const updatedList = truyenList.map((truyen) => {
          const slug = truyen.slug || truyen.link.split("/").pop() || "";
          const processedChapters = truyen.chapters.slice(0, 3).map(chap => ({
            title: chap.title,
          }));
          return {
            ...truyen,
            chapters: processedChapters,
            likes: cachedData.counts[slug] || truyen.likes || 0,
            totalViews: truyen.totalViews || 0,
          };
        });
        setTruyenList(updatedList);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [truyenList]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams({ page: page.toString() });
    setIsLoading(true);
  };

  if (isLoading || isHistoryLoading) {
    return <div className="bg-white min-h-screen w-full"></div>;
  }

  return (
    <>
      <Header />
      <Navbar />

      <section className="w-full bg-gray-100 px-4 py-6">
        <div className="max-w-screen-xl mx-auto flex gap-6">
          <div className="flex-1">
            {truyenList.length === 0 ? (
              <p className="text-center text-gray-500">Không có truyện nào để hiển thị.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {truyenList.map((truyen, index) => (
                  <CardComic
                    key={index}
                    title={truyen.title}
                    cover={truyen.cover}
                    chapters={truyen.chapters}
                    likes={truyen.likes}
                    totalViews={truyen.totalViews}
                    slug={truyen.slug || truyen.link.split("/").pop()}
                    updated_at={truyen.updated_at}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-center mt-8">
              <div className="flex flex-wrap gap-1 p-2">
                <Button
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-[13px] py-[5px] text-base border border-gray-300 rounded outline-none focus:outline-none ${currentPage === 1
                    ? "cursor-not-allowed text-gray-400 bg-gray-100"
                    : "hover:bg-gray-200 text-black bg-white"
                    }`}
                >
                  &lt;
                </Button>

                {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                  typeof page === "number" ? (
                    <Button
                      key={idx}
                      onClick={() => handlePageChange(page)}
                      className={`px-[13px] py-[5px] text-base border border-gray-300 rounded outline-none focus:outline-none ${currentPage === page
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-200 text-black bg-white"
                        }`}
                    >
                      {page}
                    </Button>
                  ) : (
                    <span
                      key={idx}
                      className="cursor-not-allowed px-[11px] py-[5px] text-base border border-gray-300 rounded text-gray-400 bg-white select-none outline-none focus:outline-none"
                    >
                      ...
                    </span>
                  )
                )}

                <Button
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-[13px] py-[5px] text-base border border-gray-300 rounded outline-none focus:outline-none ${currentPage === totalPages
                    ? "cursor-not-allowed text-gray-400 bg-gray-100"
                    : "hover:bg-gray-200 text-black bg-white"
                    }`}
                >
                  &gt;
                </Button>
              </div>
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
