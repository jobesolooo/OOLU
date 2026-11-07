import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAddress, listAddresses, shippingCountries } from "@/lib/account";
import { AccountCard, AccountSection, AccountShell } from "@/components/auth/AccountShell";
import { AddressLines } from "@/components/account/AddressLines";
import { ConfirmSubmit } from "@/components/account/ConfirmSubmit";
import { AddressForm } from "../forms";
import { defaultAddressAction, deleteAddressAction } from "../manage";
import { getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("ac.nav.addresses"), robots: { index: false } };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const MAX = 10;

export default async function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  const user = await requireUser("/account/addresses");
  const sp = await searchParams;
  const { t, locale } = await getT();
  const list = await listAddresses(user.id);
  const editId = one(sp.edit);
  const editing = editId && /^[0-9a-f-]{36}$/i.test(editId) ? await getAddress(user.id, editId) : null;
  if (editId && !editing) notFound();
  const adding = !editing && (one(sp.new) === "1" || list.length === 0) && list.length < MAX;
  const saved = one(sp.saved);
  const btn = "text-[11px] tracking-[0.08em] uppercase underline-offset-4 hover:underline";

  return (
    <AccountShell
      user={user}
      active="addresses"
      title={t("ac.nav.addresses")}
      notice={saved ? t(`ac.addr.${saved}` as MessageKey) : null}
    >
      {(adding || editing) && (
        <AccountSection n={1} id="form" title={editing ? t("ac.editAddress") : t("ac.newAddress")} sub={t("ac.addressFormSub")}>
          <AccountCard>
            <AddressForm
              address={editing ?? { name: user.name }}
              countries={shippingCountries(locale)}
              firstOne={list.length === 0 || (Boolean(editing) && list.length === 1)}
            />
          </AccountCard>
        </AccountSection>
      )}

      {list.length > 0 && (
        <AccountSection n={adding || editing ? 2 : 1} title={t("ac.addressBook")} sub={t("ac.addressBookSub", { count: list.length, max: MAX })}>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
            {list.map((a) => (
              <li key={a.id} className={`flex flex-col justify-between gap-6 bg-white p-6 ring-1 ${a.isDefault ? "ring-2 ring-accent" : "ring-black/5"}`}>
                <div className="flex items-start justify-between gap-4">
                  <AddressLines address={a} locale={locale} />
                  {a.isDefault && <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-[10px] tracking-[0.08em] uppercase">{t("ac.default")}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/10 pt-4">
                  <Link href={`/account/addresses?edit=${a.id}#form`} className={btn}>
                    {t("ac.edit")}
                  </Link>
                  {!a.isDefault && (
                    <form action={defaultAddressAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className={btn}>{t("ac.setDefault")}</button>
                    </form>
                  )}
                  <form action={deleteAddressAction} className="ml-auto">
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmSubmit message={t("ac.deleteAddressQ")} className={`${btn} text-rose-700`}>
                      {t("ac.delete")}
                    </ConfirmSubmit>
                  </form>
                </div>
              </li>
            ))}
            {!adding && !editing && list.length < MAX && (
              <li>
                <Link
                  href="/account/addresses?new=1#form"
                  className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border border-dashed border-black/25 p-6 text-center transition-colors hover:border-ink"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-accent/30">
                    <Plus className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="font-display text-[22px] tracking-[-0.01em]">{t("ac.addAddress")}</span>
                </Link>
              </li>
            )}
          </ul>
          <p className="mt-4 text-[12px] text-ash">{t("ac.defaultNote")}</p>
        </AccountSection>
      )}
    </AccountShell>
  );
}
