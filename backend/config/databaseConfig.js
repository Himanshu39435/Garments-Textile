import mongoose from 'mongoose';

/** Opens the MongoDB connection. Throws if MONGODB_URI is missing or unreachable. */
export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in backend/.env');

  mongoose.set('strictQuery', true);
  const connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
  return connection;
}

/** Human-readable connection state, used by the health endpoint. */
export function getDatabaseState() {
  return ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ?? 'unknown';
}
