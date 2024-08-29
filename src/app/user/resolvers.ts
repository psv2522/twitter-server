import axios from "axios"
import { db } from "../../client/db";
import JWTService from "../../services/jwt";
import { GraphQLContext } from "../../interfaces";
import { User } from "@prisma/client";

interface GoogleTokenResult {
    iss?: string;
    azp?: string;
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: boolean;
    at_hash?: string;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    locale?: string;
    iat?: number;
    exp?: number;
    jti?: string;
}

const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const googleToken = token;
        const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
        googleOauthURL.searchParams.set("id_token", googleToken);

        const { data } = await axios.get<GoogleTokenResult>(googleOauthURL.toString(), {
            responseType: "json",
        });

        const user = await db.user.findUnique({ where: { email: data.email } });

        if (!user) {
            await db.user.create({
                data: {
                    email: data.email!,
                    firstName: data.given_name!,
                    lastName: data.family_name || "",
                    profileImageURL: data.picture || ""
                }
            });

        }
        const userInDb = await db.user.findUnique({ where: { email: data.email } })

        if (!userInDb) throw new Error("User with email not found")
        const userToken = JWTService.generateTokenForUser(userInDb);

        return userToken;
    },
    getCurrentUser: async (parent: any, args: any, context: GraphQLContext) => {
        const resolvedUser = await context.user;
        const id = resolvedUser?.id;
        if (!id) return null;
        const foundUser = await db.user.findUnique({ where: { id } });
        return foundUser;
    },
    getUserById: async (parent: any, { id }: { id: string }) => {
        const foundUser = await db.user.findUnique({ where: { id } });
        return foundUser;
    }
};

const extraResolvers = {
    User: {
        tweets: async (parent: User) => db.tweet.findMany({ where: { authorId: parent.id } })
    }
}

export const resolvers = { queries, extraResolvers };