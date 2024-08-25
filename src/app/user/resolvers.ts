import axios from "axios"
import { db } from "../../client/db";
import JWTService from "../../services/jwt";

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
                    firstname: data.given_name!,
                    lastname: data.family_name || "",
                    profileimageURL: data.picture || ""
                }
            });

        }
        const userInDb = await db.user.findUnique({ where: { email: data.email } })

        if (!userInDb) throw new Error("User with email not found")
        const userToken = JWTService.generateTokenForUser(userInDb);

        return userToken;

    },
};

export const resolvers = { queries };