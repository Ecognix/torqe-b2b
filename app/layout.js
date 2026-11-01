import { Inter, Hanken_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500"], variable: "--font-jakarta" });

export const metadata = {
  title: { default: "Torqe Console", template: "%s | Torqe Console" },
  description: "The Torqe command center for conversations, approvals, and agent operations.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${body.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
