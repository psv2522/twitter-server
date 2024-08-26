export const sharedTypes = `#graphql
    type User {
        id: ID!
        firstName: String!
        lastName: String
        email: String!
        profileImageURL: String
        tweets: [Tweet]
    }

    type Tweet {
        id: ID!
        content: String!
        imageURL: String
        author: User
    }
`;