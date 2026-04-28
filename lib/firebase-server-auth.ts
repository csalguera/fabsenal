type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string;
    email?: string;
  }>;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  isAdmin: boolean;
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, value] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return null;
  }

  return value;
}

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function lookupFirebaseUser(idToken: string) {
  const apiKey =
    process.env.FIREBASE_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as FirebaseLookupResponse;
  const user = payload.users?.[0];

  if (!user?.localId) {
    return null;
  }

  return {
    uid: user.localId,
    email: user.email ?? null,
  };
}

export async function getAuthUserFromRequest(request: Request) {
  const idToken = getBearerToken(request);
  if (!idToken) {
    return null;
  }

  const firebaseUser = await lookupFirebaseUser(idToken);
  if (!firebaseUser) {
    return null;
  }

  const adminEmails = getAdminEmails();
  const normalizedEmail = firebaseUser.email?.toLowerCase() ?? "";

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    isAdmin: Boolean(normalizedEmail) && adminEmails.includes(normalizedEmail),
  } satisfies AuthUser;
}
