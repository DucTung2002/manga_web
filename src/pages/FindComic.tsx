import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CategoryTab } from "@/components/layout/CategoryTab";
import { CardComic } from "@/components/ui/CardComic";
import { Button } from "@/components/ui/Button";
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

const categoryOptions = ["Tất cả", "Hoàn thành", "Đang cập nhật"];
const sortOptions = ["Ngày cập nhật", "Theo dõi", "Số chapter", "Top Follow", "Lượt xem"];
const ITEMS_PER_PAGE = 36;

const normalizeString = (str = "") =>
  String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const toSlug = (str = "") => normalizeString(str).replace(/\s+/g, "-");

const findGenreLabelFromSlug = (slug: string, stories: Truyen[]) =>
  slug
    ? stories
      .find(story => story.genres?.some((g: string) => toSlug(g) === slug))
      ?.genres?.find((g: string) => toSlug(g) === slug) ||
    slug
      .split("-")
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ")
    : "";

const getPaginationRange = (current: number, total: number, delta = 2) => {
  const range: (number | string)[] = [1];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);
  return range;
};

const parseDate = (dateStr: string | undefined): number => {
  if (!dateStr) {
    return 0;
  }
  const cleaned = dateStr.replace(/\[Cập nhật lúc: /, "").replace(/\]/, "").trim();
  const [datePart, timePart] = cleaned.split(" ");
  if (!datePart || !timePart) {
    return 0;
  }
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
    return 0;
  }
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1000 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return 0;
  }
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  if (isNaN(date.getTime())) {
    return 0;
  }
  return date.getTime();
};

export const FindComic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category: urlCategory } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const status = queryParams.get("status") || "";
  const sort = queryParams.get("sort") || "";
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [selectedSort, setSelectedSort] = useState<string>("Ngày cập nhật");
  const [stories, setStories] = useState<Truyen[]>([]);
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(parseInt(queryParams.get("page") || "1", 10));
  const keyword = queryParams.get("keyword") || "";

  useEffect(() => {
    setIsLoading(true);
    const comicsCollection = collection(db, "comics");
    const unsubscribe = onSnapshot(
      comicsCollection,
      async (snapshot) => {
        try {
          const comicsData = snapshot.docs
            .map(doc => {
              const data = doc.data() as Truyen;
              if (!data.title || !data.link || !data.cover || !data.status || !data.genres || !data.slug) {
                return null;
              }
              return {
                ...data,
                chapters: (data.chapters || []).map(chap => ({
                  title: chap.title,
                })),
                updated_at: data.updated_at || "",
              } as Truyen;
            })
            .filter((comic): comic is Truyen => comic !== null);

          setStories(comicsData);

          const initialCounts: Record<string, number> = {};
          comicsData.forEach(comic => {
            initialCounts[comic.slug] = 0;
          });
          setFollowerCounts(initialCounts);

          const unsubscribes: (() => void)[] = [];
          await Promise.all(
            comicsData.map(async comic => {
              try {
                const q = query(collection(db, "follows"), where("slug", "==", comic.slug));
                const unsubscribe = onSnapshot(
                  q,
                  (snapshot) => {
                    const newLikes = snapshot.size;
                    setFollowerCounts(prev => ({ ...prev, [comic.slug]: newLikes }));
                  },
                  () => {
                    setFollowerCounts(prev => ({ ...prev, [comic.slug]: 0 }));
                  }
                );
                unsubscribes.push(unsubscribe);
              } catch (err) {
                setFollowerCounts(prev => ({ ...prev, [comic.slug]: 0 }));
              }
            })
          );

          const views = await Promise.all(comicsData.map(async comic => ({ slug: comic.slug, views: await getTotalViews(comic.slug) })));
          setViewCounts(views.reduce((acc, { slug, views }) => ({ ...acc, [slug]: views }), {}));

          setIsLoading(false);

          return () => {
            unsubscribes.forEach(unsub => unsub());
          };
        } catch (error) {
          setStories([]);
          setIsLoading(false);
        }
      },
      () => {
        setStories([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredStories = useMemo(() => {
    const genreSlug = urlCategory || "";
    const statusFilter = status === "1" ? toSlug("Hoàn thành") : status === "2" ? toSlug("Đang cập nhật") : "";
    const keywordNormalized = keyword ? normalizeString(decodeURIComponent(keyword.replace(/\+/g, " "))) : "";

    const searchResultsRaw = localStorage.getItem("searchResults");
    let searchResults: Truyen[] | null = null;
    try {
      searchResults = searchResultsRaw ? JSON.parse(searchResultsRaw) : null;
      if (searchResults && !Array.isArray(searchResults)) {
        searchResults = null;
      }
    } catch (err) {
    }

    let filtered = searchResults && keyword ? searchResults : stories;

    filtered = filtered.filter((story) => {
      const genreMatch = genreSlug ? story.genres.some((g: string) => toSlug(g) === genreSlug) : true;
      const statusMatch = statusFilter
        ? statusFilter === toSlug("Hoàn thành")
          ? ["hoan thanh", "complete", "completed", "full"].some(syn => normalizeString(story.status).includes(normalizeString(syn)))
          : ["dang cap nhat", "dang tien hanh", "tien hanh", "cap nhat", "update", "updating", "ongoing"].some(syn =>
            normalizeString(story.status).includes(normalizeString(syn))
          )
        : true;
      const keywordMatch = keywordNormalized ? normalizeString(story.title).includes(keywordNormalized) : true;
      return genreMatch && statusMatch && keywordMatch;
    });

    return filtered.sort((a, b) => {
      const slugA = a.slug;
      const slugB = b.slug;
      const followersA = followerCounts[slugA] || 0;
      const followersB = followerCounts[slugB] || 0;
      const viewsA = viewCounts[slugA] || 0;
      const viewsB = viewCounts[slugB] || 0;
      switch (selectedSort) {
        case "Ngày cập nhật": {
          const timeA = parseDate(a.updated_at);
          const timeB = parseDate(b.updated_at);
          if (timeA === 0 && timeB === 0) return 0;
          if (timeA === 0) return 1;
          if (timeB === 0) return -1;
          return timeB - timeA;
        }
        case "Theo dõi":
        case "Top Follow":
          return followersB - followersA;
        case "Số chapter":
          return b.chapters.length - a.chapters.length;
        case "Lượt xem":
          return viewsB - viewsA;
        default:
          return 0;
      }
    });
  }, [urlCategory, status, selectedSort, followerCounts, viewCounts, keyword, stories]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredStories.length / ITEMS_PER_PAGE)), [filteredStories]);

  useEffect(() => {
    const slug = urlCategory || "";
    setSelectedCategory(slug ? findGenreLabelFromSlug(slug, stories) : "Tất cả");

    const sortIndex = parseInt(sort) - 1;
    setSelectedSort(sortIndex >= 0 && sortIndex < sortOptions.length ? sortOptions[sortIndex] : "Ngày cập nhật");

    const pageFromUrl = parseInt(queryParams.get("page") || "1", 10);
    if (pageFromUrl > 0 && pageFromUrl <= totalPages) {
      setCurrentPage(pageFromUrl);
    }
  }, [urlCategory, status, sort, keyword, totalPages, stories]);

  const paginatedStories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStories, currentPage]);

  const updatePageInUrl = (newPage: number) => {
    const params: string[] = [];
    if (status) params.push(`status=${status}`);
    if (sort) params.push(`sort=${sort}`);
    if (keyword) params.push(`keyword=${encodeURIComponent(keyword)}`);
    params.push(`page=${newPage}`);

    let targetPath = "";
    if (urlCategory) {
      targetPath = `/tim-truyen/${urlCategory}?${params.join("&")}`;
    } else {
      targetPath = `/tim-truyen?${params.join("&")}`;
    }

    if (location.pathname + location.search !== targetPath) {
      navigate(targetPath);
      window.scrollTo(0, 0);
    }
    setCurrentPage(newPage);
  };

  const handleStatusChange = (option: string) => {
    const currentStatus = status || "";
    const currentSort = sort || "";
    let statusValue = option === "Hoàn thành" ? "1" : option === "Đang cập nhật" ? "2" : "";

    if (
      (option === "Tất cả" && !currentStatus && !urlCategory && currentPage === 1) ||
      (option === "Hoàn thành" && currentStatus === "1" && currentPage === 1) ||
      (option === "Đang cập nhật" && currentStatus === "2" && currentPage === 1)
    ) {
      return;
    }

    let targetPath = "";
    if (option === "Tất cả" && !urlCategory) {
      targetPath = "/tim-truyen";
    } else {
      targetPath = urlCategory
        ? `/tim-truyen/${urlCategory}?status=${statusValue}&sort=${currentSort}${currentPage !== 1 ? "&page=1" : ""}`
        : `/tim-truyen?status=${statusValue}&sort=${currentSort}${currentPage !== 1 ? "&page=1" : ""}`;
    }

    if (location.pathname + location.search !== targetPath) {
      navigate(targetPath);
    }
  };

  const handleSortChange = (option: string) => {
    const sortIndex = sortOptions.indexOf(option) + 1;
    const currentSort = sort || "";

    if (currentSort === String(sortIndex) && currentPage === 1) {
      return;
    }

    const targetPath = urlCategory
      ? `/tim-truyen/${urlCategory}?status=${status}&sort=${sortIndex}${currentPage !== 1 ? "&page=1" : ""}`
      : `/tim-truyen?status=${status}&sort=${sortIndex}${currentPage !== 1 ? "&page=1" : ""}`;

    if (location.pathname + location.search !== targetPath) {
      navigate(targetPath);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white"></div>;
  }

  return (
    <>
      <Helmet>
        <title>Tìm kiếm truyện</title>
      </Helmet>
      <Header />
      <Navbar />
      <main className="max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <h1 className="text-xl font-semibold text-black mb-3 text-center">
            {keyword
              ? `Kết quả tìm kiếm: ${decodeURIComponent(keyword.replace(/\+/g, " "))}`
              : selectedCategory === "Tất cả"
                ? "Tất Cả Thể Loại Truyện Tranh"
                : `Tổng Hợp Truyện Tranh ${selectedCategory}`}
          </h1>
          <div className="flex justify-center gap-2 mb-5">
            {categoryOptions.map(option => {
              const isActive =
                (option === "Tất cả" && !status) ||
                (option === "Hoàn thành" && status === "1") ||
                (option === "Đang cập nhật" && status === "2") ||
                (option !== "Tất cả" && option !== "Hoàn thành" && option !== "Đang cập nhật" && toSlug(option) === urlCategory);
              return (
                <Button
                  key={option}
                  onClick={() => handleStatusChange(option)}
                  className={`px-3 py-1 border-gray-300 rounded outline-none focus:outline-none ${isActive ? "bg-blue-500 text-white" : "bg-white text-black"}`}
                >
                  {option}
                </Button>
              );
            })}
          </div>
          <div className="mb-5 text-sm text-black">
            <div className="flex items-center w-full gap-2">
              <span className="whitespace-nowrap mr-2">Sắp xếp theo:</span>
              <div className="flex justify-center flex-1 gap-2">
                {sortOptions.map((option, index) => (
                  <Button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={`px-4 py-1 border rounded border-gray-300 outline-none focus:outline-none min-w-[130px] text-center ${sort === String(index + 1) || (!sort && option === "Ngày cập nhật") ? "bg-orange-600 text-white" : "bg-white hover:bg-gray-100"
                      }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedStories.length === 0 ? (
              <p className="text-center text-gray-500 col-span-full" role="alert">
                {keyword ? `Không tìm thấy truyện nào cho từ khóa "${decodeURIComponent(keyword.replace(/\+/g, " "))}"` : "Không có truyện nào để hiển thị."}
              </p>
            ) : (
              paginatedStories.map((story, index) => {
                const followerCount = followerCounts[story.slug] || 0;
                const viewCount = viewCounts[story.slug] || 0;
                const processedChapters = story.chapters.slice(0, 3).map(chap => ({
                  title: chap.title,
                }));
                return (
                  <CardComic
                    key={index}
                    title={story.title}
                    cover={story.cover}
                    chapters={processedChapters}
                    slug={story.slug}
                    updated_at={story.updated_at}
                    likes={followerCount}
                    totalViews={viewCount}
                  />
                );
              })
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              <Button
                onClick={() => updatePageInUrl(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className={`px-[13px] py-[5px] text-base border border-gray-300 rounded ${currentPage === 1 ? "cursor-not-allowed text-gray-400 bg-gray-100" : "hover:bg-gray-200 text-black bg-white"
                  }`}
              >
                &lt;
              </Button>
              {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                page === "..." ? (
                  <span
                    key={idx}
                    className="cursor-not-allowed px-[11px] py-[5px] text-base border border-gray-300 rounded text-gray-400 bg-white select-none"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={idx}
                    onClick={() => updatePageInUrl(page as number)}
                    className={`px-[13px] py-[5px] text-base border border-gray-300 rounded ${currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-200 text-black bg-white"
                      }`}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                onClick={() => updatePageInUrl(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-[13px] py-[5px] text-base border border-gray-300 rounded ${currentPage === totalPages ? "cursor-not-allowed text-gray-400 bg-gray-100" : "hover:bg-gray-200 text-black bg-white"
                  }`}
              >
                &gt;
              </Button>
            </div>
          )}
        </div>
        <div className="hidden md:block">
          <CategoryTab />
        </div>
      </main>
      <Footer />
    </>
  );
};
