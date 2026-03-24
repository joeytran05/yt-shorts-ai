import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesBento } from "@/components/landing/FeaturesBento";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const dynamic = "force-dynamic";

export default async function Landing() {
	const { userId } = await auth();
	if (userId) redirect("/dashboard");

	return (
		<div className="min-h-screen bg-[#08080f] text-[#dde0f0]">
			<LandingNav />
			<HeroSection />
			<SocialProofBar />
			<HowItWorksSection />
			<FeaturesBento />
			<PricingSection />
			<FinalCTA />
			<LandingFooter />
		</div>
	);
}
