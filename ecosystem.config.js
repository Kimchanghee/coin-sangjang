// ===================================
// 파일 위치: 프로젝트 루트 디렉토리에 생성
// 파일 경로: ./ecosystem.config.js
// 파일 타입: 새로 생성
// ===================================

module.exports = {
  apps: [
    // 1. Backend API Server
    {
      name: 'coin-backend',
      script: 'npm',
      args: 'run start:prod --workspace backend',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        WS_PORT: 3002
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },

    // 2. Frontend Next.js Server
    {
      name: 'coin-frontend',
      script: 'npm',
      args: 'run start --workspace frontend',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },

    // 3. Listing Ingest Worker (핵심 서비스)
    {
      name: 'coin-listing-worker',
      script: './services/listing-ingest/dist/main.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/listing-error.log',
      out_file: './logs/listing-out.log',
      log_file: './logs/listing-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 10000,
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000
    }
  ]
};
