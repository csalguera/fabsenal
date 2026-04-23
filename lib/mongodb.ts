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

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your environment variables.",
    );
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

export async function getCardsCollection() {
  const clientPromise = getClientPromise();
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName).collection("cards");
}
