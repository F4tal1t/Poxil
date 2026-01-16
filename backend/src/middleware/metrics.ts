import { Request, Response, NextFunction } from "express";
import { httpRequestDuration, httpRequestTotal } from "../config/metrics.js";

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
};
