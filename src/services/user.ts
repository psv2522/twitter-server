import axios from "axios";
import { db } from "../client/db";
import JWTService from "./jwt";
import { connect } from "http2";

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

class UserService {
    public static async verifyGoogleAuthToken(token: string) {
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
    }

    public static async getUserById(id: string) {
        return db.user.findUnique({ where: { id } });
    }

    public static followUser = async (from: string, to: string) => {
        return db.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } }
            }
        })
    }

    public static unfollowUser = async (from: string, to: string) => {
        return db.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: from,
                    followingId: to
                }
            }
        })
    }

}

export default UserService;