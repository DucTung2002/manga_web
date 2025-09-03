import { useEffect, useState, type ChangeEvent, Component, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save, Upload, Trash } from "lucide-react";
import { Helmet } from 'react-helmet-async';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-4xl mx-auto text-center text-red-500">
          Đã xảy ra lỗi trong giao diện. Vui lòng thử lại.
        </div>
      );
    }
    return this.props.children;
  }
}

interface ChapterData {
  title: string;
  local_images: string[];
}

const EditChapter = () => {
  const { slug, chapterId } = useParams<{ slug: string; chapterId: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [comicTitle, setComicTitle] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  const formatUpdatedAt = (date: Date) => {
    const offset = 7 * 60 * 60 * 1000;
    const localDate = new Date(date.getTime() + offset);
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(localDate.getUTCDate()).padStart(2, "0");
    const hours = String(localDate.getUTCHours()).padStart(2, "0");
    const minutes = String(localDate.getUTCMinutes()).padStart(2, "0");
    const seconds = String(localDate.getUTCSeconds()).padStart(2, "0");
    return `[Cập nhật lúc: ${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
  };

  const generatePublicId = (fileName: string, chapterId: string) => {
    if (!slug) return "";
    const cleanFileName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    return `comics/${slug}/chapter-${chapterId}/${cleanFileName}`;
  };

  useEffect(() => {
    const fetchChapter = async () => {
      if (!slug || !chapterId) {
        setError("Thiếu slug hoặc chapterId.");
        setIsFetching(false);
        return;
      }
      try {
        const comicRef = doc(db, "comics", slug);
        const comicSnap = await getDoc(comicRef);
        if (comicSnap.exists()) {
          const data = comicSnap.data();
          setComicTitle(data.title || "Truyện không tên");
          const chapters = data.chapters || [];
          const cleanChapterId = chapterId.replace("chuong-", "");
          const chapterData = chapters.find((chap: any) =>
            chap.title.match(/[\d.]+/)?.[0] === cleanChapterId
          );
          if (chapterData) {
            setChapter(chapterData);
            setImages(chapterData.local_images || []);
          } else {
            setError(`Không tìm thấy chapter với chapterId: ${chapterId}`);
          }
        } else {
          setError(`Không tìm thấy truyện với slug: ${slug}`);
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu chapter. Vui lòng kiểm tra console.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchChapter();
  }, [slug, chapterId]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (!file.type.startsWith("image/")) {
          setError("Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, GIF, WebP)");
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError("File ảnh quá lớn. Vui lòng chọn file dưới 10MB.");
          return false;
        }
        return true;
      });

      setNewImages(prev => [...prev, ...validFiles]);
      setPreviewImages(prev => [
        ...prev,
        ...validFiles.map(file => URL.createObjectURL(file))
      ]);
    }
  };

  const handleRemoveImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewImages(prev => prev.filter((_, i) => i !== index));
      setPreviewImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!slug || !chapterId || !chapter) {
      const errorMessage = "Thiếu slug, chapterId hoặc dữ liệu chapter.";
      setError(errorMessage);
      window.alert(errorMessage);
      return;
    }

    try {
      setError(null);
      let updatedImages = [...images];

      if (newImages.length > 0) {
        for (const file of newImages) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          uploadFormData.append("upload_preset", "comic-upload");
          const publicId = generatePublicId(file.name, chapterId);
          if (!publicId) throw new Error("Không thể tạo public_id cho ảnh.");
          uploadFormData.append("public_id", publicId);

          const response = await axios.post(
            "https://api.cloudinary.com/v1_1/dfixwzsbz/image/upload",
            uploadFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 30000,
            }
          );

          if (response.data.secure_url) {
            updatedImages.push(response.data.secure_url);
          } else {
            throw new Error(`Không nhận được secure_url cho ảnh: ${file.name}`);
          }
        }
      }

      const comicRef = doc(db, "comics", slug);
      const comicSnap = await getDoc(comicRef);
      if (comicSnap.exists()) {
        const data = comicSnap.data();
        const chapters = data.chapters || [];
        const updatedChapters = chapters.map((chap: any) =>
          chap.title.match(/[\d.]+/)?.[0] === chapterId
            ? { ...chap, local_images: updatedImages }
            : chap
        );

        await updateDoc(comicRef, {
          chapters: updatedChapters,
          updated_at: formatUpdatedAt(new Date()),
        });

        window.alert("Cập nhật chapter thành công!");
        if (slug) {
          navigate(`/dashboard/quan-ly-chapter/${slug}`);
        } else {
          throw new Error("Slug không hợp lệ để chuyển hướng.");
        }
      } else {
        throw new Error(`Không tìm thấy truyện với slug: ${slug}`);
      }
    } catch (err) {
      let errorMessage = "Lỗi không xác định khi cập nhật chapter.";
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage = `Lỗi khi tải ảnh lên Cloudinary: ${err.response.data.error?.message || "Không rõ nguyên nhân"}`;
        } else if (err.code === "ERR_NETWORK") {
          errorMessage = "Lỗi mạng hoặc CORS. Vui lòng kiểm tra cấu hình CORS trên Cloudinary.";
        } else {
          errorMessage = "Lỗi không xác định khi tải ảnh lên Cloudinary.";
        }
      } else if (err instanceof Error) {
        errorMessage = `Lỗi: ${err.message}`;
      }
      setError(errorMessage);
      window.alert(errorMessage);
    }
  };

  useEffect(() => {
    return () => {
      previewImages.forEach(url => {
        if (url.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(url);
          } catch (err) {
          }
        }
      });
    };
  }, [previewImages]);

  if (isFetching || !chapter) {
    return <div></div>;
  }

  return (
    <>
      <Helmet>
        <title>Chỉnh sửa chapter - {comicTitle} - {chapter?.title}</title>
      </Helmet>
      <ErrorBoundary>
      <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded text-center">
            {error}
            <Button
              className="mt-2 bg-gray-500 text-white hover:bg-gray-600"
              onClick={() => setError(null)}
            >
              Xóa thông báo
            </Button>
          </div>
        )}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black text-center break-words">
            Chỉnh sửa chapter - {comicTitle} - {chapter?.title || "Đang tải..."}
          </h1>
        </div>
        <div className="flex justify-between items-center mb-6">
          <Button
            className="bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2"
            onClick={() => navigate(`/dashboard/quan-ly-chapter/${slug || ""}`)}
            disabled={false}
          >
            <ArrowLeft size={18} /> Quay lại
          </Button>
          <Button
            type="submit"
            className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
            disabled={false}
          >
            <Save size={18} /> Lưu thay đổi
          </Button>
        </div>
        <div className="mb-4">
          <label className="block text-black font-medium">Thêm ảnh mới</label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={false}
            >
              <Upload size={18} /> Chọn ảnh
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
              disabled={false}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
          {images.map((url, index) => (
            <div key={`existing-${index}`} className="relative">
              <img
                src={url}
                alt={`Page ${index + 1}`}
                className="w-full max-w-[600px] h-auto object-contain rounded cursor-pointer mx-auto"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/150";
                }}
                onClick={() => handleImageClick(url)}
              />
              <Button
                className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 p-1 rounded"
                onClick={() => handleRemoveImage(index, true)}
                disabled={false}
              >
                <Trash size={18} />
              </Button>
            </div>
          ))}
          {previewImages.map((url, index) => (
            <div key={`new-${index}`} className="relative">
              <img
                src={url}
                alt={`New Page ${index + 1}`}
                className="w-full max-w-[600px] h-auto object-contain rounded cursor-pointer mx-auto"
                onClick={() => handleImageClick(url)}
              />
              <Button
                className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 p-1 rounded"
                onClick={() => handleRemoveImage(index, false)}
                disabled={false}
              >
                <Trash size={18} />
              </Button>
            </div>
          ))}
        </div>
        {images.length === 0 && previewImages.length === 0 && (
          <div className="text-center text-gray-500">Chưa có ảnh nào</div>
        )}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative max-w-4xl">
              <img src={selectedImage} alt="Full view" className="w-full h-auto" />
              <Button
                className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 p-1 rounded"
                onClick={() => setSelectedImage(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </form>
    </ErrorBoundary>
    </>
  );
};

export default EditChapter;
