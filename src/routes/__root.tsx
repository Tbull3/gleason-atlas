import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import appCss from "../styles.css?url";

const APP_NAME = "Gleason Atlas";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "A polar choropleth of the world on Gleason’s azimuthal equidistant projection.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: "Explore the Gleason Atlas: country metrics, viewing planes, and a live sky visualization." },
      { property: "og:url", content: "https://gleason-atlas.vercel.app/" },
      { property: "og:image", content: "https://gleason-atlas.vercel.app/og.jpg" },
      { property: "og:image:alt", content: "Gleason Atlas polar world map" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { name: "twitter:description", content: "Explore country metrics and the live sky on the Gleason Atlas." },
      { name: "twitter:image", content: "https://gleason-atlas.vercel.app/og.jpg" },
      { name: "theme-color", content: "#0e0d0b" },
    ],
    links: [
      { rel: "canonical", href: "https://gleason-atlas.vercel.app/" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider delayDuration={250}>
          <Outlet />
        </TooltipProvider>
        <Scripts />
      </body>
    </html>
  ),
});
