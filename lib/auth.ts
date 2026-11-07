import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET
);

export async function sessionErstellen(
  benutzerId: number,
  organisationId: number,
  rolle: string
) {
const token = await new SignJWT({
  benutzerId,
  organisationId,
  rolle,
})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function sessionLesen() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
export async function sessionErfordern() {

    const session = await sessionLesen();


    if (!session) {
        redirect("/login");
    }

    return session;
}
export async function sessionLoeschen() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}