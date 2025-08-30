import { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save, Upload, List } from "lucide-react";

interface ComicData {
  title: string;
  author: string;
  status: string;
  cover: string;
  description: string;
  genres: string[];
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

const EditComic = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [comic, setComic] = useState<ComicData | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    status: "",
    cover: "",
    description: "",
    genres: [] as string[],
  });
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      try {
        const categoriesRef = collection(db, "categories");
        const categoriesSnap = await getDocs(categoriesRef);
        const categoriesList = categoriesSnap.docs
          .map((doc) => doc.data() as Category)
          .sort((a, b) => a.id - b.id);
        setCategories(categoriesList);

        const comicRef = doc(db, "comics", slug);
        const comicSnap = await getDoc(comicRef);
        if (comicSnap.exists()) {
          const data = comicSnap.data() as ComicData;
          setComic(data);
          setFormData({
            title: data.title || "N/A",
            author: data.author || "Đang Cập Nhật",
            status: data.status || "Đang Tiến Hành",
            cover: data.cover || "",
            description: data.description || "",
            genres: data.genres || [],
          });

          if (data.cover && isValidImageUrl(data.cover)) {
            setPreviewImage(data.cover);
            const urlParts = data.cover.split("/");
            const encodedFileName = urlParts[urlParts.length - 1].split("?")[0];
            const decodedFileName = decodeURIComponent(encodedFileName);
            setFileName(decodedFileName);
          } else {
            setPreviewImage("");
            setFileName("");
          }
        } else {
          setError("Không tìm thấy truyện");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const isValidImageUrl = (url: string) => {
    return url.match(/\.(jpeg|jpg|png|gif|webp)$/i) !== null;
  };

  const isValidTitle = (title: string) => {
    return !title.match(/\.(jpeg|jpg|png|gif|webp)$/i) && title.trim().length > 0;
  };

  const generatePublicId = (fileName: string, slug: string) => {
    const cleanFileName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    return `comics/${slug}/${cleanFileName}`;
  };

  const formatUpdatedAt = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `[Cập nhật lúc: ${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenreToggle = (genre: string) => {
    setFormData((prev) => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres };
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn một file ảnh hợp lệ (JPEG, PNG, GIF, WebP)");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File ảnh quá lớn. Vui lòng chọn file dưới 10MB.");
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;

    if (!isValidTitle(formData.title)) {
      setError("Tên truyện không hợp lệ. Vui lòng nhập tên truyện thay vì tên file ảnh.");
      return;
    }

    try {
      let updatedCover = formData.cover;
      if (selectedFile) {
        if (!selectedFile.type.startsWith("image/")) {
          setError("Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, GIF, WebP)");
          return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
          setError("File ảnh quá lớn. Vui lòng chọn file dưới 10MB.");
          return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedFile);
        uploadFormData.append("upload_preset", "comic-upload");
        uploadFormData.append("public_id", generatePublicId(selectedFile.name, slug));

        const response = await axios.post(
          "https://api.cloudinary.com/v1_1/dfixwzsbz/image/upload",
          uploadFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.secure_url) {
          updatedCover = response.data.secure_url;
        } else {
          throw new Error("Không nhận được URL ảnh từ Cloudinary");
        }
      }

      const updateData = {
        title: formData.title,
        author: formData.author,
        status: formData.status,
        cover: updatedCover,
        description: formData.description,
        genres: formData.genres,
        updated_at: formatUpdatedAt(new Date()),
      };

      const comicRef = doc(db, "comics", slug);
      await updateDoc(comicRef, updateData);

      alert("Cập nhật truyện thành công!");
      navigate("/dashboard/quan-ly-truyen");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorMessage = err.response.data.error?.message || "Không rõ nguyên nhân";
          setError(`Lỗi khi tải ảnh lên Cloudinary: ${errorMessage}. Kiểm tra cấu hình preset hoặc CORS.`);
        } else if (err.code === "ERR_NETWORK") {
          setError("Lỗi mạng hoặc CORS. Vui lòng kiểm tra cấu hình CORS trên Cloudinary.");
        } else {
          setError("Lỗi không xác định khi tải ảnh. Vui lòng thử lại.");
        }
      } else {
        setError("Lỗi khi cập nhật truyện. Vui lòng kiểm tra console để xem chi tiết.");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;
  if (!comic) return <div>Không tìm thấy truyện</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black text-center break-words">
          Chỉnh sửa truyện: {comic.title}
        </h1>
      </div>
      <div className="flex justify-between items-center mb-6">
        <Button
          className="bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2"
          onClick={() => navigate("/dashboard/quan-ly-truyen")}
        >
          <ArrowLeft size={18} /> Quay lại
        </Button>
        <Button
          className="bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
          onClick={() => navigate(`/dashboard/quan-ly-chapter/${slug}`)}
        >
          <List size={18} /> Quản lý chapter
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-black font-medium">Tên truyện</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black outline-none focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-black font-medium">Tác giả</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black outline-none focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-black font-medium">Trạng thái</label>
          <input
            type="text"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black outline-none focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-black font-medium">Ảnh bìa</label>
          <div className="flex items-center gap-4">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Ảnh bìa"
                className="w-24 h-24 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/150";
                }}
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded flex items-center text-center justify-center text-gray-500">
                Không có ảnh
              </div>
            )}
            <div className="flex-1">
              <div className="w-full p-2 border rounded bg-white text-black">
                {fileName || "Chưa chọn ảnh"}
              </div>
            </div>
            <Button
              type="button"
              className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
              onClick={() => document.getElementById("cover-upload")?.click()}
            >
              <Upload size={18} /> Thay ảnh
            </Button>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>
        <div>
          <label className="block text-black font-medium">Mô tả</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-white text-black outline-none focus:outline-none"
            rows={4}
          />
        </div>
        <div>
          <label className="block text-black font-medium mb-2">Thể loại</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                <input
                  type="checkbox"
                  checked={formData.genres.includes(category.name)}
                  onChange={() => handleGenreToggle(category.name)}
                  className="h-4 w-4 text-blue-500 !bg-white border-gray-300 rounded focus:ring-0"
                />
                <span className="text-black">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <Button
            type="submit"
            className="bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
          >
            <Save size={18} /> Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditComic;
