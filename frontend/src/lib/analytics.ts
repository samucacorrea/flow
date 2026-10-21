"use client";

type DataLayerEvent = Record<string, unknown> & { event: string };

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

function ensureDataLayer() {
  if (typeof window === "undefined") return;
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
}

export function pushDataLayer(event: DataLayerEvent) {
  if (typeof window === "undefined") return;
  ensureDataLayer();
  if (process.env.NODE_ENV === "development") {
    console.debug("[dataLayer]", event);
  }
  window.dataLayer?.push({
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export function trackPageView(path: string) {
  pushDataLayer({
    event: "page_view",
    page_location: window.location.href,
    page_path: path,
  });
}

export function trackLogin(method = "password") {
  pushDataLayer({
    event: "login",
    method,
  });
}

export function trackSignUp(method = "password") {
  pushDataLayer({
    event: "sign_up",
    method,
  });
}

export function trackCreateContent(contentType: string, name?: string) {
  pushDataLayer({
    event: "create_content",
    content_type: contentType,
    name,
  });
}

export function trackBeginCheckout(plan: string) {
  pushDataLayer({
    event: "begin_checkout",
    items: [
      {
        item_name: plan,
        item_category: "subscription",
        item_variant: plan,
        quantity: 1,
      },
    ],
  });
}

export function trackPurchase(plan: string) {
  pushDataLayer({
    event: "purchase",
    items: [
      {
        item_name: plan,
        item_category: "subscription",
        item_variant: plan,
        quantity: 1,
      },
    ],
  });
}

export function trackViewItem(plan: string) {
  pushDataLayer({
    event: "view_item",
    items: [
      {
        item_name: plan,
        item_category: "subscription",
        item_variant: plan,
        quantity: 1,
      },
    ],
  });
}
