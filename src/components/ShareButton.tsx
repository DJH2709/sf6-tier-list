"use client";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { BTN_MD, BTN_SECONDARY } from "./ui";

export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();

  async function share() {
    // Phones get the native share sheet; desktops copy the link.
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or blocked: fall back to copying.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} className={`${BTN_SECONDARY} ${BTN_MD}`}>
      {t(copied ? "share.copied" : "share.button")}
    </button>
  );
}
