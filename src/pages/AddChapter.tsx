import { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Save, Upload, Trash } from "lucide-react";
import { Helmet } from 'react-helmet-async';

const AddChapter = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [comicTitle, setComicTitle] = useState<string>("");
  const [chapterTitle, setChapterTitle] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComic = async () => {
      if (!slug) {
        setError("Không tìm thấy slug của truyện.");
        setLoading(false);
        return;
      }
      try {
        const comicRef = doc(db, "comics", slug);
        const comicSnap = await getDoc(comicRef);
        if (comicSnap.exists()) {
          setComicTitle(comicSnap.data().title || "Truyện không tên");
        } else {
          setError("Không tìm thấy truyện");
        }
      } catch (err) {
        setError("Lỗi khi tải thông tin truyện");
      } finally {
        setLoading(false);
      }
    };
    fetchComic();
  }, [slug]);

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
      setImages(prev => [...prev, ...validFiles]);
      const previews = validFiles.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...previews]);
    }
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const generatePublicId = (fileName: string, chapterTitle: string) => {
    const cleanFileName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    return `comics/${slug}/${chapterTitle.replace(/\s+/g, "-").toLowerCase()}/${cleanFileName}`;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chapterTitle.trim()) {
      setError("Tiêu đề chapter không được để trống.");
      return;
    }
    if (images.length === 0) {
      setError("Vui lòng chọn ít nhất một ảnh.");
      return;
    }
    if (!slug) {
      setError("Slug không hợp lệ.");
      return;
    }

    try {
      const comicRef = doc(db, "comics", slug);
      const comicSnap = await getDoc(comicRef);
      if (!comicSnap.exists()) {
        setError("Truyện không tồn tại.");
        return;
      }

      const imageUrls = await Promise.all(images.map(async (image) => {
        const uploadFormData = new FormData();
        uploadFormData.append("file", image);
        uploadFormData.append("upload_preset", "comic-upload");
        const publicId = generatePublicId(image.name, chapterTitle);
        uploadFormData.append("public_id", publicId);

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dfixwzsbz/image/upload",
          uploadFormData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data.secure_url;
      }));

      const newChapter = {
        title: chapterTitle,
        local_images: imageUrls,
      };

      const data = comicSnap.data();
      const existingChapters = data.chapters || [];
      if (existingChapters.some((ch: any) => ch.title === chapterTitle)) {
        setError("Chapter với tiêu đề này đã tồn tại.");
        return;
      }

      const chapterNumber = parseFloat(chapterTitle.replace("Chapter ", ""));
      if (isNaN(chapterNumber)) {
        setError("Tiêu đề chapter không hợp lệ, phải có dạng 'Chapter X'.");
        return;
      }

      let updatedChapters = [...existingChapters, newChapter];

      updatedChapters.sort((a, b) => {
        const numA = parseFloat(a.title.replace("Chapter ", ""));
        const numB = parseFloat(b.title.replace("Chapter ", ""));
        return numB - numA;
      });

      await updateDoc(comicRef, {
        chapters: updatedChapters,
        updated_at: formatUpdatedAt(new Date()),
      });

      alert("Thêm chapter thành công!");
      navigate(`/dashboard/quan-ly-truyen`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`Lỗi khi tải ảnh lên Cloudinary: ${err.response.data.error?.message || "Không rõ nguyên nhân"}.`);
        } else if (err.code === "ERR_NETWORK") {
          setError("Lỗi mạng hoặc CORS. Vui lòng kiểm tra cấu hình CORS trên Cloudinary.");
        } else {
          setError("Lỗi không xác định khi tải ảnh.");
        }
      } else {
        setError("Lỗi khi thêm chapter.");
      }
    }
  };

  useEffect(() => {
    return () => {
      previewImages.forEach(url => url.startsWith("blob:") && URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <Helmet>
        <title>Thêm Chapter - {comicTitle}</title>
      </Helmet>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black text-center break-words">
            Thêm chapter - {comicTitle}
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-black font-medium">Tiêu đề chapter</label>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="w-full p-2 border rounded bg-white text-black outline-none focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-black font-medium">Ảnh trang</label>
            <div className="flex flex-col gap-4">
              {previewImages.length > 0 && (
                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
                  {previewImages.map((src, index) => (
                    <div key={index} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${index + 1}`}
                        className="w-full max-w-[600px] h-auto object-contain rounded cursor-pointer mx-auto"
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/150"; }}
                        onClick={() => handleImageClick(src)}
                      />
                      <Button
                        className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 p-1 rounded"
                        onClick={() => {
                          setImages(prev => prev.filter((_, i) => i !== index));
                          setPreviewImages(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash size={18} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="w-full p-2 border rounded bg-white text-black">
                    {images.length > 0 ? `${images.length} ảnh đã chọn` : "Chưa chọn ảnh"}
                  </div>
                </div>
                <Button
                  type="button"
                  className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
                  onClick={() => document.getElementById("images-upload")?.click()}
                >
                  <Upload size={18} /> Chọn ảnh
                </Button>
                <input
                  id="images-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
            >
              <Save size={18} /> Lưu
            </Button>
          </div>
        </form>
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center  justify-center z-50">
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
      </div>
    </>
  );
};

export default AddChapter;
