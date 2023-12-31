import { LoginHandler } from "../../authSettings";
import { IUsersRepository } from "@/domain/auth/application/repositories/IUsersRepository";
import { User } from "../../enterprise/entities/user";
import { LoginBodySchema } from "../../authSettings";
import {
  Either,
  right,
  left,
} from "@/domain/core/utils/functionalErrorHandling/either";
import { InvalidCredentialsError } from "./errors/invalidCredentialsError";
import { UserNotActiveError } from "./errors/userNotActive";
import { IUserTokensRepository } from "../repositories/IUserTokensRepository";
import { UserToken } from "../../enterprise/entities/userToken";

type LoginUseCaseResponse = Either<
  InvalidCredentialsError | UserNotActiveError,
  {
    user: User;
  }
>;

export class LoginUseCase {
  constructor(
    private usersRepository: IUsersRepository,
    private userTokensRepository: IUserTokensRepository
  ) {}

  async execute(userData: LoginBodySchema): Promise<LoginUseCaseResponse> {
    const user = await this.usersRepository.findByEmail(userData.email);

    if (!user) {
      return left(new InvalidCredentialsError());
    }

    const isPasswordValid = await LoginHandler.compare(
      userData.password,
      user.password
    );

    if (!isPasswordValid) {
      return left(new InvalidCredentialsError());
    }

    if (user.status !== "active") {
      const token = await this.userTokensRepository.findByUserId(
        user.id.toString()
      );
      if (!token) {
        const newToken = UserToken.create({
          userId: user.id.toString(),
          type: "account_confirmation",
        });

        this.userTokensRepository.create(newToken);
      } else {
        return left(new UserNotActiveError(userData.email));
      }
    }

    return right({ user });
  }
}
