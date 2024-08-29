import { db } from "../client/db";

export interface CreateTweetPayload {
    content: string;
    imageURL: string;
    userId: string;
}

class TweetService {
    public static async createTweet(data: CreateTweetPayload) {
        return db.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: { connect: { id: data.userId } }
            }
        });
    }

    public static async getAllTweets() {
        return db.tweet.findMany({
            orderBy: { createdAt: "desc" }
        });
    }
}

export default TweetService;