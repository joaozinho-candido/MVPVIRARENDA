import { requirePaid } from "@/server/session";
import { listMaterials, previewMaterial, MATERIAL_KINDS, TONES } from "@/server/materials";
import { PageTitle } from "@/components/ui";
import { MaterialsEditor } from "@/components/app/materials-editor";
import type { MaterialKind } from "@/db/schema";

export const metadata = { title: "Materiais de venda" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sp = await searchParams;
  const u = await requirePaid("/app/materiais");
  const saved = await listMaterials(u.id);
  const initialKind = (MATERIAL_KINDS.find((k) => k.kind === sp.tipo)?.kind ?? "whatsapp") as MaterialKind;
  const s = saved.find((x) => x.kind === initialKind);
  const initial = s ? s.content : await previewMaterial(u.id, initialKind, "simpatico", 0);
  return (
    <div>
      <PageTitle eyebrow="Lia · materiais de venda" title="Textos prontos a partir das respostas da jornada" />
      <MaterialsEditor
        kinds={MATERIAL_KINDS}
        tones={TONES}
        initialKind={initialKind}
        initial={initial}
        saved={saved.map((m) => ({ kind: m.kind, tone: m.tone, variant: m.variant, content: m.content, edited: m.edited }))}
      />
    </div>
  );
}
