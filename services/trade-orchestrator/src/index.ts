import { Queue, Worker } from "bullmq";
import { config as loadEnv } from "dotenv";
import Pino from "pino";

loadEnv();

const logger = Pino({ name: "trade-orchestrator" });
const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const queueName = process.env.TRADE_QUEUE ?? "trade-jobs";

const queue = new Queue(queueName, { connection: { url: redisUrl } });

void queue.add(
  "bootstrap",
  {
    symbol: "MOCKUSDT",
    leverage: 10,
    exchanges: ["BINANCE"],
  },
  { removeOnComplete: true, jobId: "bootstrap" },
);

const worker = new Worker(
  queueName,
  async (job) => {
    logger.warn({ job: job.data }, "trade execution worker not yet implemented");
    // TODO: call backend execution API once exchange adapters are ready
  },
  { connection: { url: redisUrl } },
);

worker.on("completed", (job) => logger.info({ jobId: job.id }, "trade job completed"));
worker.on("failed", (job, err) => logger.error({ jobId: job?.id, err }, "trade job failed"));
