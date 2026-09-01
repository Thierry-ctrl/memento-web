import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, Link, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider, useQueryClient, QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import Home from "@/pages/home";
import Experiences from "@/pages/experiences";
import Gallery from "@/pages/gallery";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Book from "@/pages/book";
import Admin from "@/pages/admin";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(20 11% 13%)",
    colorForeground: "hsl(20 11% 13%)",
    colorMutedForeground: "hsl(30 8% 30%)",
    colorDanger: "hsl(8 30% 72%)",
    colorBackground: "hsl(38 31% 93%)",
    colorInput: "transparent",
    colorInputForeground: "hsl(20 11% 13%)",
    colorNeutral: "hsl(32 15% 66%)",
    fontFamily: "Manrope, sans-serif",
    borderRadius: "0rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#F4EFE7] border border-[#B5A89D]/40 rounded-none w-[440px] max-w-full overflow-hidden shadow-none",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-4xl text-[#241F1D]",
    headerSubtitle: "font-sans font-light text-[#241F1D]/70",
    socialButtonsBlockButtonText: "font-sans uppercase tracking-widest text-xs",
    formFieldLabel: "font-sans uppercase tracking-widest text-[10px] text-[#241F1D]/60",
    footerActionLink: "font-sans text-[#241F1D] hover:text-[#CFA6A0] transition-colors",
    footerActionText: "font-sans text-[#241F1D]/60",
    dividerText: "font-sans text-[#241F1D]/40 text-xs uppercase tracking-widest",
    identityPreviewEditButton: "text-[#241F1D]/60 hover:text-[#241F1D]",
    formFieldSuccessText: "text-[#A3A89C]",
    alertText: "text-[#CFA6A0]",
    logoBox: "mb-8",
    socialButtonsBlockButton: "border-[#241F1D]/20 rounded-none hover:bg-[#241F1D]/5",
    formButtonPrimary: "bg-[#241F1D] hover:bg-[#241F1D]/90 text-[#F4EFE7] rounded-none uppercase tracking-widest text-xs h-12",
    formFieldInput: "border-b border-[#241F1D]/20 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent focus:ring-0 focus:border-[#241F1D] shadow-none px-0",
    footerAction: "mt-6",
    dividerLine: "bg-[#241F1D]/10",
    alert: "border-[#CFA6A0]/30 bg-[#CFA6A0]/10 rounded-none",
    otpCodeFieldInput: "border-[#241F1D]/20 rounded-none focus:border-[#241F1D] bg-transparent",
    formFieldRow: "mb-6",
    main: "gap-8",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-24">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-24">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function AdminRoute() {
  return (
    <>
      <Show when="signed-in">
        <Admin />
      </Show>
      <Show when="signed-out">
        <div className="flex flex-col min-h-[50vh] items-center justify-center pt-32">
          <p className="font-serif text-2xl text-primary mb-6">Restricted Area</p>
          <p className="text-primary/60 font-light mb-8">Please sign in to access the booking management dashboard.</p>
           <Link href="/sign-in" className="font-sans uppercase tracking-widest text-xs border border-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors">Sign In</Link>
        </div>
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const routeMeta: Record<string, { title: string; description: string }> = {
      "/": { title: "Memento Kigali — Printed. Shared. Remembered.", description: "A considered photo experience for gatherings in Kigali, made physical." },
      "/experiences": { title: "Experiences — Memento Kigali", description: "Explore Memento photo experiences for weddings, celebrations, brands, and gatherings." },
      "/gallery": { title: "The Archive — Memento Kigali", description: "A selection of portraits, celebrations, prints, and shared moments from Memento Kigali." },
      "/about": { title: "The Story — Memento Kigali", description: "Why Memento believes in the lasting value of a physical print." },
      "/book": { title: "Request a Date — Memento Kigali", description: "Tell Memento about your gathering and request availability." },
      "/contact": { title: "Contact — Memento Kigali", description: "Reach Memento Kigali by WhatsApp, phone, or booking request." },
      "/privacy": { title: "Privacy Notice — Memento Kigali", description: "How Memento handles booking information and event images." },
      "/admin": { title: "Bookings — Memento Kigali", description: "Protected Memento booking administration." },
    };
    const meta =
      routeMeta[location] ||
      (location.startsWith("/sign-in")
        ? { title: "Sign in — Memento Kigali", description: "Sign in to the protected Memento workspace." }
        : location.startsWith("/sign-up")
          ? { title: "Create account — Memento Kigali", description: "Create an account for the protected Memento workspace." }
          : { title: "Page not found — Memento Kigali", description: "This Memento page could not be found." });
    document.title = meta.title;
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.appendChild(description);
    }
    description.setAttribute("content", meta.description);
    const updateMeta = (selector: string, attribute: "property" | "name", key: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };
    updateMeta('meta[property="og:title"]', "property", "og:title", meta.title);
    updateMeta('meta[property="og:description"]', "property", "og:description", meta.description);
    updateMeta('meta[name="twitter:title"]', "name", "twitter:title", meta.title);
    updateMeta('meta[name="twitter:description"]', "name", "twitter:description", meta.description);
  }, [location]);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <div className="flex flex-col min-h-screen relative">
          <Navbar />
          <div className="flex-1 flex flex-col">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/experiences" component={Experiences} />
              <Route path="/gallery" component={Gallery} />
              <Route path="/about" component={About} />
              <Route path="/book" component={Book} />
              <Route path="/contact" component={Contact} />
              <Route path="/privacy" component={Privacy} />
              <Route path="/admin" component={AdminRoute} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route>
                <div className="flex-1 flex flex-col items-center justify-center pt-40 pb-20">
                  <h1 className="font-serif text-6xl text-primary mb-4">404</h1>
                  <p className="text-primary/60">Page not found.</p>
                </div>
              </Route>
            </Switch>
          </div>
          <Footer />
        </div>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
