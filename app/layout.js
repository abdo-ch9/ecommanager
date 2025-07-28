// app/layout.js
import "./globals.css";

export const metadata = { title: "My App" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* tell React: don’t warn if this subtree differs */}
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        {children}
      </body>
    </html>

  );
}
