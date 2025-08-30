import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, setDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save, Upload } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface ComicData {
  title: string;
  author: string;
  status: string;
  description: string;
}

const AddComic = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComicData>({
    title: "",
    author: "",
    status: "",
    description: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, "categories");
        const categoriesSnap = await getDocs(categoriesRef);
        const categoriesList = categoriesSnap.docs
          .map((doc) => doc.data() as Category)
          .sort((a, b) => a.id - b.id);
        setCategories(categoriesList);
      } catch (err) {
        setError("Lỗi khi tải danh sách thể loại");
      }
    };
    fetchCategories();
  }, []);

  const generatePublicId = (fileName: string, id: string) => {
    const cleanFileName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    return `comics/${id}/${cleanFileName}`;
  };

  const handleGenreToggle = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const formatUpdatedAt = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `[Cập nhật lúc: ${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
  };

  const createSlug = (title: string) => {
    const vietnameseMap: { [key: string]: string } = {
      'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
      'đ': 'd',
      'Á': 'A', 'À': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
      'Ă': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
      'Â': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
      'É': 'E', 'È': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
      'Ê': 'E', 'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
      'Í': 'I', 'Ì': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
      'Ó': 'O', 'Ò': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
      'Ô': 'O', 'Ố': 'O', 'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
      'Ơ': 'O', 'Ớ': 'O', 'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
      'Ú': 'U', 'Ù': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
      'Ư': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
      'Ý': 'Y', 'Ỳ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
      'Đ': 'D'
    };

    return title
      .toLowerCase()
      .replace(/./g, (char) => vietnameseMap[char] || char)
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Tên truyện không được để trống.");
      return;
    }

    try {
      const slug = createSlug(formData.title);
      const comicRef = doc(db, "comics", slug);
      const comicSnap = await getDoc(comicRef);

      if (comicSnap.exists()) {
        setError("Truyện với tên này đã tồn tại. Vui lòng chọn tên khác.");
        return;
      }

      let coverUrl = "";
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
          coverUrl = response.data.secure_url;
        } else {
          throw new Error("Không nhận được URL ảnh từ Cloudinary");
        }
      } else {
        setError("Vui lòng chọn một file ảnh để upload.");
        return;
      }

      const link = `https://nettruyenvio.com/truyen-tranh/${slug}`;

      const newComic = {
        title: formData.title,
        author: formData.author || "Đang Cập Nhật",
        status: formData.status || "Đang Tiến Hành",
        cover: coverUrl,
        description: formData.description,
        genres: genres,
        link: link,
        slug: slug,
        updated_at: formatUpdatedAt(new Date()),
      };

      await setDoc(comicRef, newComic);

      alert("Thêm truyện thành công!");
      navigate("/dashboard/quan-ly-truyen");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorMessage = err.response.data.error?.message || "Không rõ nguyên nhân";
          setError(`Lỗi khi tải ảnh lên Cloudinary: ${errorMessage}.`);
        } else if (err.code === "ERR_NETWORK") {
          setError("Lỗi mạng hoặc CORS. Vui lòng kiểm tra cấu hình CORS trên Cloudinary.");
        } else {
          setError("Lỗi không xác định khi tải ảnh.");
        }
      } else {
        setError("Lỗi khi thêm truyện.");
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

  if (error) return <div>{error}</div>;

  return (
    <div className="p-6 max-w-4xl  mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black text-center break-words">
          Thêm truyện mới
        </h1>
      </div>
      <div className="flex justify-start items-center mb-6">
        <Button
          className="bg-gray-500 text-white hover:bg-gray-600 flex items-center gap-2"
          onClick={() => navigate("/dashboard/quan-ly-truyen")}
        >
          <ArrowLeft size={18} /> Quay lại
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
              <Upload size={18} /> Chọn ảnh
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
                  checked={genres.includes(category.name)}
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
            <Save size={18} /> Thêm truyện
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddComic;
