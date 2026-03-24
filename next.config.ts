import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{ hostname: "i.ytimg.com" },
			{ hostname: "yt3.ggpht.com" },
			{ hostname: "picsum.photos" },
		],
	},
	experimental: {
		serverActions: {
			bodySizeLimit: "10mb",
		},
	},
};

export default nextConfig;
