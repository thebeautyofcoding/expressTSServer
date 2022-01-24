import express from "express"
import cors from "cors"
import { createConnection } from "typeorm"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import { UserResolver } from "./resolver/UserResolver"
import cookieParser from "cookie-parser"
;(async () => {
  const app = express()
  app.use(
    cors({
      origin: "http://localhost:3333",
      credentials: true,
    })
  )
  app.use(express.json())
  app.use(cookieParser())
  await createConnection()
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    context: ({ req, res }) => ({ req, res }),
  })
  apolloServer.applyMiddleware({ app, cors: false, path: "/graphql" })
  app.listen(3333, () => {
    console.log("express server started")
  })
})()
