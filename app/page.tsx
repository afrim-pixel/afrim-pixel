import { redirect } from "next/navigation";
import { sessionErfordern } from "../lib/auth";

export default async function Home() {
  const session = await sessionErfordern();

  redirect(`/organisationen/${session.organisationId}`);
}