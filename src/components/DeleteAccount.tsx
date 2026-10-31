"use client";
import { useState } from "react";
import { deleteAccount, useSession } from "@/lib/account";
import { demoMode } from "@/lib/store";
import { useI18n } from "@/lib/i18n/client";
import { errorText } from "@/lib/i18n/config";

// The "Delete my account" button on /privacy. Works for anyone with a session, anonymous
// voters included: their random account and list go too.
export default function DeleteAccount() {
  const { session, ready } = useSession();
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  if (demoMode || !ready) return null;
  if (state === "done") return <p className="font-semibold text-emerald-300">{t("account.deleted")}</p>;
  if (!session) return <p className="text-neutral-400">{t("account.deleteSignIn")}</p>;

  async function remove() {
    if (!window.confirm(t("account.deleteConfirm"))) return;
    setError("");
    setState("busy");
    try {
      await deleteAccount();
      setState("done");
    } catch (e) {
      setError(errorText(e, t, "account.deleteFailed"));
      setState("idle");
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={remove}
        disabled={state === "busy"}
        className="rounded-lg border border-red-500/60 px-4 py-2 font-semibold text-red-300 hover:bg-red-950 disabled:opacity-50"
      >
        {state === "busy" ? t("account.deleting") : t("account.delete")}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
