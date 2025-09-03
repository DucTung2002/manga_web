import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Plus, Edit, Trash, Eye } from "lucide-react";
import { Helmet } from 'react-helmet-async';

interface ChapterData {
  id: string;
  title: string;
  pages: number;
}

const ManagerChapter = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [comicTitle, setComicTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);

  const chaptersPerPage = 30;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const totalPages = Math.ceil(chapters.length / chaptersPerPage);

  useEffect(() => {
    const fetchChapters = async () => {
      if (!slug) {
        setError("Thiếu slug.");
        setLoading(false);
        return;
      }
      try {
        const comicRef = doc(db, "comics", slug);
        const comicSnap = await getDoc(comicRef);
        if (comicSnap.exists()) {
          const data = comicSnap.data();
          setComicTitle(data.title || "Truyện không tên");

          const chaptersData = (data.chapters || []).map((chapter: any, index: number) => ({
            id: index.toString(),
            title: chapter.title || `Chapter ${index + 1}`,
            pages: chapter.local_images ? chapter.local_images.length : 0,
          }));
          chaptersData.sort((a: ChapterData, b: ChapterData) => {
            const numA = parseFloat(a.title.replace("Chapter ", ""));
            const numB = parseFloat(b.title.replace("Chapter ", ""));
            return numA - numB;
          });
          setChapters(chaptersData);
        } else {
          setError("Không tìm thấy truyện");
        }
      } catch (err) {
        setError("Lỗi khi tải danh sách chapters");
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, [slug]);

  const handleAddChapter = () => {
    navigate(`/dashboard/quan-ly-truyen/them-chapter/${slug}`);
  };

  const handleViewChapter = (chapterTitle: string) => {
    const chapterNumber = chapterTitle.replace("Chapter ", "").trim();
    navigate(`/truyen-tranh/${slug}/chuong-${chapterNumber}`);
  };

  const handleEditChapter = (chapterTitle: string) => {
    const chapterNumber = chapterTitle.replace("Chapter ", "").trim();
    navigate(`/dashboard/quan-ly-chapter/chinh-sua-chapter/${slug}/chuong-${chapterNumber}`);
  };

  const openDeleteModal = (chapterTitle: string) => {
    setChapterToDelete(chapterTitle);
    setShowDeleteModal(true);
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete || !slug) {
      setError("Thiếu thông tin để xóa chapter.");
      window.alert("Thiếu thông tin để xóa chapter.");
      setShowDeleteModal(false);
      setChapterToDelete(null);
      return;
    }

    try {
      const comicRef = doc(db, "comics", slug);
      const comicSnap = await getDoc(comicRef);
      if (comicSnap.exists()) {
        const data = comicSnap.data();
        const chapters = data.chapters || [];
        const updatedChapters = chapters.filter(
          (chap: any) => chap.title !== chapterToDelete
        );

        await updateDoc(comicRef, {
          chapters: updatedChapters,
        });

        setChapters(prev =>
          prev.filter(chap => chap.title !== chapterToDelete)
        );
        window.alert(`${chapterToDelete} đã được xóa thành công!`);
      } else {
        throw new Error(`Không tìm thấy truyện với slug: ${slug}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định khi xóa chapter.";
      setError(errorMessage);
      window.alert(errorMessage);
    } finally {
      setShowDeleteModal(false);
      setChapterToDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setSearchParams({ page: page.toString() });
    }
  };

  const startIndex = (currentPage - 1) * chaptersPerPage;
  const endIndex = startIndex + chaptersPerPage;
  const displayedChapters = chapters.slice(startIndex, endIndex);

  const getPageNumbers = (totalPages: number): (number | string)[] => {
    const maxButtons = 5;
    const pages: (number | string)[] = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("...");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <Helmet>
        <title>Quản lý chapter - {comicTitle}</title>
      </Helmet>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black text-center break-words">
            Quản lý chapter - {comicTitle}
          </h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <Button
            className="bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} /> Quay lại
          </Button>
          <Button
            className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
            onClick={handleAddChapter}
          >
            <Plus size={18} /> Thêm chapter mới
          </Button>
        </div>
        <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-white text-center">
              <th className="p-3">Chapter</th>
              <th className="p-3">Số trang</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayedChapters.map((chapter) => (
              <tr key={chapter.id} className="border-b">
                <td className="p-2 text-center text-black">{chapter.title}</td>
                <td className="p-2 text-center text-black">{chapter.pages}</td>
                <td className="p-2 flex gap-2 justify-center">
                  <Button
                    className="bg-purple-500 text-white hover:bg-purple-600 p-1 rounded"
                    onClick={() => handleViewChapter(chapter.title)}
                  >
                    <Eye size={18} />
                  </Button>
                  <Button
                    className="bg-yellow-500 text-white hover:bg-yellow-600 p-1 rounded"
                    onClick={() => handleEditChapter(chapter.title)}
                  >
                    <Edit size={18} />
                  </Button>
                  <Button
                    className="bg-red-500 text-white hover:bg-red-600 p-1 rounded"
                    onClick={() => openDeleteModal(chapter.title)}
                  >
                    <Trash size={18} />
                  </Button>
                </td>
              </tr>
            ))}
            {displayedChapters.length === 0 && (
              <tr>
                <td colSpan={3} className="p-2 text-center">Chưa có chapter nào</td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center items-center gap-2">
            <Button
              className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>
            {getPageNumbers(totalPages).map((page, index) =>
              typeof page === "number" ? (
                <Button
                  key={page}
                  className={`px-3 py-1 ${currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                    } rounded`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ) : (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-black">
                  ...
                </span>
              )
            )}
            <Button
              className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              &gt;
            </Button>
          </div>
        )}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => {
              setShowDeleteModal(false);
              setChapterToDelete(null);
            }}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 text-black">Xác nhận xóa</h2>
              <p className="mb-4 text-black">
                Bạn có chắc chắn muốn xóa {chapterToDelete} không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setChapterToDelete(null);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={handleDeleteChapter}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManagerChapter;
