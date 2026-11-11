/** Erro com mensagem amigável que pode ser mostrada para a pessoa. */
export class UserError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "UserError";
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; field?: string };

export function fail(e: unknown): { ok: false; error: string; field?: string } {
  if (e instanceof UserError) return { ok: false, error: e.message, field: e.field };
  console.error(e);
  return { ok: false, error: "Algo não saiu como esperado. Tente de novo em instantes." };
}
