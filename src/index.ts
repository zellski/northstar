import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { playersTable } from "./db/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function main() {
  const users = await db.select().from(playersTable);
  if (users.length === 0) {
    console.log("No users found in the database.");
    return;
  }
  const user = users[0]!;
  console.log(`Fetched primary (test) user: ${user.name}`);
}

main();
