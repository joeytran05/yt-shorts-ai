import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
	const { userId } = await auth();
	if (userId) redirect("/dashboard");
	// Signed-out: layout's <Show when="signed-out"> overlay renders
	return null;
}
