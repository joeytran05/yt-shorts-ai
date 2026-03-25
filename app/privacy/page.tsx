import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy — PilotShorts",
	description: "Privacy Policy for PilotShorts",
};

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-[#08080f] text-[#dde0f0]">
			<div className="max-w-3xl mx-auto px-6 py-16">
				{/* Header */}
				<div className="mb-12">
					<Link
						href="/"
						className="font-mono text-sm font-bold tracking-tight mb-8 inline-block"
					>
						<span className="text-[#dde0f0]">SHORT</span>
						<span className="text-[#ef4444]">PILOT</span>
					</Link>
					<h1 className="text-3xl font-bold mt-4 mb-2">
						Privacy Policy
					</h1>
					<p className="text-sm text-[#52527a]">
						Last updated: March 25, 2026
					</p>
				</div>

				<div className="prose prose-invert max-w-none space-y-8 text-[#a0a3b8] leading-relaxed">
					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							1. Introduction
						</h2>
						<p>
							PilotShorts (&quot;we&quot;, &quot;our&quot;, or
							&quot;us&quot;) operates the PilotShorts web
							application located at{" "}
							<strong className="text-[#dde0f0]">
								pilotshorts.app
							</strong>{" "}
							(the &quot;Service&quot;). This Privacy Policy
							explains how we collect, use, disclose, and
							safeguard your information when you use our Service.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							2. Information We Collect
						</h2>
						<p>We collect the following types of information:</p>
						<ul className="list-disc pl-6 mt-3 space-y-2">
							<li>
								<strong className="text-[#dde0f0]">
									Account information:
								</strong>{" "}
								Name, email address, and profile information
								provided via our authentication provider (Clerk).
							</li>
							<li>
								<strong className="text-[#dde0f0]">
									YouTube account data:
								</strong>{" "}
								When you connect a YouTube channel, we store an
								OAuth refresh token to enable automated video
								uploads on your behalf. We access only the
								scopes you explicitly authorize.
							</li>
							<li>
								<strong className="text-[#dde0f0]">
									Content data:
								</strong>{" "}
								Video ideas, AI-generated scripts, produced video
								files, and publishing metadata you create within
								the Service.
							</li>
							<li>
								<strong className="text-[#dde0f0]">
									Usage data:
								</strong>{" "}
								Log data, IP addresses, browser type, and
								interaction data collected automatically when
								you use the Service.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							3. How We Use Your Information
						</h2>
						<p>We use the information we collect to:</p>
						<ul className="list-disc pl-6 mt-3 space-y-2">
							<li>
								Provide, operate, and maintain the Service
							</li>
							<li>
								Upload videos to YouTube on your behalf using
								the YouTube Data API v3, strictly within the
								permissions you have granted
							</li>
							<li>
								Generate AI scripts and voiceovers for your
								content pipeline
							</li>
							<li>
								Send transactional emails and service
								notifications
							</li>
							<li>
								Monitor and analyze usage to improve the Service
							</li>
							<li>
								Comply with legal obligations
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							4. YouTube API Services
						</h2>
						<p>
							PilotShorts uses the{" "}
							<strong className="text-[#dde0f0]">
								YouTube Data API v3
							</strong>{" "}
							to upload videos and manage your YouTube channel on
							your behalf. By connecting your YouTube account, you
							authorize us to act within the scopes you grant.
						</p>
						<p className="mt-3">
							Our use and transfer of information received from
							Google APIs adheres to the{" "}
							<a
								href="https://developers.google.com/terms/api-services-user-data-policy"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#ef4444] hover:underline"
							>
								Google API Services User Data Policy
							</a>
							, including the Limited Use requirements.
						</p>
						<p className="mt-3">
							You can revoke PilotShorts&apos;s access to your
							YouTube account at any time via your{" "}
							<a
								href="https://myaccount.google.com/permissions"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#ef4444] hover:underline"
							>
								Google Account permissions page
							</a>
							.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							5. Data Sharing and Disclosure
						</h2>
						<p>
							We do not sell your personal information. We may
							share your information with:
						</p>
						<ul className="list-disc pl-6 mt-3 space-y-2">
							<li>
								<strong className="text-[#dde0f0]">
									Service providers:
								</strong>{" "}
								Third-party vendors who assist in operating our
								Service (Supabase for database, OpenAI for AI
								generation, ElevenLabs for voiceover, Pexels
								for stock footage, Clerk for authentication).
							</li>
							<li>
								<strong className="text-[#dde0f0]">
									Legal requirements:
								</strong>{" "}
								When required by law or to protect our rights.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							6. Data Retention
						</h2>
						<p>
							We retain your data for as long as your account is
							active or as needed to provide the Service. You may
							request deletion of your account and associated data
							at any time by contacting us.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							7. Security
						</h2>
						<p>
							We implement industry-standard security measures
							including encrypted connections (HTTPS), secure
							credential storage, and access controls. However, no
							method of transmission over the Internet is 100%
							secure.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							8. Your Rights
						</h2>
						<p>You have the right to:</p>
						<ul className="list-disc pl-6 mt-3 space-y-2">
							<li>Access the personal data we hold about you</li>
							<li>Request correction of inaccurate data</li>
							<li>
								Request deletion of your data (&quot;right to be
								forgotten&quot;)
							</li>
							<li>
								Disconnect your YouTube account at any time
							</li>
							<li>
								Object to or restrict processing of your data
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							9. Contact Us
						</h2>
						<p>
							If you have questions about this Privacy Policy or
							want to exercise your data rights, contact us at:
						</p>
						<p className="mt-3">
							<strong className="text-[#dde0f0]">Email:</strong>{" "}
							<a
								href="mailto:privacy@pilotshorts.app"
								className="text-[#ef4444] hover:underline"
							>
								privacy@pilotshorts.app
							</a>
						</p>
					</section>
				</div>

				<div className="mt-12 pt-8 border-t border-[#1c1c30]">
					<Link
						href="/"
						className="text-sm text-[#52527a] hover:text-[#dde0f0] transition-colors"
					>
						← Back to PilotShorts
					</Link>
				</div>
			</div>
		</div>
	);
}
