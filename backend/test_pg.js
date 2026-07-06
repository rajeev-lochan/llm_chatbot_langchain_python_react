import pg from "pg";
import fs from "fs";

const envPath = "c:/Users/rajeevl/OneDrive/Desktop/React_langchain/backend/.env";
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join("=").trim();
    env[key] = value;
  }
});

const connectionString = env.DATABASE_URL;

async function testPgConnection() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("pg Connection: SUCCESS!");
    const res = await client.query("SELECT NOW()");
    console.log("Query Result:", res.rows[0]);
  } catch (err) {
    console.error("pg Connection FAILED:", err);
  } finally {
    await client.end();
  }
}

await testPgConnection();
