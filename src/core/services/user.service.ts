import { type SafeUser } from "../domain/user.types";
import { UserRepository } from "../repositories/user.repo";

export class UserService {
  private userRepo: UserRepository;

  constructor(userRepo: UserRepository) {
    this.userRepo = userRepo;
  }

  async findUserById(id: string): Promise<SafeUser> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async findUsersByIds(ids: string): Promise<SafeUser[]> {
    if (!ids || typeof ids !== "string") {
      return [];
    }

    const idArray = ids.split(",").filter((id) => id.trim().length > 0);
    if (idArray.length === 0) {
      return [];
    }

    const users = await this.userRepo.findByIds(idArray);
    return users.map((user) => {
      const { password: _, ...safeUser } = user;
      return safeUser as SafeUser;
    });
  }
}
