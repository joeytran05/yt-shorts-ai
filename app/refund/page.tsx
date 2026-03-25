import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Refund Policy — PilotShorts",
	description: "Refund Policy for PilotShorts",
};

export default function RefundPage() {
	return (
		<div className="min-h-screen bg-[#08080f] text-[#dde0f0]">
			<div className="max-w-3xl mx-auto px-6 py-16">
				{/* Header */}
				<div className="mb-12">
					<Link
						href="/"
						className="font-mono text-sm font-bold tracking-tight mb-8 inline-block"
					>
						<span className="text-[#dde0f0]">PILOT</span>
						<span className="text-[#ef4444]">SHORTS</span>
					</Link>
					<h1 className="text-3xl font-bold mt-4 mb-2">Refund Policy</h1>
					<p className="text-sm text-[#52527a]">Last updated: March 25, 2026</p>
				</div>

				<div className="space-y-8 text-[#a0a3b8] leading-relaxed">
					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							1. Overview
						</h2>
						<p>
							PilotShorts (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;)
							offers a subscription-based service for automated YouTube Shorts
							production. This Refund Policy explains when and how refunds are
							issued for payments made at{" "}
							<strong className="text-[#dde0f0]">pilotshorts.app</strong>.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							2. Subscription Refunds
						</h2>
						<p>
							We offer a <strong className="text-[#dde0f0]">7-day refund</strong>{" "}
							on new subscriptions. If you are not satisfied with the service
							within 7 days of your first payment, contact us at{" "}
							<a
								href="mailto:support@pilotshorts.app"
								className="text-[#ef4444] hover:underline"
							>
								support@pilotshorts.app
							</a>{" "}
							and we will issue a full refund, no questions asked.
						</p>
						<p className="mt-3">
							After the 7-day window, subscription payments are
							non-refundable. You may cancel at any time, and your access
							will continue until the end of the current billing period.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							3. Renewal Refunds
						</h2>
						<p>
							If you are charged for a renewal and wish to cancel, contact us
							within <strong className="text-[#dde0f0]">48 hours</strong> of
							the renewal charge and we will issue a refund for that renewal,
							provided you have not used the service during that renewal period.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							4. Non-Refundable Situations
						</h2>
						<p>Refunds will not be issued in the following cases:</p>
						<ul className="list-disc pl-6 mt-3 space-y-2">
							<li>
								Requests made more than 7 days after the initial payment (or
								48 hours after a renewal charge)
							</li>
							<li>
								Accounts terminated for violations of our{" "}
								<Link href="/terms" className="text-[#ef4444] hover:underline">
									Terms of Service
								</Link>
							</li>
							<li>
								Partial-month usage — we do not prorate refunds for unused
								days within a billing period
							</li>
							<li>
								Dissatisfaction with AI-generated content quality, as output
								varies by input and is inherently subjective
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							5. How to Request a Refund
						</h2>
						<p>To request a refund, email us at:</p>
						<p className="mt-3">
							<strong className="text-[#dde0f0]">Email:</strong>{" "}
							<a
								href="mailto:support@pilotshorts.app"
								className="text-[#ef4444] hover:underline"
							>
								support@pilotshorts.app
							</a>
						</p>
						<p className="mt-3">
							Please include your account email address and the reason for
							your request. We aim to respond within 2 business days. Approved
							refunds are processed within 5–10 business days depending on
							your payment provider.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							6. Cancellation
						</h2>
						<p>
							You may cancel your subscription at any time from the Billing
							section in your account settings. Cancellation stops future
							charges; you retain access until the end of the current billing
							period. Cancellation does not automatically trigger a refund.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							7. Changes to This Policy
						</h2>
						<p>
							We may update this Refund Policy from time to time. Changes
							will be posted on this page with an updated &quot;Last
							updated&quot; date. Continued use of the Service after changes
							constitutes acceptance of the revised policy.
						</p>
					</section>

					<section>
						<h2 className="text-lg font-semibold text-[#dde0f0] mb-3">
							8. Contact
						</h2>
						<p>For questions about this policy, contact us at:</p>
						<p className="mt-3">
							<strong className="text-[#dde0f0]">Email:</strong>{" "}
							<a
								href="mailto:support@pilotshorts.app"
								className="text-[#ef4444] hover:underline"
							>
								support@pilotshorts.app
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
