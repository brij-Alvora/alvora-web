export type ToastTone = "success" | "error";

export type ToastMessage = {
  id: number;
  title: string;
  tone: ToastTone;
};

const EVENT = "alvora:toast";

export function toast(title: string, tone: ToastTone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastMessage>(EVENT, {
      detail: { id: Date.now(), title, tone },
    }),
  );
}

export function subscribeToToasts(onToast: (toast: ToastMessage) => void) {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<ToastMessage>;
    if (custom.detail) onToast(custom.detail);
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
