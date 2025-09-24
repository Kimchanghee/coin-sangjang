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
  collectors: {
    ...enCopy.collectors!,
    title: "Trạng thái thu thập niêm yết",
    description:
      "Theo dõi luồng thông báo Upbit/Bithumb và trạng thái hoạt động của bộ điều phối tự động theo thời gian thực.",
    upbitLabel: "Thông báo Upbit",
    bithumbLabel: "Thông báo Bithumb",
    orchestratorLabel: "Bộ điều phối giao dịch",
    lastSeenLabel: "Lần nhận gần nhất",
    noSignalsLabel: "Chưa có thông báo",
    idleLabel: "Chờ",
    activeLabel: "Đang nhận",
    recentSymbolsLabel: "Mã vừa phát hiện",
  },
  executionPreview: {
    ...enCopy.executionPreview!,
    title: "Kiểm tra sẵn sàng giao dịch",
    description:
      "Nhập mã để kiểm tra ngay các sàn hỗ trợ có niêm yết spot/futures hay không trước khi tự động vào lệnh.",
    placeholder: "Ví dụ: APT hoặc APTUSDT",
    buttonLabel: "Kiểm tra khả dụng",
    testnetLabel: "Testnet",
    mainnetLabel: "Mainnet",
    modeToggle: "Ưu tiên testnet",
    loadingLabel: "Đang truy vấn sàn...",
    readyLabel: "Có thể giao dịch",
    notReadyLabel: "Chưa khả dụng",
    errorLabel: "Không thể lấy thông tin chẩn đoán.",
    updatedLabel: "Thời gian kiểm tra",
    suggestionsLabel: "Mã vừa phát hiện",
  },
};