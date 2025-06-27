import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const playersTable = pgTable("players", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 16 }).notNull(),
});
