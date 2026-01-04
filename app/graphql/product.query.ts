export const PRODUCT_SHOWCASE_FRAGMENT = `#graphql
  fragment ProductShowcaseFields on Metaobject {
    id
    type
    handle
    fields {
      key
      value
      type
      references(first: 20) {
        nodes {
          ... on Product {
            id
            title
            handle
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            featuredImage {
              id
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
` as const;

export const PRODUCT_SHOWCASE_QUERY = `#graphql
  query GetProductShowcase($handle: String!) {
    metaobject(handle: {type: "section_product_showcase", handle: $handle}) {
      ...ProductShowcaseFields
    }
  }
  ${PRODUCT_SHOWCASE_FRAGMENT}
` as const;
