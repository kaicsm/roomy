import { eq } from "drizzle-orm";
import { db } from "../../infra/database/postgres.config";
import { usersTable } from "../../infra/database/schema";

type User = {
  id: string;
  username: string;
  email: string;
  password: string;
};

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

    return user;
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
}
