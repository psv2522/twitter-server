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
        tweets: async (parent: User) => db.tweet.findMany({ where: { authorId: parent.id } }),
        followers: async (parent: User) => {
            const followers = await db.follows.findMany({
                where: { following: { id: parent.id } },
                include: { follower: true },
            });
            return followers.map(f => f.follower);
        },
        following: async (parent: User) => {
            const following = await db.follows.findMany({
                where: { follower: { id: parent.id } },
                include: { following: true },
            });
            return following.map(f => f.following);
        },
        recommendedUsers: async (parent: User, _: any, ctx: GraphQLContext) => {
            const user = await ctx.user;
            if (!user) return [];
            const myFollowing = await db.follows.findMany({
                where: {
                    follower: { id: user.id },
                },
                include: {
                    following: {
                        include: {
                            followers: {
                                include: {
                                    following: true,
                                }
                            }
                        }
                    }
                }
            });

            console.log(myFollowing);

            const users: User[] = []
            for (const followings of myFollowing) {
                for (const followingOfFollowedUser of followings.following.followers) {
                    if (followingOfFollowedUser.following.id !== user.id &&
                        myFollowing.findIndex(e => e.followingId === followingOfFollowedUser.following.id) < 0) {
                        
                        users.push(followingOfFollowedUser.following);
                    }
                }
            }
            return users;
        },
    }
};

const mutations = {
    followUser: async (parent: any, { to }: { to: string }, context: GraphQLContext) => {
        const user = await context.user;
        if (!user || !user?.id) throw new Error("Unauthorized");
        await UserService.followUser(user?.id, to);
        return true;
    },
    unfollowUser: async (parent: any, { to }: { to: string }, context: GraphQLContext) => {
        const user = await context.user;
        if (!user || !user?.id) throw new Error("Unauthorized");
        await UserService.unfollowUser(user?.id, to);
        return true;
    },
}

export const resolvers = { queries, extraResolvers, mutations };