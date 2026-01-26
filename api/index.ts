import { app } from '../backend/src/server';

// Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  // Ensure the app initializes fully before handling request environment specific
  return app(req, res);
}