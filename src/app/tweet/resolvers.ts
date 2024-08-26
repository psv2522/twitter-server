import { Tweet } from "@prisma/client";
import { db } from "../../client/db";
import { GraphQLContext } from "../../interfaces";

interface CreateTweetPayload {
    content: string;
    imageURL: string;
}

const queries = {
    getAllTweets: async () => db.tweet.findMany({ orderBy: { createdAt: "desc" } })
}

const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetPayload }, context: GraphQLContext) => {
        const user = await context.user;
        console.log(user);
        if (!user!.id) {
            throw new Error("Unauthorized");
        }

        const tweet = await db.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: user?.id } }
            },
        });

        return tweet;
    },
};

const extraResolvers = {
    Tweet: {
        author: async (parent: Tweet) => db.user.findUnique({ where: { id: parent.authorId } })
    }
}

export const resolvers = { queries, mutations, extraResolvers }; 

