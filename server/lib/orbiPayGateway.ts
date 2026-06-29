type PayGatewayRequestOptions = {
  method?: string;
  body?: Record<string, unknown>;
  serviceKey?: string;
};

export function getOrbiPayGatewayBaseUrl() {
  return (process.env.ORBI_PAY_GATEWAY_BASE_URL || process.env.ORBI_PAY_GATEWAY_URL || "").replace(/\/$/, "");
}

export function requireOrbiPayGatewayBaseUrl() {
  const baseUrl = getOrbiPayGatewayBaseUrl();
  if (!baseUrl) {
    throw new Error("ORBI_PAY_GATEWAY_BASE_URL is required for live ORBI Shop payment integration.");
  }
  return baseUrl;
}

export function getPayServiceKey(req?: any) {
  const incomingServiceKey =
    req?.headers?.["x-orbi-pay-service-key"] ||
    req?.headers?.["x-api-key"] ||
    "";
  return String(
    incomingServiceKey ||
      process.env.ORBI_SHOP_PAY_API_KEY ||
      process.env.ORBI_PAY_SERVICE_API_KEY ||
      "",
  ).trim();
}

export async function callOrbiPayGateway(path: string, options: PayGatewayRequestOptions = {}) {
  const baseUrl = requireOrbiPayGatewayBaseUrl();
  const serviceKey = options.serviceKey || getPayServiceKey();
  if (!serviceKey) {
    throw new Error("ORBI Shop Pay Gateway service key is required. Set ORBI_SHOP_PAY_API_KEY.");
  }

  const response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
    method: options.method || "GET",
    headers: {
      "content-type": "application/json",
      "x-orbi-pay-service-key": serviceKey,
      "x-orbi-app-id": process.env.ORBI_CORE_APP_ID || "orbi-shop",
      "x-orbi-app-origin": process.env.ORBI_CORE_APP_ORIGIN || "https://shop.orbifinancial.com",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `ORBI Pay Gateway request failed with HTTP ${response.status}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data;
}

export function getPaySafeHoldMinutes() {
  return Number(process.env.ORBI_CORE_PAYSAFE_HOLD_MINUTES || process.env.ORBI_PAYSAFE_HOLD_MINUTES || 1440);
}
