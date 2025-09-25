export interface HealthPayload {
  status: "healthy";
  service: string;
  timestamp: string;
}

export function buildHealthPayload(): HealthPayload {
  return {
    status: "healthy",
    service: "coin-sangjang",
    timestamp: new Date().toISOString(),
  };
}
