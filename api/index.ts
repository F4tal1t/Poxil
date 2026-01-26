import { app } from '../backend/src/server';

// Vercel Serverless Function handler
export default function handler(req: any, res: any) {
  // Pass the request to the Express app
  return app(req, res);
}