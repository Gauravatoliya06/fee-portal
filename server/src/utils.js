export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
