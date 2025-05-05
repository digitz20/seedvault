import { MongoClient, Db, Collection } from 'mongodb';
import type { User, SeedPhraseData } from '@/lib/definitions';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'seedvault'; // Default db name

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let client: MongoClient;
let db: Db;

// Use a global variable to maintain the connection across hot reloads in development
// See: https://github.com/vercel/next.js/blob/canary/examples/with-mongodb/lib/mongodb.js
declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

async function connectToDatabase(): Promise<Db> {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri!);
      global._mongoClientPromise = client.connect();
    }
    client = await global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri!);
    await client.connect();
  }
  db = client.db(dbName);
  return db;
}

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }
  return await connectToDatabase();
}

// Convenience function to get collections
export async function getUsersCollection(): Promise<Collection<Omit<User, 'id'> & { _id: string }>> {
  const database = await getDb();
  // MongoDB uses _id, so we map User to the DB structure
  return database.collection<Omit<User, 'id'> & { _id: string }>('users');
}

export async function getSeedPhrasesCollection(): Promise<Collection<SeedPhraseData>> {
  const database = await getDb();
  return database.collection<SeedPhraseData>('seedPhrases');
}

// Close connection when app shuts down (optional, depends on deployment)
// process.on('SIGINT', async () => {
//   if (client) {
//     await client.close();
//     console.log('MongoDB connection closed.');
//   }
//   process.exit(0);
// });
