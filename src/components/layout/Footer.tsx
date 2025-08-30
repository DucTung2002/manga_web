import { useState } from "react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { Modal } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export const Footer = () => {
  const navigate = useNavigate();
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleOpenTerms = () => setIsTermsOpen(true);
  const handleCloseTerms = () => setIsTermsOpen(false);
  const handleOpenPrivacy = () => setIsPrivacyOpen(true);
  const handleClosePrivacy = () => setIsPrivacyOpen(false);

  return (
    <footer className="w-full bg-white text-gray-800 border-t mt-12 px-6 py-8">
      <div className="w-full flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
        <div className="flex-shrink-0">
          <img
            src={logo}
            alt="NetTruyen"
            className="h-10 object-contain cursor-pointer"
            onClick={() => navigate(`/`)}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-blue-600 font-medium text-base">
          <Link to="/gioi-thieu" className="text-blue-600 cursor-pointer">
            Giới Thiệu
          </Link>
          <Link to="/lien-he" className="text-blue-600 cursor-pointer">
            Liên Hệ
          </Link>
          <span onClick={handleOpenTerms} className="text-blue-600 cursor-pointer">
            Điều Khoản
          </span>
          <span onClick={handleOpenPrivacy} className="text-blue-600 cursor-pointer">
            Chính Sách Bảo Mật
          </span>
        </div>
        <div className="text-right flex-grow md:max-w-xs text-[17px] text-gray-700">
          <h3 className="font-semibold text-[20px] text-gray-500 mb-2 mr-20">Liên hệ</h3>
          <p>
            Email:{" "}
            <a href="mailto:tungct2k2@gmail.com" className="text-blue-600">
              tungct2k2@gmail.com
            </a>
          </p>
        </div>
      </div>

      <div className="text-justify text-[17px] text-gray-700 -mb-8 leading-relaxed">
        <h4 className="font-semibold text-[20px] mb-2 text-gray-500">Miễn trừ trách nhiệm</h4>
        <p>
          Trang web của chúng tôi chỉ cung cấp dịch vụ đọc truyện tranh online với mục đích giải trí và chia sẻ nội dung.
          Toàn bộ các truyện tranh được đăng tải trên trang web được sưu tầm từ nhiều nguồn trên internet và chúng tôi
          không chịu trách nhiệm về bản quyền hoặc nội dung do bất kỳ đối tượng nào. Nếu bạn là chủ sở hữu bản quyền và
          cho rằng nội dung trên trang vi phạm, vui lòng liên hệ với chúng tôi để tiến hành gỡ bỏ nội dung vi phạm một cách kịp thời.
        </p>
      </div>

      <div className="text-center text-base text-gray-500 mt-8 -mb-6 pt-4 font-medium">
        Copyright © 2025 NetTruyen
      </div>

      <Modal
        open={isTermsOpen}
        onCancel={handleCloseTerms}
        footer={null}
        closable={false}
        width={1000}
        getContainer={false}
        mask={false}
        style={{ top: 230 }}
        title={
          <div className="flex justify-between items-center -px-2">
            <span className="text-orange-600 text-[25px] font-semibold">Điều Khoản</span>
            <button
              onClick={handleCloseTerms}
              className="text-gray-500 text-lg hover:opacity-80 p-0 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <CloseOutlined />
            </button>
          </div>
        }
      >
        <div className="text-justify leading-relaxed">
          <p>
            Trang web của chúng tôi chỉ cung cấp dịch vụ đọc truyện tranh online với mục đích giải trí và chia sẻ nội dung.
            Toàn bộ các truyện tranh được đăng tải trên trang web được sưu tầm từ nhiều nguồn trên internet và chúng tôi
            không chịu trách nhiệm về bản quyền hoặc quyền sở hữu đối với bất kỳ nội dung nào. Nếu bạn là chủ sở hữu bản quyền
            và cho rằng nội dung trên trang vi phạm quyền của bạn, vui lòng liên hệ với chúng tôi để tiến hành gỡ bỏ nội dung
            vi phạm một cách kịp thời.
          </p>
          <p className="mt-4">
            Ngoài ra, chúng tôi không chịu trách nhiệm về các nội dung quảng cáo hiển thị trên trang web, bao gồm nhưng không giới hạn
            ở việc quảng cáo sản phẩm hoặc dịch vụ của bên thứ ba. Những quảng cáo này không phản ánh quan điểm hoặc cam kết của chúng tôi.
            Người dùng cần tự cân nhắc và chịu trách nhiệm khi tương tác với các quảng cáo đó.
          </p>
        </div>
      </Modal>

      <Modal
        open={isPrivacyOpen}
        onCancel={handleClosePrivacy}
        footer={null}
        closable={false}
        width={1000}
        getContainer={false}
        mask={false}
        style={{ top: 230 }}
        title={
          <div className="relative">
            <button
              onClick={handleClosePrivacy}
              className="absolute right-0 top-0 text-gray-500 text-lg hover:opacity-80 p-0 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <CloseOutlined />
            </button>
          </div>
        }
      >
        <div className="text-justify leading-relaxed">
          <span className="text-[30px] font-semibold">Chúng tôi là ai</span>
          <p className="mt-2">Địa chỉ website là: https://nettruyenvia.com, website đọc truyện tranh online.</p>
          <span className="text-[30px] mt-4 block font-semibold">Thông tin cá nhân nào bị thu thập và tại sao thu thập</span>
          <span className="text-[20px] mt-2 block font-semibold">Bình luận</span>
          <p className="mt-4">Khi khách truy cập để lại bình luận trên trang web, chúng tôi thu thập dữ liệu được hiển thị trong biểu mẫu bình luận và cũng là địa chỉ IP của người truy cập và chuỗi User Agent của người dùng trình duyệt để giúp phát hiện spam.</p>
          <p className="mt-4">Một chuỗi ẩn danh được tạo từ địa chỉ email của bạn (còn được gọi là Hash) có thể được cung cấp cho dịch vụ Gravatar để xem bạn có đang sử dụng nó hay không. Chính sách bảo mật của dịch vụ Gravatar có tại đây. Sau khi chấp nhận bình luận của bạn, ảnh tiểu sử của bạn được hiển thị công khai trong ngữ cảnh bình luận của bạn.</p>
          <span className="text-[20px] mt-4 block font-semibold">Thông tin liên hệ</span>
          <p className="mt-2">Chúng tôi không thu thập bất cứ thông tin liên hệ nào của bạn ngoại trừ tên và email dùng để bình luận.</p>
          <span className="text-[20px] mt-4 block font-semibold">Cookies</span>
          <p className="mt-2">Trang chỉ sử dụng cookies để lưu thời hạn của quảng cáo để hiển thị số lượng nhất định, thời hạn chức năng sao lưu dữ liệu và xác thực người dùng. Chúng tôi chủ yếu sử dụng Cookie và Local Storage để lưu tên và email trong bình luận, các chương truyện bạn đã xem, bấm thích, đánh giá truyện, các bình luận của bạn, danh sách truyện yêu thích và danh sách truyện theo dõi.</p>
          <span className="text-[20px] mt-4 block font-semibold">Nội dung nhúng từ website khác</span>
          <p className="mt-2">Các bài viết trên trang web này có thể bao gồm nội dung được nhúng (ví dụ: video, hình ảnh, bài viết, v.v.). Nội dung được nhúng từ các trang web khác hoạt động theo cùng một cách chính xác như khi khách truy cập đã truy cập trang web khác.</p>
          <p className="mt-2">Những website này có thể thu thập dữ liệu về bạn, sử dụng cookies, nhúng các trình theo dõi của bên thứ ba và giám sát tương tác của bạn với nội dung được nhúng đó, bao gồm theo dõi tương tác của bạn với nội dung được nhúng nếu bạn có tài khoản và đã đăng nhập vào trang web đó.</p>
          <span className="text-[20px] mt-4 block font-semibold">Phân tích</span>
          <p className="mt-2">Chúng tôi sử dụng Google Analytics để phân tích lưu lượng truy cập.</p>
          <span className="text-[30px] mt-4 block font-semibold">Chúng tôi chia sẻ dữ liệu của bạn với ai</span>
          <p className="mt-2">Chúng tôi không chia sẻ dữ liệu của bạn với bất kỳ ai.</p>
          <span className="text-[30px] mt-4 block font-semibold">Dữ liệu của bạn tồn tại bao lâu</span>
          <p className="mt-2">Nếu bạn để lại bình luận, bình luận và siêu dữ liệu của nó sẽ được giữ lại vô thời hạn. Điều này là để chúng tôi có thể tự động nhận ra và chấp nhận bất kỳ bình luận nào thay vì giữ chúng trong khu vực đợi kiểm duyệt.</p>
          <p className="mt-2">Đối với người dùng đăng ký trên trang web của chúng tôi (nếu có), chúng tôi cũng lưu trữ thông tin cá nhân mà họ cung cấp trong hồ sơ người dùng của họ. Tất cả người dùng có thể xem, chỉnh sửa hoặc xóa thông tin cá nhân của họ bất kỳ lúc nào (ngoại trừ họ không thể thay đổi tên người dùng của họ). Quản trị viên trang web cũng có thể xem và chỉnh sửa thông tin đó.</p>
          <span className="text-[30px] mt-4 block font-semibold">Các quyền nào của bạn với dữ liệu của mình</span>
          <p className="mt-2">Nếu bạn có tài khoản trên trang web này hoặc đã để lại nhận xét, bạn có thể yêu cầu nhận tệp xuất dữ liệu cá nhân mà chúng tôi lưu giữ về bạn, bao gồm mọi dữ liệu bạn đã cung cấp cho chúng tôi. Bạn cũng có thể yêu cầu chúng tôi xóa mọi dữ liệu cá nhân mà chúng tôi lưu giữ về bạn. Điều này không bao gồm bất kỳ dữ liệu nào chúng tôi có nghĩa vụ giữ cho các mục đích hành chính, pháp lý hoặc bảo mật.</p>
          <span className="text-[30px] mt-4 block font-semibold">Các dữ liệu của bạn được gửi tới đâu</span>
          <p className="mt-2">Các bình luận của khách (không phải là thành viên) có thể được kiểm tra thông qua dịch vụ tự động phát hiện spam.</p>
        </div>
      </Modal>
    </footer>
  );
};
