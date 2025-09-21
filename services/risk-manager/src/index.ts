import { config as loadEnv } from "dotenv";
import Pino from "pino";

loadEnv();

const logger = Pino({ name: "risk-manager" });

logger.info(
  {
    leverageCap: process.env.RISK_MAX_LEVERAGE ?? 20,
    maxNotional: process.env.RISK_MAX_NOTIONAL ?? 5000,
  },
  "risk manager initialized (placeholder)",
);

// TODO: consume trade events and enforce TP/SL rules once trading pipeline is wired
