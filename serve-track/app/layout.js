import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] });


export const metadata = {
  title: 'ServeTrack',
  description: 'Streamlining community service for universities and students',
  icon: [
    { url: "/favicon.ico?v=2" } // versioned to bypass cache
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
     <body className={geistSans.className}>
     
        {children}
      </body>
    </html>
  );
}
