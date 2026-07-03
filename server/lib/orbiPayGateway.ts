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

  const timeoutMs = Number(process.env.ORBI_PAY_GATEWAY_TIMEOUT_MS || 12000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      method: options.method || "GET",
      headers: {
        "content-type": "application/json",
        "x-orbi-pay-service-key": serviceKey,
        "x-orbi-app-id": process.env.ORBI_CORE_APP_ID || "orbi-shop",
        "x-orbi-app-origin": process.env.ORBI_CORE_APP_ORIGIN || "https://shop.orbifinancial.com",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error: any) {
    const message = error?.name === "AbortError"
      ? `ORBI Pay Gateway timed out after ${timeoutMs}ms`
      : error?.message || "ORBI Pay Gateway is unreachable";
    const gatewayError = new Error(message);
    (gatewayError as any).status = error?.name === "AbortError" ? 504 : 502;
    (gatewayError as any).code = error?.name === "AbortError" ? "ORBI_PAY_GATEWAY_TIMEOUT" : "ORBI_PAY_GATEWAY_UNREACHABLE";
    (gatewayError as any).details = { gateway: baseUrl, path, timeoutMs, retryable: true };
    throw gatewayError;
  } finally {
    clearTimeout(timeout);
  }

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
    (error as any).code = response.status === 504
      ? "ORBI_PAY_GATEWAY_TIMEOUT"
      : response.status >= 500
        ? "ORBI_PAY_GATEWAY_UPSTREAM_ERROR"
        : "ORBI_PAY_GATEWAY_DECLINED";
    (error as any).details = data;
    throw error;
  }

  return data;
}

export function getPaySafeHoldMinutes() {
  return Number(process.env.ORBI_CORE_PAYSAFE_HOLD_MINUTES || process.env.ORBI_PAYSAFE_HOLD_MINUTES || 1440);
}
