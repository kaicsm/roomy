import { UserRepository } from "../repositories/user.repo";

export class AuthService {
  private cost = 10;

  constructor(private userRepo: UserRepository) {}

  async register(
    {
      username,
      password,
      email,
    }: {
      username: string;
      password: string;
      email: string;
    },
    jwt: any,
  ) {
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
    const token = await this.signToken(
      { sub: user.id, email: user.email },
      jwt,
    );

    const { password: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async login(
    { username, password }: { username: string; password: string },
    jwt: any,
  ) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw new Error("Invalid credentials");

    const isValid = await Bun.password.verify(password, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const token = await this.signToken(
      { sub: user.id, email: user.email },
      jwt,
    );
    const { password: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  private async signToken(payload: object, jwt: any) {
    return await jwt.sign(payload, { expiresIn: "7d" });
  }
}
