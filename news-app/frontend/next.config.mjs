/** @type {import('next').NextConfig} */

const isDev = process.env.NEXT_ENV === "development";

const devUrl = process.env.NEXT_PUBLIC_DEV_URL;
const centralUrl = process.env.NEXT_PUBLIC_CENTRAL_URL;

const baseUrl = isDev ? devUrl : centralUrl;

const nextConfig = {

  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },

  /* ---------- API PROXY ---------- */

  async rewrites() {

    return [
      {
        source: "/api/v1/:path*",
        destination: `${baseUrl}/api/v1/:path*`,
      },
      {
        source: "/images/:path*",
        destination: `${process.env.NEXT_PUBLIC_S3_BASE_URL}/:path*`,
      },
    ];

  },

  /* ---------- HEADERS ---------- */

  async headers() {

    return [
      {
        source: "/api/v1/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization, x-product-key, x-device-id, x-device-type",
          },
        ],
      },
    ];

  },

};

export default nextConfig;