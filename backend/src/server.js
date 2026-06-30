import dotenv from "dotenv";

dotenv.config();

import app from "./app.js";
import { ensureSchema } from "./utils/ensureSchema.js";

const port = process.env.PORT || 3001;

app.listen(port, async () => {
  try {
    await ensureSchema();

    console.log(
      `Chat history API running on http://localhost:${port}`
    );
  } catch (error) {
    console.error(
      "Failed to prepare chat history schema:",
      error
    );

    process.exitCode = 1;
  }
});