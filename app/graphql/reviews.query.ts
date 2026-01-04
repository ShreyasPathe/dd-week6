export const REVIEWS_SECTION_QUERY = `#graphql
  query GetReviewsSection($handle: String!) {
    metaobject(handle: {type: "section_reviews", handle: $handle}) {
      id
      type
      handle
      fields {
        key
        value
        type
        references(first: 50) {
          nodes {
            ... on Metaobject {
              id
              type
              handle
              fields {
                key
                value
                type
                reference {
                  ... on MediaImage {
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;
