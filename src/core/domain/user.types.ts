export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
};

export type SafeUser = Omit<User, "password">;
