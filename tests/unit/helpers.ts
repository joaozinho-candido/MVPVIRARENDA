import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, emails } from "@/db/schema";
import { registerUser } from "@/server/auth";
import { startCheckout } from "@/server/billing/subscriptions";
import type { QuizAnswers } from "@/db/schema";

let n = 0;
export function uniqueEmail(prefix = "pessoa") {
  return `${prefix}.${Date.now()}.${n++}@teste.com`;
}

export async function newUser(opts: { verified?: boolean } = {}) {
  const email = uniqueEmail();
  const u = await registerUser({ name: "Camila Rocha", email, password: "senha-segura-1", acceptTerms: true });
  if (opts.verified !== false) await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, u.id));
  return u;
}

export async function lastEmail(to: string) {
  const rows = await db.select().from(emails).where(eq(emails.to, to));
  return rows.at(-1)!;
}

export const CARD_OK = { number: "4242 4242 4242 4242", expiry: "12/30", cvv: "123", cpf: "529.982.247-25" };
export const CARD_REFUSED = { ...CARD_OK, number: "4000 0000 0000 0002" };
export const CARD_RENEW_FAILS = { ...CARD_OK, number: "4000 0000 0000 0341" };

export async function subscribedUser(card = CARD_OK, now = new Date()) {
  const u = await newUser();
  await startCheckout(u.id, { method: "card", accepted: true, card }, now);
  return u;
}

export const ANSWERS: QuizAnswers = {
  skills: ["fotos", "redes", "atendimento"],
  interests: ["beleza", "comercio"],
  helpWith: ["fotos"],
  experiences: ["vendas"],
  period: ["noite"],
  hoursPerDay: 1,
  equipment: ["celular", "internet"],
  budget: 100,
  mode: "online",
  salesComfort: "medio",
  goal: 800,
};
