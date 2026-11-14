import { AlertTriangle, CheckCircle2, Circle, Inbox } from "lucide-react";
import { getBusiness } from "@/lib/business";
import { emailSetupStatus } from "@/lib/mail-setup";
import { MAILBOXES } from "@/lib/mailboxes";
import { cx } from "@/lib/format";
import { SetUpEmailButton } from "./SetUpEmailButton";

const TONE: Record<string, string> = {
  verified: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/25",
  not_started: "bg-amber-50 text-amber-800 ring-amber-600/25",
  failed: "bg-red-50 text-red-800 ring-red-600/20",
  temporary_failure: "bg-red-50 text-red-800 ring-red-600/20",
};
const STATUS_LABEL: Record<string, string> = { verified: "Verified", pending: "Waiting", not_started: "Not added yet", failed: "Not found", temporary_failure: "Retrying" };

function Step({ done, warn, children }: { done: boolean; warn?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-[13px] leading-relaxed">
      {done ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" strokeWidth={2} />
      ) : warn ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" strokeWidth={2} />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-black/25" strokeWidth={2} />
      )}
      <span className={cx(done && "text-ash")}>{children}</span>
    </li>
  );
}

/** The shop's addresses, whether mail can be sent and received, and the DNS records still to add. */
export async function EmailSetup() {
  const [b, st] = await Promise.all([getBusiness(), emailSetupStatus()]);
  const ok = st.state === "ok" ? st : null;
  const allVerified = Boolean(ok?.found && ok.records.length && ok.records.every((r) => r.status === "verified"));
  const working = Boolean(allVerified && ok?.receiving && ok.webhook && ok.webhookSecret && b.forwardTo);

  return (
    <div className="space-y-3">
      {/* The addresses */}
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
          <Inbox className="size-4" /> The shop&apos;s addresses
        </h3>
        <p className="mb-4 text-[12px] text-ash">
          Customers see these. Anything sent to them, or to any other address on @{b.emailDomain}, is forwarded to{" "}
          <strong className="text-ink">{b.forwardTo || "the inbox you set above"}</strong>. Press reply there to answer the customer.
        </p>
        <ul className="divide-y divide-black/5">
          {MAILBOXES.map((m) => (
            <li key={m.box} className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[220px_minmax(0,1fr)]">
              <span className="font-mono text-[13px] break-all">
                {m.box}@{b.emailDomain}
              </span>
              <span className="text-[12px] text-black/65">
                <span className="font-medium text-ink">{m.label}.</span> {m.sends}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Status + one-click setup */}
      <div className="bg-white p-5 ring-1 ring-black/5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
              <span className={cx("size-2 rounded-full", working ? "bg-emerald-500" : "bg-amber-500")} />
              {working ? "Email is working" : "Finish setting up email"}
            </h3>
            <p className="mt-1 text-[12px] text-ash">Sending and receiving run through Resend. The status below is checked live each time this page opens.</p>
          </div>
          <SetUpEmailButton again={Boolean(ok?.found)} />
        </div>

        {st.state === "error" && <p className="mb-4 bg-red-50 px-4 py-3 text-[12px] text-red-800 ring-1 ring-red-600/20">{st.message}</p>}

        <ol className="space-y-2">
          <Step done={st.state !== "no-key"}>
            Resend API key with Full access, under <a href="#keys-email" className="underline">Account keys → Email</a>
          </Step>
          <Step done={Boolean(b.forwardTo)}>Inbox to forward mail to, in the form above</Step>
          <Step done={Boolean(ok?.found && ok.sending && ok.receiving)}>
            {b.emailDomain} added to Resend with sending and receiving on <span className="text-ash">(press Set up email)</span>
          </Step>
          <Step done={Boolean(ok?.webhook && ok.webhookSecret)}>Incoming mail connected to this site <span className="text-ash">(press Set up email)</span></Step>
          <Step done={allVerified} warn={Boolean(ok?.found && !allVerified)}>
            DNS records added where {b.emailDomain} is registered{ok?.found && !allVerified ? ": see the list below" : ""}
          </Step>
        </ol>

        {ok?.found && ok.records.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[12px] text-black/70">
              Add these at your domain provider (the company you bought {b.emailDomain} from), under DNS settings. Copy each value exactly. Changes can take a few
              minutes to a few hours; the status updates by itself.
            </p>
            <div className="overflow-x-auto ring-1 ring-black/10">
              <table className="w-full min-w-[640px] text-left text-[12px]">
                <thead className="bg-mist text-[10px] tracking-[0.12em] text-ash uppercase">
                  <tr>
                    <th className="px-3 py-2 font-medium">For</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Name / host</th>
                    <th className="px-3 py-2 font-medium">Value</th>
                    <th className="px-3 py-2 font-medium">Priority</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-mono">
                  {ok.records.map((r, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-3 py-2 font-sans">{r.kind === "Receiving" ? "Receiving" : r.kind === "DKIM" ? "Sending (signature)" : r.kind === "SPF" ? "Sending" : r.kind}</td>
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2 break-all select-all">{r.name}</td>
                      <td className="max-w-[320px] px-3 py-2 break-all select-all">{r.value}</td>
                      <td className="px-3 py-2">{r.priority ?? ""}</td>
                      <td className="px-3 py-2 font-sans">
                        <span className={cx("rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap ring-1", TONE[r.status] ?? TONE.pending)}>{STATUS_LABEL[r.status] ?? r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-ash">
              Already use another email service on {b.emailDomain} (e.g. Google Workspace)? Then don&apos;t add the Receiving MX record: it would take over all mail for the domain.
            </p>
          </div>
        )}

        <details className="mt-5 text-[12px] text-black/70">
          <summary className="cursor-pointer font-medium text-ink">Optional: reply as hello@{b.emailDomain} from Gmail</summary>
          <p className="mt-2 leading-relaxed">
            Replies from your own inbox show your personal address. To answer as the shop, in Gmail go to Settings → Accounts → <em>Send mail as</em> → add{" "}
            <code>hello@{b.emailDomain}</code>, untick &ldquo;Treat as an alias&rdquo;, and use SMTP server <code>smtp.resend.com</code>, port <code>465</code>, username{" "}
            <code>resend</code>, and your Resend API key as the password. Gmail sends a confirmation code to hello@, which lands back in your inbox.
          </p>
        </details>
      </div>
    </div>
  );
}
