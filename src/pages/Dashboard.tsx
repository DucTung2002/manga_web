import { Home, BookOpen, Tag, Users, View, Search, Unlock, Lock, Plus, FilePlus, Edit, Trash } from "lucide-react";
import { Link, useNavigate, useLocation, Navigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";
import defaultAvatar from "@/assets/anonymous.png";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase";

interface Stats {
  comics: number;
  chapters: number;
  users: number;
}

interface Comic {
  id: string;
  coverImage: string;
  name: string;
  author: string;
  chapterCount: number;
  status: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

interface User {
  uid: string;
  avatar: string;
  displayName: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<Stats>({
    comics: 0,
    chapters: 0,
    users: 0,
  });
  const navigate = useNavigate();
  const [comics, setComics] = useState<Comic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchComicTerm, setSearchComicTerm] = useState("");
  const [filteredComics, setFilteredComics] = useState<Comic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentComicPage, setCurrentComicPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [showDeleteComicModal, setShowDeleteComicModal] = useState(false);
  const [comicToDelete, setComicToDelete] = useState<string | null>(null);

  const usersPerPage = 20;
  const categoriesPerPage = 20;
  const comicsPerPage = 36;

  useEffect(() => {
    let unsubComicDocs: Record<string, () => void> = {};

    let comicsLoaded = false;
    let usersLoaded = false;
    let categoriesLoaded = false;

    const checkLoadingComplete = () => {
      if (comicsLoaded && usersLoaded && categoriesLoaded) {
        setIsLoading(false);
      }
    };

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersList: User[] = snapshot.docs.map((doc) => {
          const avatarValue = doc.data().avatar;
          return {
            uid: doc.id,
            avatar:
              avatarValue &&
                avatarValue !== "" &&
                avatarValue !== "/default-avatar.png"
                ? avatarValue
                : defaultAvatar,
            displayName: doc.data().displayName || "N/A",
            email: doc.data().email || "N/A",
            status: doc.data().status || "Hoạt động",
            createdAt: doc.data().createdAt || new Date().toLocaleString(),
          };
        });
        setUsers(usersList);
        setFilteredUsers(usersList);
        setStats((prev) => ({
          ...prev,
          users: snapshot.size,
        }));
        usersLoaded = true;
        checkLoadingComplete();
      },
      () => {
        usersLoaded = true;
        checkLoadingComplete();
      }
    );

    const unsubComics = onSnapshot(
      collection(db, "comics"),
      (snapshot) => {
        let totalChapters = 0;
        const comicsList: Comic[] = snapshot.docs.map((doc) => {
          const chapters = doc.data().chapters || [];
          totalChapters += chapters.length;
          return {
            id: doc.id,
            coverImage: doc.data().cover,
            name: doc.data().title || "N/A",
            author: doc.data().author || "Đang Cập Nhật",
            chapterCount: chapters.length,
            status: doc.data().status || "Đang Tiến Hành",
            slug: doc.data().slug || "",
          };
        });

        setComics(comicsList);
        setFilteredComics(comicsList);
        setStats((prev) => ({
          ...prev,
          comics: snapshot.size,
          chapters: totalChapters,
        }));

        comicsLoaded = true;
        checkLoadingComplete();
      },
      () => {
        comicsLoaded = true;
        checkLoadingComplete();
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        const categoriesList: Category[] = snapshot.docs
          .map((doc) => ({
            id: Number(doc.id.replace("cat_", "")),
            name: doc.data().name || "N/A",
            slug: doc.data().slug || "n/a",
            createdAt: doc.data().createdAt || new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
          }))
          .sort((a, b) => a.id - b.id);
        setCategories(categoriesList);
        categoriesLoaded = true;
        checkLoadingComplete();
      },
      (error) => {
        alert("Đã xảy ra lỗi khi tải danh sách thể loại: " + error.message);
        categoriesLoaded = true;
        checkLoadingComplete();
      }
    );

    return () => {
      unsubUsers();
      unsubComics();
      unsubCategories();
      Object.values(unsubComicDocs).forEach((fn) => fn());
    };
  }, []);

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(term) &&
        (statusFilter === "all" || user.status === statusFilter)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
    if (searchParams.get("page")) {
      setSearchParams({});
    }
  };

  const handleSearchComic = () => {
    const term = searchComicTerm.toLowerCase().trim();
    const filtered = comics.filter((comic) =>
      comic.name.toLowerCase().includes(term)
    );
    setFilteredComics(filtered);
    setCurrentComicPage(1);
    setSearchParams({});
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, statusFilter, users]);

  useEffect(() => {
    handleSearchComic();
  }, [searchComicTerm, comics]);

  useEffect(() => {
    if (location.pathname !== "/dashboard/quan-ly-nguoi-dung") {
      setSearchTerm("");
    }
    if (location.pathname !== "/dashboard/quan-ly-truyen") {
      setSearchComicTerm("");
    }
  }, [location.pathname]);

  const toggleLock = async (user: User) => {
    const newStatus = user.status === "Khóa" ? "Hoạt động" : "Khóa";
    await updateDoc(doc(db, "users", user.uid), { status: newStatus });
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);
  const paginatedCategories = categories.slice(
    (currentPage - 1) * categoriesPerPage,
    currentPage * categoriesPerPage
  );

  const getPageNumbers = (totalPages: number) => {
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    let maxPages;
    if (location.pathname === "/dashboard/quan-ly-the-loai") {
      maxPages = totalCategoryPages;
    } else if (location.pathname === "/dashboard/quan-ly-nguoi-dung") {
      maxPages = totalPages;
    } else if (location.pathname === "/dashboard/quan-ly-truyen") {
      maxPages = Math.ceil(filteredComics.length / comicsPerPage);
    } else {
      return;
    }
    if (page >= 1 && page <= maxPages) {
      if (location.pathname === "/dashboard/quan-ly-truyen") {
        setCurrentComicPage(page);
      } else {
        setCurrentPage(page);
      }
      setSearchParams({ page: page.toString() }, { replace: true });
    }
  };

  useEffect(() => {
    const pageParam = searchParams.get("page");
    const page = pageParam ? parseInt(pageParam, 10) : null;
    let maxPages;

    if (location.pathname === "/dashboard/quan-ly-the-loai") {
      maxPages = totalCategoryPages;
    } else if (location.pathname === "/dashboard/quan-ly-nguoi-dung") {
      maxPages = totalPages;
    } else if (location.pathname === "/dashboard/quan-ly-truyen") {
      maxPages = Math.ceil(filteredComics.length / comicsPerPage);
    } else {
      maxPages = 1;
    }

    if (page && !isNaN(page) && page >= 1 && page <= maxPages) {
      if (location.pathname === "/dashboard/quan-ly-truyen") {
        setCurrentComicPage(page);
      } else {
        setCurrentPage(page);
      }
    } else {
      if (location.pathname === "/dashboard/quan-ly-truyen") {
        if (page && (isNaN(page) || page < 1 || page > maxPages)) {
          setCurrentComicPage(1);
        }
      } else {
        if (page && (isNaN(page) || page < 1 || page > maxPages)) {
          setCurrentPage(1);
        }
      }
    }
  }, [searchParams, location.pathname, totalCategoryPages, totalPages, filteredComics]);

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      categories: { value: string };
      slug: { value: string };
    };

    const categoriesValue = target.categories.value;
    const slugValue = target.slug.value;
    if (!categoriesValue || !slugValue) {
      alert("Vui lòng nhập đầy đủ tên thể loại và slug!");
      return;
    }

    const newCategory: Category = {
      id: categories.length + 1,
      name: categoriesValue,
      slug: slugValue,
      createdAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
    };

    try {
      await setDoc(doc(db, "categories", `cat_${newCategory.id}`), newCategory);
      setShowAddModal(false);
    } catch (error: any) {
    }
  };

  const handleEditCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) {
      alert("Vui lòng chọn một thể loại để chỉnh sửa!");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const categoriesValue = formData.get("categories") as string;
    const slugValue = formData.get("slug") as string;

    if (!categoriesValue || !slugValue) {
      alert("Vui lòng nhập đầy đủ tên thể loại và slug!");
      return;
    }

    const updatedCategory: Category = {
      id: editingCategory.id,
      name: categoriesValue,
      slug: slugValue,
      createdAt: editingCategory.createdAt,
    };

    try {
      const categoryRef = doc(db, "categories", `cat_${editingCategory.id}`);
      await updateDoc(categoryRef, {
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        createdAt: updatedCategory.createdAt,
      });

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === updatedCategory.id ? updatedCategory : cat
        )
      );

      setShowEditModal(false);
      setEditingCategory(null);
      alert("Cập nhật thể loại thành công!");
    } catch (error: any) {
      if (error.code === "permission-denied") {
        alert("Bạn không có quyền cập nhật thể loại này.");
      } else if (error.code === "not-found") {
        alert("Không tìm thấy thể loại trong Firestore.");
      } else {
        alert("Đã xảy ra lỗi khi cập nhật thể loại: " + error.message);
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      const categoryRef = doc(db, "categories", `cat_${id}`);
      await deleteDoc(categoryRef);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      alert("Xóa thể loại thành công!");
    } catch (error: any) {
      alert("Đã xảy ra lỗi khi xóa thể loại: " + error.message);
    }
  };

  const handleDeleteComic = async (id: string) => {
    try {
      const comicRef = doc(db, "comics", id);
      await deleteDoc(comicRef);
      alert("Xóa truyện thành công!");
    } catch (error: any) {
      alert("Đã xảy ra lỗi khi xóa truyện: " + error.message);
    }
  };

  const menuItems = [
    { label: "Trang chủ", icon: <Home size={18} />, path: "/dashboard" },
    {
      label: "Quản lý truyện",
      icon: <BookOpen size={18} />,
      path: "/dashboard/quan-ly-truyen",
    },
    {
      label: "Quản lý thể loại",
      icon: <Tag size={18} />,
      path: "/dashboard/quan-ly-the-loai",
    },
    {
      label: "Quản lý người dùng",
      icon: <Users size={18} />,
      path: "/dashboard/quan-ly-nguoi-dung",
    },
  ];

  const renderContent = () => {
    switch (location.pathname) {
      case "/dashboard":
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 text-black">Trang quản trị</h1>
            <div className="flex gap-4 flex-wrap">
              <div className="w-56 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg shadow">
                <div className="text-base">TỔNG SỐ TRUYỆN</div>
                <div className="text-3xl font-bold">{stats.comics}</div>
              </div>
              <div className="w-56 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg shadow">
                <div className="text-base">TỔNG SỐ CHAPTER</div>
                <div className="text-3xl font-bold">{stats.chapters}</div>
              </div>
              <div className="w-56 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-lg shadow">
                <div className="text-base">TỔNG SỐ NGƯỜI DÙNG</div>
                <div className="text-3xl font-bold">{stats.users}</div>
              </div>
            </div>
          </>
        );
      case "/dashboard/quan-ly-truyen":
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 text-black">Quản lý truyện</h1>
            <div className="flex justify-between mb-4 items-center">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên truyện..."
                  className="p-2 border rounded bg-white text-black outline-none focus:outline-none w-64"
                  value={searchComicTerm}
                  onChange={(e) => setSearchComicTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchComic();
                    }
                  }}
                />
                <Button
                  className="p-2 bg-blue-500 text-white rounded ml-2 outline-none focus:outline-none flex items-center hover:bg-blue-600 transition duration-200"
                  onClick={handleSearchComic}
                >
                  <Search size={18} className="mr-1" /> Tìm kiếm
                </Button>
              </div>
              <Button
                className="flex items-center gap-2 px-4 py-2 bg-green-500 border-none outline-none focus:outline-none rounded-lg hover:bg-green-600 transition duration-200"
                onClick={() => navigate('/dashboard/quan-ly-truyen/them-truyen')}
              >
                <Plus size={18} /> Thêm truyện mới
              </Button>
            </div>
            <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-800 text-white text-center">
                  <th className="p-3">Ảnh bìa</th>
                  <th className="p-3">Tên truyện</th>
                  <th className="p-3">Tác giả</th>
                  <th className="p-3">Số chapter</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredComics
                  .slice(
                    (currentComicPage - 1) * comicsPerPage,
                    currentComicPage * comicsPerPage
                  )
                  .map((comic) => (
                    <tr key={comic.id} className="border-b border-gray-200 hover:bg-gray-100 transition duration-200">
                      <td className="p-2 text-center">
                        <img
                          src={comic.coverImage}
                          alt="Ảnh bìa"
                          className="w-10 h-10 mx-auto block"
                        />
                      </td>
                      <td className="p-2 text-left text-black">
                        <div
                          className="max-w-[450px] whitespace-normal"
                          title={comic.name}
                        >
                          {comic.name}
                        </div>
                      </td>
                      <td className="p-2 text-center text-black">{comic.author}</td>
                      <td className="p-2 text-center text-black">{comic.chapterCount}</td>
                      <td className="p-2 text-center text-black">{comic.status}</td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600 border-none outline-none focus:outline-none transition duration-200"
                            onClick={() => navigate(`/truyen-tranh/${comic.slug}`)}
                          >
                            <View size={18} />
                          </Button>
                          <Button
                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 border-none outline-none focus:outline-none transition duration-200"
                            onClick={() => navigate(`/dashboard/quan-ly-truyen/them-chapter/${comic.slug}`)}
                          >
                            <FilePlus size={18} />
                          </Button>
                          <Button
                            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 border-none outline-none focus:outline-none transition duration-200"
                            onClick={() => navigate(`/dashboard/quan-ly-truyen/chinh-sua-truyen/${comic.slug}`)}
                          >
                            <Edit size={18} />
                          </Button>
                          <Button
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 border-none outline-none focus:outline-none transition duration-200"
                            onClick={() => {
                              setComicToDelete(comic.id);
                              setShowDeleteComicModal(true);
                            }}
                          >
                            <Trash size={18} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {filteredComics.length > comicsPerPage && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <Button
                  className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => handlePageChange(currentComicPage - 1)}
                  disabled={currentComicPage === 1}
                >
                  &lt;
                </Button>
                {getPageNumbers(Math.ceil(filteredComics.length / comicsPerPage)).map((page, index) =>
                  typeof page === "number" ? (
                    <Button
                      key={page}
                      className={`px-3 py-1 ${currentComicPage === page
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
                  onClick={() => handlePageChange(currentComicPage + 1)}
                  disabled={currentComicPage === Math.ceil(filteredComics.length / comicsPerPage)}
                >
                  &gt;
                </Button>
              </div>
            )}
            {showDeleteComicModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => {
                  setShowDeleteComicModal(false);
                  setComicToDelete(null);
                }}
              >
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-black">Xác nhận xóa</h2>
                  <p className="mb-4 text-black">
                    Bạn có chắc chắn muốn xóa truyện này không? Hành động này không thể hoàn tác.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                      onClick={() => {
                        setShowDeleteComicModal(false);
                        setComicToDelete(null);
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={async () => {
                        if (comicToDelete !== null) {
                          await handleDeleteComic(comicToDelete);
                          setShowDeleteComicModal(false);
                          setComicToDelete(null);
                        }
                      }}
                    >
                      Xác nhận
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      case "/dashboard/quan-ly-the-loai":
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 text-black">Quản lý thể loại</h1>
            <div className="flex justify-end mb-4">
              <Button
                className="flex items-center gap-2 px-4 py-2 bg-green-500 border-none outline-none focus:outline-none rounded-lg hover:bg-green-600 transition duration-200"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={18} /> Thêm thể loại
              </Button>
            </div>
            <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-800 text-white text-center">
                  <th className="p-3">STT</th>
                  <th className="p-3">Tên thể loại</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.map((category: Category) => (
                  <tr
                    key={category.id}
                    className="border-b border-gray-200 hover:bg-gray-100 transition duration-200"
                  >
                    <td className="p-2 text-center text-black">{category.id}</td>
                    <td className="p-2 text-center text-black">{category.name}</td>
                    <td className="p-2 text-center text-black">{category.slug}</td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 border-none outline-none focus:outline-none transition duration-200"
                          onClick={() => {
                            setShowEditModal(true);
                            setEditingCategory(category);
                          }}
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 border-none outline-none focus:outline-none transition duration-200"
                          onClick={() => {
                            setCategoryToDelete(category.id);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalCategoryPages > 1 && (
              <div className="mt-4 flex justify-center items-center gap-2">
                <Button
                  className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>
                {getPageNumbers(totalCategoryPages).map((page, index) =>
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
                  disabled={currentPage === totalCategoryPages}
                >
                  &gt;
                </Button>
              </div>
            )}
            {showAddModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-black">Thêm thể loại mới</h2>
                  <form onSubmit={handleAddCategory}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-black">Tên thể loại</label>
                      <input
                        type="text"
                        name="categories"
                        className="w-full p-2 border rounded outline-none focus:outline-none bg-white text-black"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-black">Slug</label>
                      <input
                        type="text"
                        name="slug"
                        className="w-full p-2 border rounded outline-none focus:outline-none bg-white text-black"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                        onClick={() => setShowAddModal(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Lưu
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {showEditModal && editingCategory && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-black">Chỉnh sửa thể loại</h2>
                  <form onSubmit={handleEditCategory}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-black">Tên thể loại</label>
                      <input
                        type="text"
                        name="categories"
                        defaultValue={editingCategory.name}
                        className="w-full p-2 border rounded outline-none focus:outline-none bg-white text-black"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-black">Slug</label>
                      <input
                        type="text"
                        name="slug"
                        defaultValue={editingCategory.slug}
                        className="w-full p-2 border rounded outline-none focus:outline-none bg-white text-black"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingCategory(null);
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Cập nhật
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {showDeleteModal && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
              >
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-black">Xác nhận xóa</h2>
                  <p className="mb-4 text-black">
                    Bạn có chắc chắn muốn xóa thể loại này không? Hành động này không thể hoàn tác.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setCategoryToDelete(null);
                      }}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={async () => {
                        if (categoryToDelete !== null) {
                          await handleDeleteCategory(categoryToDelete);
                          setShowDeleteModal(false);
                          setCategoryToDelete(null);
                        }
                      }}
                    >
                      Xác nhận
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      case "/dashboard/quan-ly-nguoi-dung":
        return (
          <>
            <h1 className="text-2xl font-bold mb-6 text-black">Quản lý người dùng</h1>
            <div className="mb-4 flex items-center">
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                className="p-2 border rounded bg-white text-black outline-none focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <select
                className="p-2 border rounded ml-2 bg-white text-black outline-none focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Khóa">Khóa</option>
              </select>
              <button
                className="p-2 bg-blue-500 text-white rounded ml-2 outline-none focus:outline-none flex items-center hover:bg-blue-600 transition duration-200"
                onClick={handleSearch}
              >
                <Search size={18} className="mr-1" /> Tìm kiếm
              </button>
            </div>
            <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-800 text-white text-center">
                  <th className="p-3">Avatar</th>
                  <th className="p-3">Tên người dùng</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Ngày tham gia</th>
                  <th className="p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.uid} className="border-t text-black text-center hover:bg-gray-100 transition duration-200">
                    <td className="p-2">
                      <img
                        src={
                          user.avatar &&
                            user.avatar !== "" &&
                            user.avatar !== "/default-avatar.png"
                            ? user.avatar
                            : defaultAvatar
                        }
                        alt="Avatar"
                        className="w-10 h-10 mx-auto block"
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                    </td>
                    <td className="p-2">{user.displayName}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded ${user.status === "Hoạt động"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                          }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="p-2">{user.createdAt}</td>
                    <td className="p-2">
                      <div className="flex justify-center gap-2">
                        <Button
                          className={`${user.status === "Khóa"
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-yellow-500 hover:bg-yellow-600"
                            } text-white rounded-md w-12 h-9 border-none outline-none focus:outline-none flex items-center justify-center`}
                          onClick={() => toggleLock(user)}
                        >
                          {user.status === "Khóa" ? (
                            <Unlock size={18} />
                          ) : (
                            <Lock size={18} />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
          </>
        );
      default:
        return <Navigate to="/dashboard" replace />;
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <nav className="flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-200 text-gray-700 ${location.pathname === item.path
                  ? "bg-gray-200 font-semibold"
                  : ""
                }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 bg-gray-100 p-6">{renderContent()}</main>
    </div>
  );
}
