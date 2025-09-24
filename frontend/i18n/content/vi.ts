import { enCopy } from "./en";
import { LandingCopy } from "./types";

export const viCopy: LandingCopy = {
  ...enCopy,
  heroTitle:
    "Bắt kịp thông báo niêm yết Hàn Quốc và vào lệnh phái sinh toàn cầu chỉ trong vài giây",
  heroSubtitle:
    "Coin-Sangjang theo dõi thông báo của Upbit và Bithumb theo thời gian thực và tự động mở vị thế trên Binance, Bybit, OKX, Gate.io và Bitget.",
  ctaLabel: "Bắt đầu với Testnet",
  tradeForm: {
    ...enCopy.tradeForm,
    sectionTitle: "Thiết lập giao dịch",
    leverageLabel: "Đòn bẩy",
    leverageHelper: "Vui lòng tuân theo giới hạn của từng sàn giao dịch.",
    sizeLabel: "USDT cho mỗi tín hiệu",
    sizeHelper: "Số tiền sử dụng khi phát hiện tín hiệu niêm yết mới.",
    tpLabel: "Chốt lời (%)",
    slLabel: "Cắt lỗ (%)",
    exchangeSelector: "Sàn giao dịch mục tiêu",
    testnetToggle: "Sử dụng testnet",
    autoTradeToggle: "Tự động vào lệnh khi niêm yết",
    submitLabel: "Lưu cài đặt",
    savedMessage: "Đã lưu cài đặt thành công.",
    errorMessage: "Lưu cài đặt thất bại, vui lòng thử lại.",
  },
  admin: {
    ...enCopy.admin,
    requestTitle: "Yêu cầu quản trị viên phê duyệt",
    requestDescription:
      "Nhập UID và chọn sàn để quản trị viên thêm bạn vào danh sách cho phép.",
    uidLabel: "UID",
    exchangeLabel: "Sàn giao dịch",
    note: "Chưa được phê duyệt sẽ không thể sử dụng bảng điều khiển và auto-trade.",
    submit: "Gửi yêu cầu",
    pendingNotice: "Đang chờ quản trị viên phê duyệt...",
    successNotice: "Đã gửi yêu cầu thành công.",
    errorNotice: "Gửi yêu cầu thất bại, vui lòng thử lại.",
  },
};
