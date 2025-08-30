import { Link, useLocation } from "react-router-dom";

const firstCategory = "Tất cả";

const categories = [
  ["Action", "Adventure"],
  ["Anime", "Chuyển Sinh"],
  ["Comedy", "Comic"],
  ["Cooking", "Cổ Đại"],
  ["Doujinshi", "Drama"],
  ["Đam Mỹ", "Fantasy"],
  ["Gender Bender", "Historical"],
  ["Horror", "Live Action"],
  ["Manga", "Manhua"],
  ["Manhwa", "Martial Arts"],
  ["Mecha", "Mystery"],
  ["Ngôn Tình", "Psychological"],
  ["Romance", "School Life"],
  ["Sci-fi", "Shoujo"],
  ["Shoujo Ai", "Shounen"],
  ["Shounen Ai", "Slice of Life"],
  ["Sports", "Supernatural"],
  ["Thiếu Nhi", "Tragedy"],
  ["Trinh Thám", "Truyện Scan"],
  ["Truyện Màu", "Tu Tiên"],
  ["Webtoon", "Xuyên Không"],
];

const slugify = (text: string) =>
  text
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

export const CategoryTab = () => {
  const location = useLocation();

  const getLinkClass = (slug: string) => {
    const currentPath = location.pathname;
    if ((slug === "" && currentPath === "/tim-truyen") || currentPath === `/tim-truyen/${slug}`) {
      return "text-[#a64ca6]";
    }
    return "text-black hover:text-[#a64ca6]";
  };

  return (
    <div className="w-full bg-white p-3 border border-gray-300 rounded text-[13px] leading-5">
      <h2 className="text-blue-500 text-center font-semibold text-xl mb-1">Thể loại</h2>
      <hr className="border-t border-gray-300 mb-2" />

      <div className="mb-1 border-b border-gray-200">
        <Link
          to={`/tim-truyen${firstCategory === "Tất cả" ? "" : `/${slugify(firstCategory)}`}`}
          className={getLinkClass("")}
        >
          {firstCategory}
        </Link>
      </div>

      <div>
        {categories.map(([left, right], index) => (
          <div
            key={index}
            className={`w-full ${index < categories.length - 1 ? "border-b border-gray-200" : ""}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 py-1">
              <Link to={`/tim-truyen/${slugify(left)}`} className={getLinkClass(slugify(left))}>
                {left}
              </Link>
              <Link to={`/tim-truyen/${slugify(right)}`} className={getLinkClass(slugify(right))}>
                {right}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
