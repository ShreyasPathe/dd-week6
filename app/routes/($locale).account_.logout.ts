import { redirect, type LoaderFunctionArgs } from '@shopify/remix-oxygen';

export async function action({ context }: LoaderFunctionArgs) {
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  return redirect(`https://${shopDomain}/account/logout`);
}

export async function loader({ context }: LoaderFunctionArgs) {
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  return redirect(`https://${shopDomain}/account/logout`);
}

export default function Logout() {
  return null;
}
