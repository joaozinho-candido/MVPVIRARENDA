"use server";

/** Ação mínima: se ela responder, os formulários (Server Actions) estão funcionando neste endereço. */
export async function pingAction() {
  return { ok: true, at: new Date().toISOString() };
}
