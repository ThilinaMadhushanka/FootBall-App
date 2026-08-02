import React, { useState } from "react";

export interface NegotiationOffer {
  id: number;
  transfer_fee: number;
  salary_per_season: number;
  signing_bonus: number;
  contract_months: number;
  player?: { full_name?: string };
  from_team?: { name?: string };
}

interface Props {
  offer: NegotiationOffer;
  actor: "manager" | "player";
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

const ContractCounterModal: React.FC<Props> = ({
  offer,
  actor,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    transfer_fee: String(offer.transfer_fee),
    salary_per_season: String(offer.salary_per_season),
    signing_bonus: String(offer.signing_bonus),
    contract_months: String(offer.contract_months),
    expiry_days: "7",
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const months = Number(form.contract_months);
    const salary = Number(form.salary_per_season);
    const fee = Number(form.transfer_fee);
    const bonus = Number(form.signing_bonus);
    if (months < 6 || months > 60 || salary <= 0 || fee < 0 || bonus < 0) {
      setError(
        "Enter valid amounts and a contract length between 6 and 60 months.",
      );
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        action: "counter",
        transfer_fee: fee,
        salary_per_season: salary,
        signing_bonus: bonus,
        contract_months: months,
        expiry_days: Number(form.expiry_days),
        message:
          form.message ||
          `${actor === "player" ? "Player" : "Manager"} counter offer`,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not send counter offer.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4"
      onClick={() => !saving && onClose()}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Counter offer
            </p>
            <h2 className="text-2xl font-black">
              {actor === "player"
                ? offer.from_team?.name
                : offer.player?.full_name}
            </h2>
          </div>
          <button
            disabled={saving}
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400"
          >
            ×
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="auth-label">Transfer fee</span>
            <input
              disabled={actor === "player"}
              min="0"
              type="number"
              className="auth-input disabled:bg-slate-100"
              value={form.transfer_fee}
              onChange={(e) =>
                setForm({ ...form, transfer_fee: e.target.value })
              }
            />
          </label>
          <label>
            <span className="auth-label">Salary per season</span>
            <input
              required
              min="1"
              type="number"
              className="auth-input"
              value={form.salary_per_season}
              onChange={(e) =>
                setForm({ ...form, salary_per_season: e.target.value })
              }
            />
          </label>
          <label>
            <span className="auth-label">Signing bonus</span>
            <input
              required
              min="0"
              type="number"
              className="auth-input"
              value={form.signing_bonus}
              onChange={(e) =>
                setForm({ ...form, signing_bonus: e.target.value })
              }
            />
          </label>
          <label>
            <span className="auth-label">Contract length</span>
            <select
              className="auth-input"
              value={form.contract_months}
              onChange={(e) =>
                setForm({ ...form, contract_months: e.target.value })
              }
            >
              {[6, 12, 24, 36, 48, 60].map((months) => (
                <option key={months} value={months}>
                  {months === 6
                    ? "6 months"
                    : `${months / 12} year${months > 12 ? "s" : ""}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="auth-label">Valid for</span>
            <select
              className="auth-input"
              value={form.expiry_days}
              onChange={(e) =>
                setForm({ ...form, expiry_days: e.target.value })
              }
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="auth-label">Message</span>
            <textarea
              rows={3}
              className="auth-input"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-3 font-bold"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {saving ? "Sending..." : "Send counter offer"}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ContractCounterModal;
