import { User } from "./../entity/User"
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
} from "type-graphql"
import { isAuth } from "./../middleware/isAuth"
import { MyContext } from "./../interface/MyContext"
import { verify } from "jsonwebtoken"
import { compare, hash } from "bcryptjs"
import { createAccessToken } from "../util/auth"
import { sendRefreshToken } from "./../util/auth"
@ObjectType()
class LoginResponse {
  @Field()
  accessToken: string
  @Field(() => User)
  user: User
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    return `your user id is :${payload!.userId}`
  }

  @Query(() => [User])
  users() {
    return User.find()
  }
  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, "")
  }
  @Query(() => User, { nullable: true })
  me(@Ctx() context: MyContext) {
    const auth = context.req.headers["authorization"]

    if (!auth) {
      return null
    }
    try {
      const token = auth.split(" ")[1]
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!)
      return User.findOne(payload.userId)
    } catch (err) {
      console.log(err)
      return null
    }
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      throw new Error("could not find user")
    }
    const valid = await compare(password, user.password)
    if (!valid) {
      throw new Error("bad password")
    }

    const token = createAccessToken(user)
    return { accessToken: token, user }
  }
  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Arg("name") name: string,
    @Arg("isAdmin") isAdmin: boolean
  ) {
    const hashedPassword = await hash(password, 12)

    try {
      await User.insert({
        name,
        isAdmin,
        email,
        password: hashedPassword,
      })
    } catch (err) {
      console.log(err)
      return false
    }

    return true
  }
}
