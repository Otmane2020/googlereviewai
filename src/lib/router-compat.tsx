import React, { useCallback, useEffect, useMemo } from "react";
import {
  Link as TanStackLink,
  Outlet as TanStackOutlet,
  redirect as tanstackRedirect,
  useNavigate as useTanStackNavigate,
  useParams as useTanStackParams,
  useRouterState,
} from "@tanstack/react-router";

const toHref = (to: any): string => {
  if (typeof to === "string") return to;
  if (!to) return "/";
  return `${to.pathname || ""}${to.search || ""}${to.hash || ""}` || "/";
};

const isExternalHref = (href: string) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href) || href.startsWith("#");

const activeFor = (pathname: string, href: string, end = false) => {
  const clean = href.split(/[?#]/)[0] || "/";
  if (clean === "/") return pathname === "/";
  return end ? pathname === clean : pathname === clean || pathname.startsWith(`${clean}/`);
};

export const useLocation = () => {
  const location = useRouterState({ select: (state) => state.location });
  return useMemo(
    () => ({
      pathname: location.pathname,
      search: (location as any).searchStr || "",
      hash: location.hash || "",
      state: location.state ?? null,
      key: (location as any).state?.key || "tanstack",
    }),
    [location],
  );
};

export const useNavigate = () => {
  const navigate = useTanStackNavigate();
  return useCallback(
    (to: any, options: any = {}) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }

      const href = toHref(to);
      if (isExternalHref(href)) {
        if (typeof window !== "undefined") {
          if (options?.replace) window.location.replace(href);
          else window.location.assign(href);
        }
        return;
      }

      const url = new URL(href, "https://googlereviewai.com");
      const search = Object.fromEntries(url.searchParams.entries());
      return navigate({
        to: url.pathname as any,
        search: Object.keys(search).length ? (search as any) : undefined,
        hash: url.hash ? url.hash.slice(1) : undefined,
        replace: Boolean(options?.replace),
        state: options?.state,
      } as any);
    },
    [navigate],
  );
};

export const useParams = <T extends Record<string, string | undefined> = Record<string, string>>() => {
  const tanstackParams = useTanStackParams({ strict: false }) as Record<string, string | undefined>;
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  const last = parts.at(-1);
  const inferred: Record<string, string | undefined> = { ...tanstackParams };

  if (!inferred.slug && last && (parts[0] === "blog" || parts[0] === "shop")) inferred.slug = decodeURIComponent(last);
  if (!inferred.id && last) inferred.id = decodeURIComponent(last);

  return inferred as T;
};

export const useSearchParams = (): [URLSearchParams, (next: any, options?: any) => void] => {
  const location = useLocation();
  const navigate = useTanStackNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const setSearchParams = useCallback(
    (next: any, options: any = {}) => {
      const resolved = typeof next === "function" ? next(new URLSearchParams(location.search)) : next;
      const nextParams = resolved instanceof URLSearchParams ? resolved : new URLSearchParams(resolved);
      const search = Object.fromEntries(nextParams.entries());
      navigate({
        to: location.pathname as any,
        search: search as any,
        replace: Boolean(options?.replace),
      } as any);
    },
    [location.pathname, location.search, navigate],
  );

  return [params, setSearchParams];
};

const RouterLink = React.forwardRef<HTMLAnchorElement, any>((props, ref) => {
  const { to, replace: _replace, state, relative: _relative, reloadDocument, preventScrollReset: _prevent, viewTransition: _viewTransition, children, ...rest } = props;
  const href = toHref(to);

  if (reloadDocument || isExternalHref(href)) {
    return <a ref={ref} href={href} {...rest}>{children}</a>;
  }

  const url = new URL(href, "https://googlereviewai.com");
  const search = Object.fromEntries(url.searchParams.entries());
  return (
    <TanStackLink
      ref={ref as any}
      to={url.pathname as any}
      search={Object.keys(search).length ? (search as any) : undefined}
      hash={url.hash ? url.hash.slice(1) : undefined}
      state={state}
      {...rest}
    >
      {children}
    </TanStackLink>
  );
});
RouterLink.displayName = "RouterLink";

export const Link = RouterLink;

export const NavLink = React.forwardRef<HTMLAnchorElement, any>((props, ref) => {
  const location = useLocation();
  const href = toHref(props.to);
  const isActive = activeFor(location.pathname, href, Boolean(props.end));
  const className = typeof props.className === "function" ? props.className({ isActive, isPending: false, isTransitioning: false }) : props.className;
  const style = typeof props.style === "function" ? props.style({ isActive, isPending: false, isTransitioning: false }) : props.style;
  return <RouterLink {...props} ref={ref} className={className} style={style} aria-current={isActive ? "page" : undefined} />;
});
NavLink.displayName = "NavLink";

export const Navigate = ({ to, replace, state }: any) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);
  return null;
};

const patternToRegex = (pattern: string, end = true) => {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\:([A-Za-z0-9_]+)/g, "(?<$1>[^/]+)")
    .replace(/\\\*/g, ".*");
  return new RegExp(`^${escaped}${end ? "$" : "(?:/|$)"}`);
};

export const matchPath = (pattern: any, pathname: string) => {
  const spec = typeof pattern === "string" ? { path: pattern, end: true, caseSensitive: false } : pattern;
  const regex = patternToRegex(spec.path || "/", spec.end !== false);
  const match = pathname.match(regex);
  if (!match) return null;
  return {
    params: match.groups || {},
    pathname: match[0],
    pathnameBase: match[0],
    pattern: spec,
  };
};

export const useMatch = (pattern: any) => {
  const { pathname } = useLocation();
  return matchPath(pattern, pathname);
};

export const generatePath = (pattern: string, params: Record<string, any> = {}) =>
  pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key) => encodeURIComponent(params[key] ?? ""));

export const createSearchParams = (init?: any) => new URLSearchParams(init);
export const useHref = (to: any) => toHref(to);
export const useResolvedPath = (to: any) => {
  const href = toHref(to);
  const url = new URL(href, "https://googlereviewai.com");
  return { pathname: url.pathname, search: url.search, hash: url.hash };
};
export const useNavigationType = () => "POP" as const;
export const Outlet = TanStackOutlet;
export const useOutletContext = <T,>() => undefined as T;
export const useRouteError = () => undefined;
export const ScrollRestoration = () => null;

// Transitional wrappers for legacy components that still render a router boundary.
export const BrowserRouter = ({ children }: any) => <>{children}</>;
export const HashRouter = BrowserRouter;
export const MemoryRouter = BrowserRouter;

export const Route = (_props: any) => null;
export const Routes = ({ children }: any) => {
  const { pathname } = useLocation();
  const entries = React.Children.toArray(children) as React.ReactElement<any>[];
  for (const child of entries) {
    const { path, index, element } = child.props || {};
    if (index && pathname === "/") return element ?? null;
    if (path === "*" || matchPath({ path: path || "/", end: true }, pathname)) return element ?? null;
  }
  return null;
};

export const RouterProvider = ({ children }: any) => <>{children}</>;
export const createBrowserRouter = (routes: any) => ({ routes });
export const createHashRouter = createBrowserRouter;

export const redirect = (url: string, init?: number | ResponseInit) =>
  tanstackRedirect({
    href: url,
    statusCode: typeof init === "number" ? init : init?.status,
  } as any);

export const json = (data: any, init?: ResponseInit) => Response.json(data, init);
export const defer = (data: any) => data;
