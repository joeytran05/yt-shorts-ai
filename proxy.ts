import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
	"/dashboard(.*)",
	"/settings(.*)",
	"/api/auth(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) {
		const { userId } = await auth();
		if (!userId) return NextResponse.redirect(new URL("/", req.url));
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
