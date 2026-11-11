import { requireUser } from "@/server/session";
import { getProfile } from "@/server/profile";
import { Quiz } from "@/components/quiz";

export const metadata = { title: "Questionário de talentos" };

export default async function Page() {
  const u = await requireUser();
  const p = await getProfile(u.id);
  return (
    <div className="py-4">
      <Quiz mode="app" initial={p?.answers ?? null} />
    </div>
  );
}
