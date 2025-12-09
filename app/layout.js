import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import HydrationFix from "@/components/hydration-fix";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Trading Simulation",
  description: "A crypto trading simulation platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove browser extension attributes before React hydrates
                if (typeof document !== 'undefined') {
                  const extensionAttrs = ['bis_skin_checked', 'bis_register'];
                  
                  const removeExtensionAttrs = (element) => {
                    extensionAttrs.forEach((attr) => {
                      if (element.hasAttribute && element.hasAttribute(attr)) {
                        element.removeAttribute(attr);
                      }
                    });
                    if (element.attributes) {
                      Array.from(element.attributes).forEach((attr) => {
                        if (attr.name.startsWith('__processed_')) {
                          element.removeAttribute(attr.name);
                        }
                      });
                    }
                  };
                  
                  const cleanAllElements = () => {
                    const allElements = document.querySelectorAll('*');
                    allElements.forEach(removeExtensionAttrs);
                  };
                  
                  // Run immediately
                  cleanAllElements();
                  
                  // Watch for new elements being added
                  const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                      mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                          removeExtensionAttrs(node);
                          if (node.querySelectorAll) {
                            node.querySelectorAll('*').forEach(removeExtensionAttrs);
                          }
                        }
                      });
                      if (mutation.type === 'attributes') {
                        removeExtensionAttrs(mutation.target);
                      }
                    });
                  });
                  
                  // Start observing
                  observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: extensionAttrs.concat(['__processed_'])
                  });
                  
                  // Clean on DOM ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', cleanAllElements);
                  }
                  
                  // Clean periodically until React hydrates (max 5 seconds)
                  let attempts = 0;
                  const maxAttempts = 50;
                  const interval = setInterval(() => {
                    cleanAllElements();
                    attempts++;
                    if (attempts >= maxAttempts) {
                      clearInterval(interval);
                    }
                  }, 100);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <HydrationFix />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div id="__next" suppressHydrationWarning>
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
