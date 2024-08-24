import express from "express"
import { ApolloServer } from "@apollo/server"
import bodyParser from "body-parser";
import { expressMiddleware } from "@apollo/server/express4"

export async function initServer() {
    const app = express();

    app.use(bodyParser.json());
    
    const graphqlServer = new ApolloServer({
        typeDefs: `
            type Query{
                sayHello: String
            }
        `,
        resolvers: {
            Query: {
                sayHello: () => `Hey from graphql from server`
            },
        },
    });

    await graphqlServer.start();

    app.use("/graphql", expressMiddleware(graphqlServer));

    return app;
}