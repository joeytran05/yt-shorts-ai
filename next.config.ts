import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [{ hostname: "i.ytimg.com" }],
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
};

export default nextConfig;
