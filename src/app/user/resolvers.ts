import { db } from "../../client/db";
import UserService from "../../services/user";
import { GraphQLContext } from "../../interfaces";
import { User } from "@prisma/client";

const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const resultToken = await UserService.verifyGoogleAuthToken(token);
        return resultToken;
    },
    getCurrentUser: async (parent: any, args: any, context: GraphQLContext) => {
        const resolvedUser = await context.user;
        const id = resolvedUser?.id;
        if (!id) return null;
        const foundUser = await UserService.getUserById(id);
        return foundUser;
    },
    getUserById: async (parent: any, { id }: { id: string }) => {
        const foundUser = await UserService.getUserById(id);
        return foundUser;
    }
};

const extraResolvers = {
    User: {
        tweets: async (parent: User) => db.tweet.findMany({ where: { authorId: parent.id } })
    }
}

export const resolvers = { queries, extraResolvers };