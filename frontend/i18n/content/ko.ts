import { LandingCopy } from "./types";

export const koCopy: LandingCopy = {
  heroTitle: "한국 상장 공지를 포착하고 몇 초 만에 해외 선물 포지션 진입",
  heroSubtitle:
    "코인상장은 업비트와 빗썸 공지를 실시간으로 모니터링하고, 바이낸스·바이비트·OKX·게이트·비트겟 선물 시장에 자동으로 진입합니다.",
  ctaLabel: "테스트넷으로 시작하기",
  banner: {
    title: "프로모션 배너 영역",
    subtitle: "제휴 광고나 공지 배너를 언어/디바이스별로 노출하는 영역입니다.",
    cta: "배너 관리",
  },
  featuresTitle: "핵심 기능",
  features: [
    {
      id: 1,
      title: "실시간 상장 공지 수집",
      description: "업비트·빗썸 웹소켓 수집기가 상장 알림을 정규화해 즉시 거래 파이프로 전달합니다.",
    },
    {
      id: 2,
      title: "글로벌 선물 거래 지원",
      description: "바이낸스, 바이비트, OKX, 게이트, 비트겟 상장 여부를 확인하고 즉시 포지션을 엽니다.",
    },
    {
      id: 3,
      title: "API 키 및 네트워크 관리",
      description: "거래소별 메인넷·테스트넷 API 키를 안전하게 저장하고 계정별 리스크 한도를 적용합니다.",
    },
    {
      id: 4,
      title: "USDT 기반 자금·레버리지",
      description: "신호 당 USDT 배분, 레버리지, 익절·손절 비율을 UI에서 직접 설정합니다.",
    },
    {
      id: 5,
      title: "관리자 승인 워크플로우",
      description: "사용자는 UID와 거래소를 선택해 가입 요청을 보내고, 관리자가 승인해야 사용 가능합니다.",
    },
    {
      id: 6,
      title: "15개 언어 지원",
      description: "언어별 페이지 파일을 별도로 관리하여 현지화된 랜딩·가이드·대시보드를 제공합니다.",
    },
  ],
  usageGuideTitle: "사용 가이드 & 소개",
  usageGuide: {
    intro: "한국 거래소 상장 공지 직후 해외 파생시장에서 급격한 가격 변동이 자주 발생합니다.",
    rationale:
      "코인상장은 상장 신호 모니터링과 진입을 자동화하여 더 빠르게 대응하면서도 리스크 통제가 가능하도록 돕습니다.",
    steps: [
      "계정을 생성하고 거래소 UID와 함께 관리자에게 승인 요청을 보냅니다.",
      "지원 거래소 API 키를 연결하고 기본 레버리지/모드를 설정합니다 (테스트넷 권장).",
      "포지션 진입 시 사용할 USDT 금액과 익절·손절 비율을 입력합니다.",
      "자동 진입을 켠 뒤 상장 알림이 도착하면 오케스트레이터가 심볼을 확인하고 즉시 포지션을 오픈합니다.",
    ],
  },
  tradeForm: {
    sectionTitle: "거래 기본 설정",
    leverageLabel: "레버리지",
    leverageHelper: "거래소별 허용 한도를 확인하세요.",
    sizeLabel: "신호 당 USDT",
    sizeHelper: "새로운 상장 신호가 발생했을 때 투입할 금액입니다.",
    tpLabel: "익절 비율(%)",
    slLabel: "손절 비율(%)",
    exchangeSelector: "연결 거래소",
    testnetToggle: "테스트넷 사용",
    autoTradeToggle: "상장 시 자동 진입",
    submitLabel: "설정 저장",
  },
  admin: {
    requestTitle: "관리자 승인 요청",
    requestDescription: "UID와 거래소를 입력하면 관리자가 화이트리스트에 등록합니다.",
    uidLabel: "UID",
    exchangeLabel: "거래소 선택",
    note: "승인 완료 전까지는 대시보드와 자동매매 기능이 제한됩니다.",
    submit: "요청 보내기",
    pendingNotice: "관리자 승인 대기 중...",
  },
  realtimeTitle: "실시간 상장 피드",
  realtimeStatusIdle: "연결을 기다리는 중...",
  realtimeStatusConnected: "상장 알림 수신 중",
  apiKeysTitle: "API 키 관리",
  apiKeysHelper: "메인넷·테스트넷 키는 비공개 비밀 저장소(Secret Manager)에 암호화되어 저장됩니다.",
};
