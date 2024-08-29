import { Tweet } from "@prisma/client";
import { db } from "../../client/db";
import { GraphQLContext } from "../../interfaces";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface CreateTweetPayload {
    content: string;
    imageURL: string;
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS || '',
        secretAccessKey: process.env.AWS_S3_SECRET || ''
    }
});

const queries = {
    getAllTweets: async () => db.tweet.findMany({ orderBy: { createdAt: "desc" } }),
    getSignedUrlForTweet: async (parent: any, { imageType, imageName }: { imageType: string, imageName: string }, context: GraphQLContext) => {
        const user = await context.user;
        if (!user?.id) throw new Error("Unauthorized");

        const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

        if (!allowedImageTypes.includes(imageType)) throw new Error("Unsupported image type");

        const putObjectCommand = new PutObjectCommand({
            Bucket: "prathmesh-twitter-dev",
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

