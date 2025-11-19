import { UserRepository } from "../repositories/user.repo";
import { AuthService } from "../services/auth.service";

export class AuthController {
  private userRepo: UserRepository;
  private authService: AuthService;

  constructor() {
    this.userRepo = new UserRepository();
    this.authService = new AuthService(this.userRepo);
  }

  async login(body: { username: string; password: string }, jwt: any) {
    return this.authService.login(body, jwt);
  }

  async register(
    body: { username: string; password: string; email: string },
    jwt: any,
  ) {
    return this.authService.register(body, jwt);
  }
}
