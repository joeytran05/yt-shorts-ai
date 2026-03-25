import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service — PilotShorts",
	description: "Terms of Service for PilotShorts",
};

export default function TermsPage() {
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
						Terms of Service
					</h1>
					<p className="text-sm text-[#52527a]">
						Last updated: March 25, 2026
					</p>
				</div>

				<div className="space-y-8 text-[#a0a3b8] leading-relaxed">
					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							1. Acceptance of Terms
						</h2>
						<p>
							By accessing or using PilotShorts (&quot;Service&quot;)
							at{" "}
							<strong className="text-[#dde0f0]">
								pilotshorts.app
							</strong>
							, you agree to be bound by these Terms of Service.
							If you do not agree, do not use the Service.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							2. Description of Service
						</h2>
						<p>
							PilotShorts is an automated YouTube Shorts production
							platform. The Service uses artificial intelligence to
							discover trending content, generate video scripts,
							synthesize voiceovers, render videos using stock
							footage, and publish content to YouTube channels on
							your behalf.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							3. Eligibility
						</h2>
						<p>
							You must be at least 13 years of age to use this
							Service. By using the Service, you represent that
							you meet this requirement and have the legal capacity
							to enter into this agreement.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							4. User Accounts
						</h2>
						<p>
							You are responsible for maintaining the
							confidentiality of your account credentials and for
							all activities that occur under your account. You
							agree to notify us immediately of any unauthorized
							use of your account.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							5. YouTube API and Content Policy
						</h2>
						<p>
							By connecting your YouTube account, you authorize
							PilotShorts to upload videos and interact with the
							YouTube Data API v3 on your behalf. You agree that:
						</p>
						<ul className="list-disc pl-6 mt-3 space-y-2">
							<li>
								You are solely responsible for all content
								uploaded to YouTube through the Service
							</li>
							<li>
								Content must comply with{" "}
								<a
									href="https://www.youtube.com/t/terms"
									target="_blank"
									rel="noopener noreferrer"
									className="text-[#ef4444] hover:underline"
								>
									YouTube&apos;s Terms of Service
								</a>{" "}
								and Community Guidelines
							</li>
							<li>
								You will not use the Service to upload content
								that is illegal, infringing, harmful, or
								deceptive
							</li>
							<li>
								PilotShorts is not responsible for any content
								published to YouTube through the Service
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							6. Acceptable Use
						</h2>
						<p>You agree not to:</p>
						<ul className="list-disc pl-6 mt-3 space-y-2">
							<li>
								Use the Service for any illegal or unauthorized
								purpose
							</li>
							<li>
								Attempt to reverse engineer, hack, or disrupt
								the Service
							</li>
							<li>
								Use the Service to generate spam, misinformation,
								or harmful content
							</li>
							<li>
								Share, resell, or sublicense access to the
								Service without authorization
							</li>
							<li>
								Exceed the API usage limits imposed by your
								subscription plan
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							7. Subscription and Billing
						</h2>
						<p>
							Certain features of the Service require a paid
							subscription. By subscribing, you agree to pay the
							applicable fees. Subscriptions are billed on a
							monthly basis. You may cancel at any time; access
							continues until the end of the current billing
							period. We reserve the right to change pricing with
							30 days notice.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							8. Intellectual Property
						</h2>
						<p>
							You retain ownership of all content you create using
							the Service. You grant PilotShorts a limited license
							to process and store your content solely to provide
							the Service. The PilotShorts platform, branding, and
							underlying technology remain our exclusive property.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							9. Third-Party Services
						</h2>
						<p>
							The Service integrates with third-party services
							including Google/YouTube, OpenAI, ElevenLabs, Pexels,
							and Supabase. Your use of these integrations is also
							subject to those providers&apos; terms of service.
							We are not responsible for the availability or
							conduct of third-party services.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							10. Disclaimer of Warranties
						</h2>
						<p>
							The Service is provided &quot;as is&quot; without
							warranties of any kind, express or implied. We do
							not warrant that the Service will be uninterrupted,
							error-free, or that AI-generated content will meet
							your requirements.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							11. Limitation of Liability
						</h2>
						<p>
							To the fullest extent permitted by law, PilotShorts
							shall not be liable for any indirect, incidental,
							special, or consequential damages arising from your
							use of the Service, including loss of revenue,
							data, or YouTube channel standing.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							12. Termination
						</h2>
						<p>
							We reserve the right to suspend or terminate your
							account at our discretion if you violate these Terms.
							You may terminate your account at any time by
							contacting us or deleting your account through the
							dashboard settings.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							13. Changes to Terms
						</h2>
						<p>
							We may update these Terms from time to time. We will
							notify you of material changes via email or a notice
							within the Service. Continued use of the Service
							after changes constitutes acceptance of the new
							Terms.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							14. Contact
						</h2>
						<p>
							For questions about these Terms, contact us at:
						</p>
						<p className="mt-3">
							<strong className="text-[#dde0f0]">Email:</strong>{" "}
							<a
								href="mailto:legal@pilotshorts.app"
								className="text-[#ef4444] hover:underline"
							>
								legal@pilotshorts.app
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
