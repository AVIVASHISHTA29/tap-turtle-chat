/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/api/:path*", // Apply headers to all API routes
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" }, // Use specific origin for production
                    { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "Content-Type" },
                ],
            },
        ];
    },
};

export default nextConfig;
