import { app } from './app.js';
import { initDb } from './db.js';

const PORT = process.env.PORT || 3000;
await initDb();
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
