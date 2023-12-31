import { FastifyRequest, FastifyReply } from "fastify";
import { TokenHandler } from "../../authSettings";
import { makeUseCase } from "@/patterns/factories/MakeUseCase";
import { genericError } from "@/domain/core/errors/genericError";
import { ResourceAlreadyExistsError } from "@/domain/core/errors/resourceAlreadyExistsError";
import { CreateTokenUseCase } from "../../application/useCases/createToken";
import { UserNotFoundError } from "../../application/useCases/errors/userNotFound";
import { UserStatusNotAllowed } from "../../application/useCases/errors/userStatusNotAllowed";

export async function createToken(req: FastifyRequest, res: FastifyReply) {
  try {
    const tokenRaw = TokenHandler.validate(req.body);

    const response = await makeUseCase(
      CreateTokenUseCase,
      TokenHandler.tokenRepository,
      TokenHandler.userRepository
    ).execute(tokenRaw);

    if (response.isLeft()) {
      throw response.value;
    }

    // const token = response.value.token;

    return res.status(201).send();
  } catch (err) {
    if (err instanceof ResourceAlreadyExistsError) {
      return res.status(409).send({ error: err.message });
    }
    if (err instanceof UserNotFoundError) {
      return res.status(404).send({ error: err.message });
    }
    if (err instanceof UserStatusNotAllowed) {
      return res.status(403).send({ error: err.message });
    }

    return genericError(err, res);
  }
}
