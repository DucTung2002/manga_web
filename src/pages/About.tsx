import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HistoryTab } from "@/components/layout/HistoryTab";
import { Helmet } from 'react-helmet-async';

export const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Giới thiệu</title>
      </Helmet>
      <Header />
      <Navbar />

      <section className="w-full bg-white px-4 py-10 pb-2">
        <div className="max-w-screen-xl mx-auto flex gap-6">
          <div className="flex-1 space-y-8 text-gray-800 leading-relaxed">
            <h1 className="text-5xl font-bold text-center text-black-600">
              Giới thiệu
            </h1>

            <div className="space-y-4">
              <p>
                Bạn là một fan của truyện tranh? Bạn muốn đọc những truyện tranh online miễn phí, đa dạng thể loại và nội dung, cập nhật liên tục và nhanh chóng? Bạn muốn tham gia vào một cộng đồng truyện tranh sôi nổi của NetTruyen và giao lưu với các tác giả, biên tập viên và người dùng khác? Nếu câu trả lời là có, thì bạn không thể bỏ qua website NetTruyenViet - một trong những website truyện tranh online miễn phí hàng đầu tại Việt Nam.
              </p>
              <p>
                Chào mừng các đạo hữu đến với NetTruyenViet - nơi lý tưởng cho những người đam mê truyện tranh! NetTruyenViet tự hào là một trang web hàng đầu tại Việt Nam, mang đến cho độc giả trải nghiệm đọc truyện tranh online miễn phí với sự đa dạng về thể loại và nội dung.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-black-500">Sứ mệnh</h2>
              <p>
                Website chúng tôi được thành lập vào năm 2013 bởi một nhóm những người yêu thích truyện tranh, với sứ mệnh mang đến cho người dùng những trải nghiệm đọc truyện tranh online tốt nhất, phong phú nhất và tiện lợi nhất. Với hơn 10 năm hoạt động, website đã thu hút được hàng triệu lượt truy cập và đăng ký thành viên, trở thành một trong những website truyện tranh uy tín và hấp dẫn nhất tại Việt Nam.
              </p>
              <p>
                NetTruyenViet không chỉ là một trang web đọc truyện tranh, mà là ngôi nhà tinh thần của những người yêu thích nghệ thuật vẽ truyện và tìm kiếm sự phiêu lưu trong thế giới đa dạng của truyện tranh. Sứ mệnh của chúng tôi không chỉ dừng lại ở việc cung cấp nền tảng cho việc đọc truyện mà còn làm nổi bật những giá trị sâu sắc mà truyện tranh mang lại.
              </p>
              <p>
                NetTruyenViet không ngừng nỗ lực để đảm bảo chất lượng tối ưu cho mọi tác phẩm trên trang web. Chúng tôi tôn trọng và đánh giá cao sự sáng tạo và công sức của các tác giả, và luôn đặt chất lượng lên hàng đầu.
              </p>
              <p>
                Sự nhanh chóng không chỉ xuất phát từ tốc độ cập nhật truyện mà còn từ khả năng linh hoạt của chúng tôi trong đáp ứng sự đa dạng của độc giả. Bạn muốn đọc truyện mới nhất? Chúng tôi có! Bạn muốn tìm lại những tác phẩm cũ? Chúng tôi cũng có!
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-black-500">
                Đội ngũ nhân sự
              </h2>
              <p>
                Chúng tôi tự hào có một đội ngũ tận tâm, chuyên nghiệp và đầy nhiệt huyết, đồng lòng đồng lòng trong việc mang đến cho người đọc những trải nghiệm đọc truyện tranh tuyệt vời nhất. Đội ngũ của chúng tôi không ngừng nỗ lực để đảm bảo rằng NetTruyenViet luôn duy trì chất lượng và sáng tạo.
              </p>
              <p>
                Website NetTruyenViet có một đội ngũ gồm các tác giả, biên tập viên, kỹ thuật viên và quản trị viên chuyên nghiệp, nhiệt tình và sáng tạo. Họ luôn nỗ lực để cung cấp cho người dùng những truyện tranh online chất lượng cao, đa dạng thể loại và nội dung, từ các truyện tranh Việt Nam đến các truyện tranh quốc tế, từ các truyện tranh cổ điển đến các truyện tranh mới nhất. Họ cũng luôn lắng nghe và tiếp thu ý kiến của người dùng để cải thiện và phát triển website.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-black-500">
                Thể loại truyện
              </h2>
              <p>
                Tại NetTruyenViet, chúng tôi hiểu rằng sở thích đọc truyện tranh của mỗi người là khác nhau. Vì vậy, trang web của chúng tôi tự hào với việc cung cấp một loạt các thể loại truyện tranh, từ hài hước đến kinh dị, truyện tranh đam mỹ, truyện tranh ngôn tình và nhiều thể loại truyện tranh hấp dẫn khác. Bất kỳ độc giả nào cũng có thể tìm thấy điều gì đó phù hợp với sở thích của mình.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-black-500">
                Thông tin liên hệ
              </h2>
              <p>
                Cảm ơn bạn đã ghé thăm NetTruyenViet. Để liên lạc với chúng tôi hoặc để biết thêm thông tin, hãy truy cập trang web chính thức của chúng tôi: NetTruyenViet.com hoặc liên hệ với chung tôi theo địa chỉ này.
              </p>
              <p>
                Chúng tôi luôn sẵn sàng tiếp nhận và xử lý các thông tin của bạn một cách nhanh chóng và hiệu quả.
              </p>
              <p>
                Website NetTruyenViet là một địa chỉ tin cậy và hấp dẫn cho những ai yêu thích truyện tranh. Bạn có thể đọc truyện tranh online miễn phí, đa dạng thể loại và nội dung, cập nhật liên tục và nhanh chóng. Bạn cũng có thể tham gia vào một cộng đồng truyện tranh sôi nổi và giao lưu với các tác giả, biên tập viên và người dùng khác. Hãy ghé thăm và trải nghiệm website NetTruyenViet ngay hôm nay để không bỏ lỡ những truyện tranh online hay nhất. Chúng tôi xin chân thành cảm ơn và mong muốn nhận được sự ủng hộ và phản hồi từ bạn.
              </p>
            </div>
          </div>

          <div className="w-[270px] flex-shrink-0 space-y-6 mt-[-30px]">
            <HistoryTab />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};
