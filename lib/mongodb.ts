import { MongoClient, ServerApiVersion } from "mongodb";

const dbName = process.env.MONGODB_DB ?? "fabsenal";

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function normalizeMongoUri(rawUri: string) {
  const scheme = "mongodb+srv://";

  if (!rawUri.startsWith(scheme)) {
    return rawUri;
  }

  const rest = rawUri.slice(scheme.length);
  const firstSlashIndex = rest.indexOf("/");
  const authority =
    firstSlashIndex === -1 ? rest : rest.slice(0, firstSlashIndex);
  const pathAndQuery =
    firstSlashIndex === -1 ? "/" : rest.slice(firstSlashIndex);

  const atIndex = authority.lastIndexOf("@");
  if (atIndex === -1) {
    return rawUri;
  }

  const credentials = authority.slice(0, atIndex);
  let host = authority.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(":");

  if (colonIndex === -1) {
    return rawUri;
  }

  const username = credentials.slice(0, colonIndex);
  const rawPassword = credentials.slice(colonIndex + 1);

  let normalizedPassword: string;
  try {
    normalizedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
  } catch {
    normalizedPassword = encodeURIComponent(rawPassword);
  }

  if (host && !host.includes(".")) {
    host = `${host}.mongodb.net`;
  }

  return `${scheme}${username}:${normalizedPassword}@${host}${pathAndQuery}`;
}

function getClientPromise() {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL;

  if (!uri) {
    throw new Error(
      "No MongoDB connection string found. Set MONGODB_URI or DATABASE_URL.",
    );
  }

  if (!global._mongoClientPromise) {
    const normalizedUri = normalizeMongoUri(uri);
    const client = new MongoClient(normalizedUri, options);
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

export async function getCardsCollection() {
  const clientPromise = getClientPromise();
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName).collection("cards");
}
