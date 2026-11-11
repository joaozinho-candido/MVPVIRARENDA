import { Quiz } from "@/components/quiz";

export const metadata = { title: "Descobrir meus talentos" };

export default function QuizPage() {
  return (
    <section className="px-4 py-10 sm:py-14">
      <Quiz mode="public" />
    </section>
  );
}
