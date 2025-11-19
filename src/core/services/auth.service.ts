import { UserRepository } from "../repositories/user.repo";
import { SafeUser } from "../domain/user.types";

export class AuthService {
  private cost = 10;

  constructor(private userRepo: UserRepository) {}

  async register({
    username,
    password,
    email,
  }: {
    username: string;
    password: string;
    email: string;
  }): Promise<SafeUser> {
    const usernameExists = await this.userRepo.findByUsername(username);
    const emailExists = await this.userRepo.findByEmail(email);

    if (usernameExists) {
      throw new Error("User already exists");
    } else if (emailExists) {
      throw new Error("Email already in use");
    }

    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: this.cost,
    });

    const user = await this.userRepo.create({
      username,
      password: passwordHash,
      email,
    });

    const { password: _, ...safeUser } = user;
    return safeUser as SafeUser;
  }

  async login({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<SafeUser> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new Error("Invalid credentials");

    const isValid = await Bun.password.verify(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const { password: _, ...safeUser } = user;
    return safeUser as SafeUser;
  }
}
