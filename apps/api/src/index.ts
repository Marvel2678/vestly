import app from "./app";
import { getEnv } from "./utils/getenv";

const PORT = parseInt(getEnv("PORT") || "4000", 10);

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
