import express from "express"
import { ApolloServer } from "@apollo/server"
import bodyParser from "body-parser";
import { expressMiddleware } from "@apollo/server/express4"
import { User } from "./user";
import { Tweet } from "./tweet";
import { sharedTypes } from "./shared/types";
import { sharedQueries } from "./shared/queries";
import cors from "cors";
import { JWTService } from "../services/jwt";
import { GraphQLContext } from "../interfaces";

export async function initServer() {
    const app = express();

    app.use(bodyParser.json());
    app.use(cors());

    const graphqlServer = new ApolloServer<GraphQLContext>({
        typeDefs: `
        ${sharedTypes}
        ${Tweet.types}
        ${User.types}

        type Query{
            ${sharedQueries}
        }
        type Mutation {
            ${Tweet.mutations}
        }
        `,
        resolvers: {
            Mutation: {
                ...Tweet.resolvers.mutations,
            },
            ...Tweet.resolvers.extraResolvers,
            Query: {
                ...User.resolvers.queries,
                ...Tweet.resolvers.queries,
            },
            ...User.resolvers.extraResolvers,
        },
    });

    await graphqlServer.start();

    app.use(
        "/graphql",
        expressMiddleware(graphqlServer, {
            context: async ({ req, res }) => {
                return {
                    user: req.headers.authorization ?
                        JWTService.decodeToken(req.headers.authorization.split("Bearer ")[1])
                        : undefined
                }
            }
        })
    );

    return app;
}