import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { CookieBanner } from "@/components/site/cookie-banner";
import { getSessionUser } from "@/server/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <>
      <SiteHeader loggedIn={!!user} />
      <main>{children}</main>
      <SiteFooter />
      <CookieBanner />
    </>
  );
}
