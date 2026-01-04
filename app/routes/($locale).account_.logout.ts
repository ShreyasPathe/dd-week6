import { redirect, type LoaderFunctionArgs, type AppLoadContext } from '@shopify/remix-oxygen';

export async function doLogout(context: AppLoadContext) {
  const shopDomain = context.env.PUBLIC_STORE_DOMAIN;
  return redirect(`https://${shopDomain}/account/logout`);
}

export async function action({ context }: LoaderFunctionArgs) {
  return doLogout(context);
}

export async function loader({ context }: LoaderFunctionArgs) {
  return doLogout(context);
}

export default function Logout() {
  return null;
}
