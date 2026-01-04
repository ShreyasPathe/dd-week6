import { redirect, type LoaderFunctionArgs } from '@shopify/remix-oxygen';

export async function loader({ context }: LoaderFunctionArgs) {
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  return redirect(`https://${shopDomain}/account/login`);
}

export default function Authorize() {
  return null;
}
