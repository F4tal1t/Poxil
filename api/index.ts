import { app } from '../backend/src/server';

// Vercel Serverless Function handler
export default async function handler(req: any, res: any) {
  try {
    // Ensure the app initializes fully before handling request environment specific
    return app(req, res);
  } catch (error: any) {
    console.error("Serverless Function Crash:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}