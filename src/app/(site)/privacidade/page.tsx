import { LegalDocPage } from "@/components/legal-doc";
export const metadata = { title: "Política de Privacidade" };
export const dynamic = "force-dynamic";
export default function Page() {
  return <LegalDocPage kind="privacy" />;
}
