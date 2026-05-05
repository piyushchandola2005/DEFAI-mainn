"use client";

/**
 * Legacy swap test harness removed with Avalanche / Trader Joe migration.
 * Use the main chat at /home for Jupiter swaps on Solana.
 */
export default function TestPage() {
	return (
		<div className="container py-12">
			<h1 className="text-xl font-semibold">Test</h1>
			<p className="text-muted-foreground mt-2">
				Solana flows are exercised via the AI chat. Go to{" "}
				<a href="/home" className="underline">
					/home
				</a>
				.
			</p>
		</div>
	);
}
