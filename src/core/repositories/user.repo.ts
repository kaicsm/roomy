import { eq, inArray } from "drizzle-orm";
import { db } from "../../infra/database/postgres.config";
import { usersTable } from "../../infra/database/schema";
import { type User } from "../domain/user.types";

export class UserRepository {
  async create(data: {
    username: string;
    password: string;
    email: string;
  }): Promise<User> {
    const [user] = await db
      .insert(usersTable)
      .values({
        username: data.username,
        email: data.email,
        password: data.password,
      })
      .returning();

    return user!;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    return user || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    return user || null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const users = await db
      .select()
      .from(usersTable)
      .where(inArray(usersTable.id, ids));

    return users;
  }
}
