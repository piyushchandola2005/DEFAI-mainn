import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Web3Provider } from "@/providers/web3-provider";
import { WalletConnectionManager } from "@/components/WalletConnectionManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Defai",
	description: "AI-powered conversational interface for decentralized finance",
	icons: {
		icon: [
			{ rel: "icon", url: "/black_logo.svg", type: "image/svg+xml" },
		]
	}
};

export const viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`antialiased tracking-tight ${inter.className}`}>
				<ThemeProvider attribute="class" defaultTheme="dark">
					<Web3Provider>
						<WalletConnectionManager />
						{children}
						<Toaster />
					</Web3Provider>
				</ThemeProvider>
			</body>
		</html>
	);
}
