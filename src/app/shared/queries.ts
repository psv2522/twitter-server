export const sharedQueries = `#graphql
    getAllTweets: [Tweet]
    verifyGoogleToken(token: String!): String
    getCurrentUser: User
    getUserById(id: ID!): User
`;