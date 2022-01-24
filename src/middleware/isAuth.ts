import { MiddlewareFn } from "type-graphql"
import { verify } from "jsonwebtoken"
import { MyContext } from "../interface/MyContext"
import { createRefreshToken, sendRefreshToken } from "../util/auth"
import { User } from "./../entity/User"

import * as jwt from "jsonwebtoken"

declare module "jsonwebtoken" {
  export interface UserIDJwtPayload extends jwt.JwtPayload {
    userId: string
    tokenVersion: string
  }
}

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const auth = context.req.headers["authorization"]

  if (!auth) {
    throw new Error("not authenticated")
  }

  try {
    const token = auth.split(" ")[1]
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
    const UserIDJwtPayload = payload as jwt.UserIDJwtPayload
    const user = await User.findOne({
      where: { id: UserIDJwtPayload.userId! },
    })
    if (!user) {
      throw new Error("not authenticated")
    }
    sendRefreshToken(context.res, createRefreshToken(user))
    context.payload = payload as any
  } catch (err) {
    throw new Error("not authenticated")
  }
  return next()
}
