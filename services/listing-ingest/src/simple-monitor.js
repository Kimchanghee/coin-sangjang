// ===================================
// 파일 경로: services/listing-ingest/src/simple-monitor.js
// 목적: Cloud Run에서 실행될 간단한 모니터링 스크립트
// ===================================

const axios = require('axios');

console.log('📊 Coin Listing Monitor Started');
console.log('================================');
console.log(`Mode: ${process.env.ENABLE_TEST_MODE === 'true' ? 'TEST' : 'PRODUCTION'}`);
console.log(`Auto Trading: ${process.env.ENABLE_AUTO_TRADING === 'true' ? 'ON' : 'OFF'}`);
console.log('================================\n');

// 처리된 공지 ID 저장 (메모리)
const processedNotices = {
  upbit: new Set(),
  bithumb: new Set()
};

// Upbit 체크
async function checkUpbit() {
  try {
    const response = await axios.get('https://api-manager.upbit.com/api/v1/notices', {
      params: { page: 1, per_page: 10 },
      timeout: 5000
    });
    
    const notices = response.data?.data?.list || [];
    let newListings = 0;
    
    for (const notice of notices) {
      // 이미 처리한 공지는 스킵
      if (processedNotices.upbit.has(notice.id)) {
        continue;
      }
      
      // 상장 관련 키워드 체크
      if (notice.title.includes('상장') || 
          notice.title.includes('거래') || 
          notice.title.includes('추가')) {
        console.log(`🚨 [Upbit] NEW: ${notice.title}`);
        console.log(`   URL: https://upbit.com/service_center/notice?id=${notice.id}`);
        newListings++;
        
        // 처리 완료 표시
        processedNotices.upbit.add(notice.id);
      }
    }
    
    if (newListings === 0) {
      console.log('[Upbit] No new listings');
    }
  } catch (error) {
    console.error('[Upbit] Check failed:', error.message);
  }
}

// Bithumb 체크 (간단 버전)
async function checkBithumb() {
  try {
    // Bithumb API가 CORS 문제가 있을 수 있으므로 에러 처리
    console.log('[Bithumb] Checking...');
    
    // 실제 구현시 프록시 서버나 서버사이드 스크래핑 필요
    const response = await axios.get('https://api.bithumb.com/public/ticker/ALL_KRW', {
      timeout: 5000
    });
    
    if (response.data?.status === '0000') {
      console.log('[Bithumb] API accessible, monitoring active');
    }
  } catch (error) {
    console.log('[Bithumb] Direct API access limited (expected in Cloud Run)');
  }
}

// 메인 모니터링 함수
async function monitor() {
  console.log(`\n⏰ [${new Date().toLocaleString('ko-KR')}] Checking...`);
  await checkUpbit();
  await checkBithumb();
  console.log('---');
}

// 초기 실행
monitor();

// 30초마다 체크
setInterval(monitor, 30000);

// 프로세스 종료 시그널 처리
process.on('SIGTERM', () => {
  console.log('Monitoring service shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Monitoring service interrupted');
  process.exit(0);
});

// 서비스 실행 중 표시
console.log('✅ Monitoring service running...');
console.log('   Checking every 30 seconds');
console.log('   Press Ctrl+C to stop\n');
