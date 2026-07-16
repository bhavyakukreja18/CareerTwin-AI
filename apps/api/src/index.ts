import dotenv from "dotenv";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

dotenv.config();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "CareerTwin API is running");
});
