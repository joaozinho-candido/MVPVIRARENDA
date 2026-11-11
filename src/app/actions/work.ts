"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePaid } from "@/server/session";
import { previewMaterial, saveMaterial } from "@/server/materials";
import { createClient, updateClient, moveClient, addInteraction, completeNextAction, deleteClient, type ClientInput } from "@/server/crm";
import { addEntry, markReceived, deleteEntry } from "@/server/finance";
import { markRead, advanceChallenge } from "@/server/content";
import { fail, type ActionResult } from "@/lib/errors";
import { parseBRL } from "@/lib/format";
import type { MaterialKind, Tone, ClientStatus } from "@/db/schema";

/* Materiais */
export async function previewMaterialAction(kind: MaterialKind, tone: Tone, variant: number) {
  const u = await requirePaid();
  return previewMaterial(u.id, kind, tone, variant);
}

export async function saveMaterialAction(kind: MaterialKind, tone: Tone, variant: number, content: string, edited: boolean) {
  const u = await requirePaid();
  try {
    await saveMaterial(u.id, kind, tone, variant, content, edited);
    revalidatePath("/app", "layout");
    return { ok: true as const };
  } catch (e) {
    return fail(e);
  }
}

/* Clientes */
function clientFromForm(fd: FormData): ClientInput {
  const at = String(fd.get("nextActionAt") ?? "");
  return {
    name: String(fd.get("name") ?? ""),
    contactName: String(fd.get("contactName") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    channel: String(fd.get("channel") ?? "WhatsApp"),
    origin: String(fd.get("origin") ?? ""),
    status: (String(fd.get("status") ?? "novo") as ClientStatus) || "novo",
    firstContactAt: String(fd.get("firstContactAt") ?? "") || null,
    notes: String(fd.get("notes") ?? ""),
    nextAction: String(fd.get("nextAction") ?? ""),
    nextActionAt: at ? new Date(at.length === 16 ? `${at}:00-03:00` : at) : null,
    reminderOn: fd.get("reminderOn") === "on",
  };
}

export async function saveClientAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requirePaid();
  const id = String(fd.get("id") ?? "");
  let target: string;
  try {
    const c = id ? await updateClient(u.id, id, clientFromForm(fd)) : await createClient(u.id, clientFromForm(fd));
    target = `/app/clientes/${c.id}`;
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/app", "layout");
  redirect(target);
}

export async function moveClientAction(clientId: string, status: ClientStatus) {
  const u = await requirePaid();
  try {
    await moveClient(u.id, clientId, status);
    revalidatePath("/app/clientes");
    return { ok: true as const };
  } catch (e) {
    return fail(e);
  }
}

export async function addInteractionAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requirePaid();
  try {
    await addInteraction(u.id, String(fd.get("clientId")), String(fd.get("note") ?? ""));
    revalidatePath(`/app/clientes/${fd.get("clientId")}`);
    return { ok: true, message: "Anotado." };
  } catch (e) {
    return fail(e);
  }
}

export async function completeNextActionAction(clientId: string) {
  const u = await requirePaid();
  await completeNextAction(u.id, clientId);
  revalidatePath("/app", "layout");
}

export async function deleteClientAction(clientId: string) {
  const u = await requirePaid();
  await deleteClient(u.id, clientId);
  revalidatePath("/app", "layout");
  redirect("/app/clientes");
}

/* Financeiro */
export async function addEntryAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const u = await requirePaid();
  try {
    const cents = parseBRL(String(fd.get("amount") ?? ""));
    if (cents == null) return { ok: false, error: "Informe o valor, por exemplo 400 ou 35,90.", field: "amount" };
    await addEntry(u.id, {
      kind: String(fd.get("kind")) as "sale" | "cost" | "expense",
      description: String(fd.get("description") ?? ""),
      amountCents: cents,
      date: String(fd.get("date") ?? ""),
      received: fd.get("received") !== "no",
      clientId: String(fd.get("clientId") ?? "") || null,
    });
    revalidatePath("/app", "layout");
    return { ok: true, message: "Lançamento salvo." };
  } catch (e) {
    return fail(e);
  }
}

export async function markReceivedAction(entryId: string) {
  const u = await requirePaid();
  await markReceived(u.id, entryId);
  revalidatePath("/app/financeiro");
}

export async function deleteEntryAction(entryId: string) {
  const u = await requirePaid();
  await deleteEntry(u.id, entryId);
  revalidatePath("/app/financeiro");
}

/* Conteúdos */
export async function markReadAction(contentId: string) {
  const u = await requirePaid();
  await markRead(u.id, contentId);
  revalidatePath("/app/conteudos");
}

export async function advanceChallengeAction(contentId: string) {
  const u = await requirePaid();
  try {
    const r = await advanceChallenge(u.id, contentId);
    revalidatePath("/app", "layout");
    return { ok: true as const, ...r };
  } catch (e) {
    return fail(e);
  }
}
