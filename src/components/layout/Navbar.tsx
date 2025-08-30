import { ChevronDown, Home } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import clsx from "clsx";

const navItems = [
  { icon: <Home size={20} />, href: "/" },
  { label: "THEO DÕI", href: "/theo-doi" },
  { label: "LỊCH SỬ", href: "/lich-su-truyen-tranh" },
  {
    label: "THỂ LOẠI",
    dropdown: true,
    href: "/tim-truyen",
    subItems: [
      "Tất Cả",
      "Doujinshi",
      "Manhua",
      "Sci-fi",
      "Thiếu Nhi",
      "Action",
      "Drama",
      "Manhwa",
      "Shoujo",
      "Tragedy",
      "Adventure",
      "Đam Mỹ",
      "Martial Arts",
      "Shoujo Ai",
      "Trinh Thám",
      "Anime",
      "Fantasy",
      "Mecha",
      "Shounen",
      "Truyện Scan",
      "Chuyển Sinh",
      "Gender Bender",
      "Mystery",
      "Shounen Ai",
      "Truyện Màu",
      "Comedy",
      "Historical",
      "Ngôn Tình",
      "Slice of Life",
      "Tu Tiên",
      "Comic",
      "Horror",
      "Psychological",
      "Sports",
      "Webtoon",
      "Cooking",
      "Live Action",
      "Romance",
      "Supernatural",
      "Xuyên Không",
      "Cổ Đại",
      "Manga",
      "School Life",
    ],
  },
  { label: "TÌM TRUYỆN", href: "/tim-truyen" },
];

const tooltipMap: Record<string, string> = {
  "Tất Cả": "Tất cả thể loại truyện tranh",
  Action: "Thể loại này thường có nội dung về đánh nhau, bạo lực, hỗn loạn, với diễn biến nhanh",
  Adventure: "Thể loại phiêu lưu, mạo hiểm, thường là hành trình của các nhân vật",
  Anime: "Truyện đã được chuyển thể thành film Anime",
  "Chuyển Sinh": "Thể loại này là những câu chuyện về người ở một thế giới này xuyên đến một thế giới khác, có thể là thế giới mang phong cách trung cổ với kiếm sĩ và ma thuật, hay thế giới trong game, hoặc có thể là bạn chết ở nơi này và được chuyển sinh đến nơi khác",
  Comedy: "Thể loại có nội dung trong sáng và cảm động, thường có các tình tiết gây cười, các xung đột nhẹ nhàng",
  Comic: "Truện tranh Châu Âu và Châu Mỹ",
  Cooking: "Thể loại có nội dung về nấu ăn, ẩm thực",
  "Cổ Đại": "Truyện có nội dung xảy ra ở thời cổ đại phong kiến",
  Doujinshi: "Thể loại truyện phóng tác do fan hay có cả những Mangaka khác với tác giả truyện gốc. Tác giả về Doujinshi thường dựa trên những nhân vật gốc để viết ra những câu chuyện theo sở thích của mình",
  Drama: "Thể loại mang đến cho người xem những cảm xúc khác nhau: buồn bã, căng thẳng thậm chí là bi phẫn",
  "Đam Mỹ": "Truyện tình cảm giữa nam và nam",
  Fantasy: "Thể loại xuất phát từ trí tưởng tượng phong phú, từ pháp thuật đến thế giới trong mơ thậm chí là những cau chuyện thần tiên",
  "Gender Bender": "Là một thể loại trong đó giới tính của nhân vật bị lẫn lộn: nam hóa thành nữ, nữ hóa thành nam,...",
  Historical: "Thể loại có liên quan đến thời xa xưa",
  Horror: "Horror là: rùng rợn, nghe cái tên là bạn đã hiểu thể loại này có nội dung thế nào. Nó làm cho bạn kinh hãi, khiếp sợ, ghê tởm, run rẩy, có thể gây shock - một thể loại không dành cho người yếu tim",
  "Live Action": "Truyện đã được chuyển thể thành phim",
  Manga: "Truyện tranh của Nhật Bản",
  Manhua: "Truyện tranh của Trung Quốc",
  Manhwa: "Truyện tranh Hàn Quốc",
  "Martial Arts": "Giống với tên gọi, bất cứ gì liên quan đến võ thuật trong truyện từ các trận đánh nhau, tự vệ đến các môn võ thuật như akido, karate, judo hay taekwondo, kendo, các cách né tránh",
  Mecha: "Mecha, còn được biết đến dưới cái tên meka hay mechs, là thể loại nói tới những cỗ máy biết đi (thường là do phi công cầm lái)",
  Mystery: "Thể loại thường xuất hiện những điều bí ẩn không thể lí giải được và sau đó là những nỗ lực của nhân vật chính nhằm tìm ra câu trả lời thỏa đáng",
  "Ngôn Tình": "Truyện thuộc kiểu lãng mạn, kể về những sự kiện vui buồn trong tình yêu của nhân vật chính",
  Psychological: "Thể loại liên quan đến những vấn đề về tâm lý của nhân vật (tâm thần bất ổn, điên cuồng,...)",
  Romance: "Thường là những câu chuyện về tình yêu, tình cảm lãng mạn. Ở đây chúng ta sẽ lấy ví dụ như tình yêu giữa một người con trai và con gái, bên cạnh đó đặc điểm thể loại này là kích thích trí tưởng tượng của bạn về tình yêu",
  "School Life": "Trong thể loại này, ngữ cảnh diễn biến câu chuyện chủ yếu ở trường học",
  "Sci-fi": "Bao gồm những chuyện khoa học viễn tưởng, đa phàn chúng xoay quanh nhiều hiện tượng mà liên quan tới khoa học, công nghệ, tuy vậy thường chỉ những câu chuyện đó không gắn bó chặt chẽ với các thành tựu khoa học hiện thời, mà là do con người tưởng tượng ra",
  Shoujo: "Đối tượng hướng tới của thể loại này là phái nữ. Nội dung của những bộ manga này thường liên quan đến tình cảm lãng mạn, chú trọng đầu tư cho nhân vật chính (tính cách,...)",
  "Shoujo Ai": "Thể loại quan hệ hoặc liên quan tới đồng tính nữ, thể loại trong các mối quan hệ trên mức bình thường giữa các nhân vật nữ trong các manga, anime",
  Shounen: "Đối tượng hướng tới của thể loại này là phái nam. Nội dung của những bộ manga này thường liên quan đến đánh nhau và/hoặc bạo lực (ở mức bình thường, không thái quá)",
  "Shounen Ai": "Thể loại có nội dung về tình yêu giữa những chàng trai trẻ, mang tính chất lãng mạn nhưng không đề cập đến quan hệ tình dục",
  "Slice of Life": "Nói về cuộc sống đời thường",
  Sports: "Đúng như tên gọi, những môn thể thao như bóng đá, bóng chày, bóng chuyền, đua xe, cầu lông,... là một phần của thể loại này",
  Supernatural: "Thể hiện những sức mạnh đáng kinh ngạc và không thể giải thích được, chúng thường đi kèm với những sự kiện trái ngược hoặc thách thức với những định luật vật lý",
  "Thiếu Nhi": "Truyện tranh dành cho lứa tuổi thiếu niên",
  Tragedy: "Thể loại chứa đựng những sự kiện mà dẫn đến kết cục là những mất mát hay sự rủi ro lớn",
  "Trinh Thám": "Các truyện có nội dung về các vụ án, các thám tử cảnh sát diều tra,...",
  "Truyện Scan": "Các truyện đã phát hành tại VN được scan đăng online",
  "Truyện Màu": "Tổng hợp truyện tranh màu, rõ, đẹp",
  "Tu Tiên": "Truyện tu tiên xoay quanh hành trình tu luyện gian khổ của nhân vậy chính trong thế giới huyền ảo, với phép thuật, bảo vật và sự cạnh tranh giữa các tông môn để đạt trường sinh bất tử",
  Webtoon: "Là truyện tranh được đăng dài kỳ trên internet của Hàn Quốc chứ không xuất bản theo cách thông thường",
  "Xuyên Không": "Xuyên Không, Xuyên Việt là thể loại nhân vật chính vì một lý do nào đó mà bị đưa đến sinh sống ở một không gian hay một khoảng thời gian khác. Nhân vật chính có thể trực tiếp xuyên qua bằng thân xác mình hoặc sống lại bằng thân xác người khác",
};

const slugify = (text: string) =>
  text
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const getSubItemLink = (sub: string) =>
  sub === "Tất Cả" ? "/tim-truyen" : `/tim-truyen/${slugify(sub)}`;

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-100 border-t border-b border-gray-200 text-sm shadow-sm relative sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 flex">
        <ul className="flex flex-wrap items-center gap-4 py-2">
          {navItems.map((item) => (
            <li key={item.label || item.href} className="relative group">
              {item.label === "THỂ LOẠI" ? (
                <div
                  onClick={() => navigate(item.href || "/tim-truyen")}
                  className={clsx(
                    "flex items-center gap-1 px-3 py-2 text-base font-semibold transition-colors cursor-pointer",
                    "text-gray-800 hover:text-blue-600"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.dropdown && <ChevronDown size={12} />}
                </div>
              ) : (
                <NavLink
                  to={item.href || "/tim-truyen"}
                  end
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-1 px-3 py-2 text-base font-semibold transition-colors",
                      isActive
                        ? "text-blue-600"
                        : "text-gray-800 hover:text-blue-600"
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.dropdown && <ChevronDown size={12} />}
                </NavLink>
              )}

              {item.dropdown && (
                <div className="absolute left-0 top-full w-[700px] bg-white border rounded shadow z-50 hidden group-hover:block">
                  <ul className="grid grid-cols-5 grid-rows-6 text-[14px] font-semibold">
                    {item.subItems?.map((sub) => (
                      <NavLink
                        key={sub}
                        to={getSubItemLink(sub)}
                        end
                        className={({ isActive }) =>
                          clsx(
                            "px-3 py-2 cursor-pointer transition-colors font-semibold relative",
                            isActive ? "text-purple-600" : "text-black hover:text-purple-600"
                          )
                        }
                        title={tooltipMap[sub]}
                      >
                        {sub}
                      </NavLink>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
