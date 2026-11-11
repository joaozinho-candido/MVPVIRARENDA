"use client";
import { useEffect } from "react";

/** Depois que o perfil foi salvo na conta, o rascunho local do questionário não é mais necessário. */
export function ClearQuizDraft() {
  useEffect(() => {
    try {
      localStorage.removeItem("vr_quiz_draft");
    } catch {}
  }, []);
  return null;
}
