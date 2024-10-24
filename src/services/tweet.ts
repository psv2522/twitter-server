import { db } from "../client/db";
import { redisClient } from "../client/redis";

export interface CreateTweetPayload {
    content: string;
    imageURL: string;
    userId: string;
}

class TweetService {
    public static async createTweet(data: CreateTweetPayload) { 
        const rateLimitFlag = await redisClient.get(`RATE_LIMIT:TWEET:${data.userId}`);
        if (rateLimitFlag) {
            throw new Error("Please wait for 10 seconds before creating another tweet");
        }
        const tweet = db.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: { connect: { id: data.userId } }
            }
        });
        await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 60, "1");
        await redisClient.del("ALL_TWEETS");

        return tweet;
    }

    public static async getAllTweets() {
        const cachedTweets = await redisClient.get("ALL_TWEETS");
        if (cachedTweets) return JSON.parse(cachedTweets);
        const tweets =  db.tweet.findMany({
            orderBy: { createdAt: "desc" }
        });
        await redisClient.set("ALL_TWEETS", JSON.stringify(tweets));
        return tweets;
    }
}

export default TweetService;