import { Tweet } from "@prisma/client";
import { db } from "../../client/db";
import { GraphQLContext } from "../../interfaces";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserService from "../../services/user";
import TweetService, { CreateTweetPayload } from "../../services/tweet";

const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION,
});

const queries = {
    getAllTweets: async () => TweetService.getAllTweets(),
    getSignedUrlForTweet: async (parent: any, { imageType, imageName }: { imageType: string, imageName: string }, context: GraphQLContext) => {
        const user = await context.user;
        if (!user?.id) throw new Error("Unauthorized");

        const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

        if (!allowedImageTypes.includes(imageType)) throw new Error("Unsupported image type");

        const putObjectCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `uploads/${user?.id}/tweets/${imageName}-${Date.now().toString()}.${imageType}`,
            ContentType: `image/${imageType}`
        });

        const signedUrl = await getSignedUrl(s3Client, putObjectCommand);

        return signedUrl;
    }
}

const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetPayload }, context: GraphQLContext) => {
        const user = await context.user;
        if (!user?.id) {
            throw new Error("Unauthorized");
        }

        const tweet = await TweetService.createTweet({ ...payload, userId: user.id });

        return tweet;
    },
};

const extraResolvers = {
    Tweet: {
        author: async (parent: Tweet) => UserService.getUserById(parent.authorId)
    }
}

export const resolvers = { queries, mutations, extraResolvers };

