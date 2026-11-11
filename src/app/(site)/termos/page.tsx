import { LegalDocPage } from "@/components/legal-doc";
export const metadata = { title: "Termos de uso" };
export const dynamic = "force-dynamic";
export default function Page() {
  return <LegalDocPage kind="terms" />;
}
