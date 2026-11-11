import { LegalDocPage } from "@/components/legal-doc";
export const metadata = { title: "Cookies" };
export const dynamic = "force-dynamic";
export default function Page() {
  return <LegalDocPage kind="cookies" />;
}
