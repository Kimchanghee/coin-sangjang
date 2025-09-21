import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getLandingPage(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Coin Sangjang API</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.6;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: radial-gradient(circle at top, rgba(54, 83, 203, 0.12), transparent 55%),
          radial-gradient(circle at bottom, rgba(20, 40, 80, 0.2), transparent 60%),
          #0b1220;
        color: rgba(255, 255, 255, 0.92);
      }

      main {
        width: min(720px, 100%);
        border-radius: 20px;
        padding: 32px;
        background: rgba(7, 12, 24, 0.7);
        box-shadow: 0 24px 80px rgba(5, 10, 20, 0.45);
        backdrop-filter: blur(10px);
      }

      h1 {
        font-size: clamp(2rem, 3vw, 2.75rem);
        margin-bottom: 0.75em;
        letter-spacing: -0.03em;
      }

      p {
        margin: 0 0 1.25em;
        font-size: 1.05rem;
        color: rgba(229, 231, 235, 0.88);
      }

      a {
        color: #7c9fff;
        text-decoration: none;
        font-weight: 600;
      }

      a:hover {
        text-decoration: underline;
      }

      ul {
        padding-left: 1.2rem;
        margin: 1.5em 0 1em;
      }

      li {
        margin: 0.35em 0;
      }

      code {
        font-size: 0.95em;
        padding: 0.2em 0.45em;
        border-radius: 0.4em;
        background: rgba(118, 136, 167, 0.18);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>🚀 Coin Sangjang backend is live</h1>
      <p>
        You're looking at the backend service that powers Coin Sangjang. The REST API is
        available under the <code>/api</code> prefix. If you're searching for the marketing
        site, deploy the Next.js frontend or point your DNS to that service.
      </p>
      <p>Here are a few useful endpoints (available when persistence modules are configured):</p>
      <ul>
        <li><code>/api/listings/recent</code> &ndash; live and historical listing data</li>
        <li><code>/api/exchanges</code> &ndash; manage connected exchange accounts</li>
        <li><code>/api/auth/login</code> &ndash; obtain JWTs for authenticated requests</li>
      </ul>
      <p>
        Refer to the project README for detailed setup instructions, or connect your frontend
        client to these endpoints to start building.
      </p>
    </main>
  </body>
</html>`;
  }
}
