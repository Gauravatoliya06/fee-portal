import 'dotenv/config';
import { app } from './app.js';
import { connectDB } from './db.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing. Copy .env.example to .env and fill it in.');
const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => { console.error(err.message); process.exit(1); });
