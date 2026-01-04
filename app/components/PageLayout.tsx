import { useParams, Form, Await, useRouteLoaderData } from '@remix-run/react';
import useWindowScroll from 'react-use/esm/useWindowScroll';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CartForm } from '@shopify/hydrogen';

import { type LayoutQuery } from 'storefrontapi.generated';
import { Text, Heading } from '~/components/Text';
import { Link } from '~/components/Link';
import { Cart } from '~/components/Cart';
import { CartLoading } from '~/components/CartLoading';
import { Input } from '~/components/Input';
import { Drawer, useDrawer } from '~/components/Drawer';
import {
  IconMenu,
  IconLogin,
  IconAccount,
  IconBag,
  IconSearch,
} from '~/components/Icon';
import {
  type EnhancedMenu,
  useIsHomePath,
} from '~/lib/utils';
import { useIsHydrated } from '~/hooks/useIsHydrated';
import { useCartFetchers } from '~/hooks/useCartFetchers';
import type { RootLoader } from '~/root';

type LayoutProps = {
  children: React.ReactNode;
  layout?: LayoutQuery & {
    headerMenu?: EnhancedMenu | null;
    footerMenu?: EnhancedMenu | null;
  };
};

export function PageLayout({ children, layout }: LayoutProps) {
  const { headerMenu } = layout || {};
  return (
    <div className="flex flex-col min-h-screen">
      <a href="#mainContent" className="sr-only">
        Skip to content
      </a>
      {headerMenu && layout?.shop.name && (
        <Header title={layout.shop.name} menu={headerMenu} />
      )}
      <main role="main" id="mainContent" className="flex-grow">
        {children}
      </main>
    </div>
  );
}

function Header({ title, menu }: { title: string; menu?: EnhancedMenu }) {
  const isHome = useIsHomePath();
  const { y } = useWindowScroll();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const {
    isOpen: isCartOpen,
    openDrawer: openCart,
    closeDrawer: closeCart,
  } = useDrawer();

  const {
    isOpen: isMenuOpen,
    openDrawer: openMenu,
    closeDrawer: closeMenu,
  } = useDrawer();

  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);

  // toggle cart drawer when adding to cart
  useEffect(() => {
    if (isCartOpen || !addToCartFetchers.length) return;
    openCart();
  }, [addToCartFetchers, isCartOpen, openCart]);

  // Determine if header should have glass effect
  const isScrolled = y > 20;

  return (
    <>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      {menu && (
        <MenuDrawer isOpen={isMenuOpen} onClose={closeMenu} menu={menu} />
      )}

      {/* Desktop & Mobile Header */}
      <header
        role="banner"
        className={`
          fixed top-0 left-0 right-0 z-50 
          transition-all duration-500 ease-in-out
          ${isScrolled
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg'
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Mobile Menu Button */}
            <button
              onClick={openMenu}
              className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Open menu"
            >
              <IconMenu />
            </button>

            {/* Logo */}
            <Link
              to="/"
              prefetch="intent"
              className="flex items-center space-x-2"
            >
              <div className="relative">
                <Heading
                  className="flex gap-2 text-2xl uppercase font-['Montserrat'] font-black tracking-widest"
                  as={isHome ? 'h1' : 'h2'}
                >
                  {(title || '').split(' ').map((word, i) => (
                    <span
                      key={i}
                      className="text-white"
                      style={{ WebkitTextStroke: '1px white' }}
                    >
                      {word}
                    </span>
                  ))}
                </Heading>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden lg:flex items-center space-x-1"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {(menu?.items || []).filter((item) => item.title !== 'Contact').map((item, index) => (
                <Link
                  key={item.id}
                  to={item.to}
                  target={item.target}
                  prefetch="intent"
                  onMouseEnter={() => setHoveredIndex(index)}
                  className={`
                    relative px-4 py-2 rounded-lg text-lg font-medium transition-colors duration-200
                    ${hoveredIndex === index ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}
                  `}
                >
                  <span className="relative z-10">{item.title}</span>
                  {hoveredIndex === index && (
                    <motion.div
                      layoutId="pill-nav"
                      className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-lg z-0"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              {/* Search - Desktop */}
              <SearchButton />

              {/* Account Link */}
              <AccountLink />

              {/* Cart */}
              <CartCount openCart={openCart} />
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from hiding under fixed header */}
      <div className="h-20"></div>
    </>
  );
}

function SearchButton() {
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        aria-label="Search"
      >
        <IconSearch />
      </button>

      {/* Search Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div className="max-w-2xl mx-auto mt-20 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Heading size="lead">Search Products</Heading>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <Form
                method="get"
                action={params.locale ? `/${params.locale}/search` : '/search'}
                className="flex gap-2"
              >
                <Input
                  type="search"
                  placeholder="Find Your Drip"
                  name="q"
                  className="flex-1 px-6 py-4 rounded-full bg-white text-black placeholder:text-gray-500 text-lg border-0 focus:ring-0 shadow-lg"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:opacity-90 transition-all duration-200 hover:scale-105"
                >
                  Search
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Drawer open={isOpen} onClose={onClose} heading="Shopping Cart" openFrom="right">
      <div className="grid">
        <Suspense fallback={<CartLoading />}>
          <Await resolve={rootData?.cart}>
            {(cart) => <Cart layout="drawer" onClose={onClose} cart={cart} />}
          </Await>
        </Suspense>
      </div>
    </Drawer>
  );
}

function MenuDrawer({
  isOpen,
  onClose,
  menu,
}: {
  isOpen: boolean;
  onClose: () => void;
  menu: EnhancedMenu;
}) {
  return (
    <Drawer open={isOpen} onClose={onClose} openFrom="left" heading="Menu">
      <nav className="grid gap-2 p-6">
        {(menu?.items || []).filter((item) => item.title !== 'Contact').map((item) => (
          <Link
            key={item.id}
            to={item.to}
            target={item.target}
            onClick={onClose}
            className={({ isActive }) =>
              `px-4 py-3 rounded-xl text-base font-medium transition-all duration-200
              ${isActive
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </Drawer>
  );
}

function AccountLink() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const isLoggedIn = rootData?.isLoggedIn;

  return (
    <Suspense fallback={<Link to="/account/login" className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group" aria-label="Account"><IconLogin className="w-6 h-6" /></Link>}>
      <Await resolve={isLoggedIn} errorElement={<Link to="/account/login" className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group" aria-label="Account"><IconLogin className="w-6 h-6" /></Link>}>
        {(isLoggedIn) => (
          <Link
            to={isLoggedIn ? "/account" : "/account/login"}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
            aria-label={isLoggedIn ? "Account" : "Login"}
          >
            {isLoggedIn
              ? <IconAccount className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
              : <IconLogin className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
            }
          </Link>
        )}
      </Await>
    </Suspense>
  );
}

function CartCount({ openCart }: { openCart: () => void }) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  if (!rootData) return null;

  return (
    <Suspense fallback={<Badge count={0} openCart={openCart} />}>
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <Badge
            openCart={openCart}
            count={cart?.totalQuantity || 0}
          />
        )}
      </Await>
    </Suspense>
  );
}

function Badge({
  openCart,
  count,
}: {
  count: number;
  openCart: () => void;
}) {
  const isHydrated = useIsHydrated();

  const BadgeCounter = useMemo(
    () => (
      <>
        <IconBag />
        {count > 0 && (
          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-bounce">
            {count}
          </div>
        )}
      </>
    ),
    [count],
  );

  return isHydrated ? (
    <button
      onClick={openCart}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
      aria-label={`Cart with ${count} items`}
    >
      {BadgeCounter}
    </button>
  ) : (
    <Link
      to="/cart"
      className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 group"
    >
      {BadgeCounter}
    </Link>
  );
}
