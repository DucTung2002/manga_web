import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HistoryTab } from "@/components/layout/HistoryTab";
import { Helmet } from 'react-helmet-async';

export const Contact = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        Liên hệ
      </Helmet>
      <Header />
      <Navbar />

      <section className="max-w-screen-xl mx-auto px-4 pb-2 pt-10 text-gray-800 leading-relaxed flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-10">
          Liên hệ
        </h1>

          <div className="space-y-4">
            <p>
              Xin chào quý khách hàng và độc giả của website truyện tranh NetTruyen.
              Đây là nơi chúng tôi giới thiệu về website, cách liên hệ với chúng tôi
              và lý do tại sao bạn nên gửi liên hệ cho chúng tôi.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-gray-700">Lịch sử NetTruyenViet</h2>
            <p>
              Website truyện tranh NetTruyenViet là một website chuyên cung cấp các truyện tranh online miễn phí,
              đa dạng thể loại, cập nhật liên tục và có chất lượng cao. Website được thành lập vào năm 2013 bởi một nhóm
              những người yêu thích truyện tranh và muốn chia sẻ niềm đam mê này với mọi người.
            </p>
            <p>
              Đội ngũ của chúng tôi gồm có các biên tập viên, dịch giả, uploaders, designers và IT support,
              đều là những người có kinh nghiệm và nhiệt huyết trong lĩnh vực truyện tranh.
            </p>
            <p>
              Từ khi ra mắt đến nay, website đã thu hút được hàng triệu lượt truy cập mỗi tháng, có hơn 10.000 truyện tranh,
              và hơn 100.000 bình luận từ độc giả. Tuy nhiên, chúng tôi cũng đã gặp phải không ít khó khăn như vi phạm bản quyền,
              lỗi kỹ thuật, spam, hack và cạnh tranh không lành mạnh.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-gray-700">Kênh liên hệ chính - Khiếu nại bản quyền</h2>
            <p>
              Nếu bạn muốn liên hệ với NetTruyenViet về vấn đề bản quyền, bạn có thể liên hệ qua Kênh Facebook chính thức
              hoặc email:{" "}
              <a href="mailto:tungct2k2@gmail.com" className="text-blue-600 hover:underline">
                tungct2k2@gmail.com
              </a>. Chúng tôi sẽ xác nhận và gỡ bỏ truyện vi phạm trong vòng 72h.
            </p>
            <p>
              Chúng tôi luôn quan tâm và lắng nghe ý kiến, góp ý, phản hồi và yêu cầu của khách hàng và độc giả.
              Bạn có thể gửi liên hệ cho chúng tôi khi bạn có thắc mắc, khiếu nại, đề xuất hợp tác hoặc muốn đóng góp cho website.
            </p>
            <p>
              Chúng tôi xin chân thành cảm ơn khách hàng và độc giả đã ủng hộ và tin tưởng vào NetTruyenViet.
              Chúc bạn có những giây phút đọc truyện vui vẻ và thư giãn.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[270px] flex-shrink-0 space-y-6 mt-[-30px]">
          <HistoryTab />
        </div>
      </section>

      <Footer />
    </>
  );
};
