import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HistoryTab } from "@/components/layout/HistoryTab";
import { useFollow } from "@/hooks/useFollow";
import { useHistory } from "@/hooks/useHistory";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import { CardComic } from "@/components/ui/CardComic";
import { getTotalViews } from "@/hooks/useTotalViews";
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
  description: string;
  chapters: Chapter[];
  other_name?: string;
  updated_at: string;
  slug: string;
}

const ITEMS_PER_PAGE = 36;

export const FollowComic = () => {
  const { follows, isLoggedIn, unfollow, isLoading } = useFollow();
  const { accountHistory } = useHistory();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(page) || page < 1 ? 1 : page;
  });
  const [truyenList, setTruyenList] = useState<(Truyen & { likes: number; totalViews: number })[]>([]);
  const [isDataReady, setIsDataReady] = useState(false);

  const totalPages = Math.ceil(follows.length / ITEMS_PER_PAGE);
  const currentComics = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return follows.slice(startIndex, endIndex);
  }, [follows, currentPage]);

  useEffect(() => {
    if (!isLoggedIn || follows.length === 0) {
      setTruyenList([]);
      setIsDataReady(true);
      return;
    }

    const slugsToFetch = currentComics
      .map((comic) => comic.slug)
      .filter((slug) => !truyenList.some((t) => t.slug === slug));

    if (slugsToFetch.length === 0 && currentComics.length > 0) {
      setIsDataReady(true);
      return;
    }

    setIsDataReady(false);
    const unsubscribes: (() => void)[] = [];
    let processedCount = 0;
    const totalToProcess = slugsToFetch.length;
    const tempTruyenList: (Truyen & { likes: number; totalViews: number })[] = [...truyenList];

    const fetchComics = async () => {
      try {
        slugsToFetch.forEach((slug) => {
          const comicRef = doc(db, "comics", slug);

          const unsubscribeComic = onSnapshot(
            comicRef,
            async (comicSnap) => {
              if (!comicSnap.exists()) {
                tempTruyenList.filter((t) => t.slug !== slug);
                processedCount += 1;
                if (processedCount === totalToProcess) {
                  setTruyenList(tempTruyenList);
                  setIsDataReady(true);
                }
                return;
              }

              const truyen = comicSnap.data() as Truyen;
              if (!truyen.title || !truyen.link || !truyen.cover || !truyen.status || !truyen.genres || !truyen.slug || !truyen.updated_at) {
                tempTruyenList.filter((t) => t.slug !== slug);
                processedCount += 1;
                if (processedCount === totalToProcess) {
                  setTruyenList(tempTruyenList);
                  setIsDataReady(true);
                }
                return;
              }

              let likes = 0;
              try {
                const q = query(collection(db, "follows"), where("slug", "==", slug));
                const unsubscribeFollows = onSnapshot(
                  q,
                  (snapshot) => {
                    likes = snapshot.size;
                    const existsIndex = tempTruyenList.findIndex((t) => t.slug === slug);
                    if (existsIndex >= 0) {
                      tempTruyenList[existsIndex] = { ...tempTruyenList[existsIndex], likes };
                    }
                  },
                  () => {
                    const existsIndex = tempTruyenList.findIndex((t) => t.slug === slug);
                    if (existsIndex >= 0) {
                      tempTruyenList[existsIndex] = { ...tempTruyenList[existsIndex], likes: 0 };
                    }
                  }
                );
                unsubscribes.push(unsubscribeFollows);
              } catch (err) {
              }

              const views = await getTotalViews(slug);

              const existsIndex = tempTruyenList.findIndex((t) => t.slug === slug);
              if (existsIndex >= 0) {
                tempTruyenList[existsIndex] = { ...truyen, likes, totalViews: views };
              } else {
                tempTruyenList.push({ ...truyen, likes, totalViews: views });
              }

              processedCount += 1;
              if (processedCount === totalToProcess) {
                setTruyenList(tempTruyenList);
                setIsDataReady(true);
              }
            },
            () => {
              tempTruyenList.filter((t) => t.slug !== slug);
              processedCount += 1;
              if (processedCount === totalToProcess) {
                setTruyenList(tempTruyenList);
                setIsDataReady(true);
              }
            }
          );

          unsubscribes.push(unsubscribeComic);
        });
      } catch (error) {
        setTruyenList([]);
        setIsDataReady(true);
      }
    };

    fetchComics();

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [currentComics, isLoggedIn]);

  const isChapterRead = (slug: string, chapterTitle: string) => {
    const historyItem = accountHistory.find((h) => h.slug === slug);
    return historyItem?.chaptersRead.includes(chapterTitle) || false;
  };

  const processedTruyenList = useMemo(() => {
    const currentSlugs = currentComics.map((comic) => comic.slug);
    return truyenList
      .filter((truyen) => currentSlugs.includes(truyen.slug))
      .map((truyen) => ({
        ...truyen,
        chapters: truyen.chapters.slice(0, 3).map((chap) => ({
          title: isChapterRead(truyen.slug, chap.title) ? `${chap.title} (Đã đọc)` : chap.title,
        })),
      }));
  }, [truyenList, accountHistory, currentComics]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      const newStartIndex = (page - 1) * ITEMS_PER_PAGE;
      const newEndIndex = newStartIndex + ITEMS_PER_PAGE;
      const newComics = follows.slice(newStartIndex, newEndIndex);
      const newSlugs = newComics.map((comic) => comic.slug);
      const allSlugsInTruyenList = newSlugs.every((slug) => truyenList.some((t) => t.slug === slug));

      setCurrentPage(page);
      setSearchParams({ page: page.toString() });
      if (!allSlugsInTruyenList) {
        setIsDataReady(false);
      }
    }
  };

  if (!isDataReady || isLoading) {
    return <div className="bg-white min-h-screen w-full"></div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Truyện đang theo dõi</title>
      </Helmet>
      <Header />
      <Navbar />
      <div className="flex-1 w-full bg-gray-100 px-4 py-6">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white p-6 rounded shadow border">
            {!isLoggedIn ? (
              <>
                <h1 className="text-2xl font-bold mb-2 text-black text-center">
                  Bạn chưa theo dõi truyện nào cả
                </h1>
                <p className="text-gray-600 mb-4 text-center">
                  Để theo dõi truyện, nhấn vào <span className="text-red-500 font-semibold">Theo dõi</span> như hình bên dưới
                </p>
                <div className="flex justify-center mb-4">
                  <img src="/theo-doi.jpg" alt="Hướng dẫn nhấn nút Theo dõi" className="w-[600px] h-auto max-w-full" />
                </div>
                <div className="flex justify-center items-center text-gray-700 text-sm">
                  <p className="text-base">
                    Bạn nên <a href="/dang-nhap" className="text-blue-600 hover:underline">Đăng nhập</a> để truy cập truyện đã theo dõi của bạn ở bất cứ đâu
                  </p>
                </div>
              </>
            ) : follows.length === 0 ? (
              <>
                <h1 className="text-2xl font-bold mb-2 text-black text-center">
                  Không có truyện theo dõi
                </h1>
                <p className="text-base mt-4 text-center text-black">
                  Mọi vấn đề liên quan đến tài khoản & lịch sử vui lòng <Link to="/lien-he" className="text-blue-600 hover:underline font-medium">liên hệ</Link> chúng tôi
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-6 text-black text-center">
                  Truyện đang theo dõi ({processedTruyenList.length})
                </h1>
                <div className="flex flex-wrap gap-11">
                  {processedTruyenList.map((truyen) => (
                    <div key={truyen.link} className="relative">
                      <CardComic
                        title={truyen.title}
                        cover={truyen.cover}
                        chapters={truyen.chapters}
                        totalViews={truyen.totalViews}
                        likes={truyen.likes}
                        slug={truyen.slug}
                        updated_at={truyen.updated_at}
                        useTooltipOnly={true}
                      />
                      <Button
                        className="absolute top-2 right-2 bg-gray-400 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                        onClick={() => {
                          unfollow(truyen.slug);
                          setTruyenList((prev) => prev.filter((t) => t.slug !== truyen.slug));
                        }}
                      >
                        <X className="w-3 h-3" /> Bỏ theo dõi
                      </Button>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <Button
                      className="bg-gray-200 hover:bg-gray-300 text-black text-sm px-4 py-2 rounded disabled:opacity-50 border-none outline-none focus:outline-none"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </Button>

                    {(() => {
                      const pages: (number | string)[] = [];
                      const maxVisible = 5;

                      if (totalPages <= maxVisible) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                      } else {
                        const left = Math.max(2, currentPage - 1);
                        const right = Math.min(totalPages - 1, currentPage + 1);

                        pages.push(1);
                        if (left > 2) pages.push("...");

                        for (let i = left; i <= right; i++) {
                          pages.push(i);
                        }

                        if (right < totalPages - 1) pages.push("...");
                        pages.push(totalPages);
                      }

                      return pages.map((page, idx) =>
                        page === "..." ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            className={`text-sm px-3 py-1 rounded border-none outline-none focus:outline-none ${currentPage === page
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 hover:bg-gray-300 text-black"
                              }`}
                            onClick={() => handlePageChange(page as number)}
                          >
                            {page}
                          </Button>
                        )
                      );
                    })()}

                    <Button
                      className="bg-gray-200 hover:bg-gray-300 text-black text-sm px-4 py-2 rounded disabled:opacity-50 border-none outline-none focus:outline-none"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="w-[270px] flex-shrink-0 space-y-6 mt-[-39px]">
            <HistoryTab />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
