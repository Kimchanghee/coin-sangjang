import { enCopy } from "./en";
import { LandingCopy } from "./types";

export const zhCnCopy: LandingCopy = {
  ...enCopy,
  heroTitle: "秒级捕捉韩国上新公告，快速进入海外期货市场",
  heroSubtitle:
    "Coin-Sangjang 实时监控 Upbit 和 Bithumb 公告，并在 Binance、Bybit、OKX、Gate.io 与 Bitget 上自动开仓。",
  ctaLabel: "从测试网开始",
  tradeForm: {
    ...enCopy.tradeForm,
    sectionTitle: "交易参数设置",
    leverageLabel: "杠杆倍率",
    leverageHelper: "请留意各交易所的最大杠杆限制。",
    sizeLabel: "每次信号投入USDT",
    sizeHelper: "上新信号触发时将投入的金额。",
    tpLabel: "止盈比例(%)",
    slLabel: "止损比例(%)",
    exchangeSelector: "目标交易所",
    testnetToggle: "使用测试网",
    autoTradeToggle: "上新时自动开仓",
    submitLabel: "保存设置",
    savedMessage: "设置已成功保存。",
    errorMessage: "保存失败，请稍后重试。",
  },
  admin: {
    ...enCopy.admin,
    requestTitle: "申请管理员审批",
    requestDescription: "填写 UID 和交易所后，管理员会将您加入白名单。",
    uidLabel: "UID",
    exchangeLabel: "交易所",
    note: "审批完成前无法使用仪表盘与自动交易功能。",
    submit: "提交申请",
    pendingNotice: "等待管理员审核...",
    successNotice: "申请已提交。",
    errorNotice: "提交失败，请稍后再试。",
  },
};
