export const HERO_PARALLAX_FRAGMENT = `#graphql
  fragment HeroParallaxFields on Metaobject {
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
` as const;

export const HERO_PARALLAX_QUERY = `#graphql
  query GetHeroParallax($handle: String!) {
    metaobject(handle: {type: "section_hero_parallax", handle: $handle}) {
      ...HeroParallaxFields
    }
  }
  ${HERO_PARALLAX_FRAGMENT}
` as const;
