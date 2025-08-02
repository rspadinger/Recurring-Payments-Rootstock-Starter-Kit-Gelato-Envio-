import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    /* config options here */
    typescript: {
        // !! WARNING !!
        // temporarily ignore build errors for a quick test deploy
        ignoreBuildErrors: true,
    },
}

export default nextConfig
