import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */

const isDev = process.env.NEXT_ENV === "development";

const apiDestination = isDev
  ? process.env.NEXT_PUBLIC_DEV_URL
  : process.env.NEXT_PUBLIC_CENTRAL_URL;

const newsApiDestination = process.env.NEXT_PUBLIC_NEWS_API_URL || apiDestination;

const nextConfig = {

  webpack: (config) => {
    return config;
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/news/:id/like",
        destination: `${newsApiDestination}/api/v1/news/:id/like`,
      },
      {
        source: "/api/v1/news/:id/comment",
        destination: `${newsApiDestination}/api/v1/news/:id/comment`,
      },
      {
        source: "/api/v1/news/:id/comments",
        destination: `${newsApiDestination}/api/v1/news/:id/comments`,
      },
      {
        source: "/api/v1/news/:path*",
        destination: `${newsApiDestination}/api/v1/news/:path*`,
      },
      {
        source: "/api/v1/:path*",
        destination: `${apiDestination}/api/v1/:path*`,
      },
      {
        source: "/images/:path*",
        destination: `${process.env.NEXT_PUBLIC_S3_BASE_URL}/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/api/v1/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, x-csrf-token, x-product-key",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: isDev, // Disable on localhost to avoid redirect loops & caching issues in dev mode
  register: true,
  skipWaiting: true,
});

export default withPWA(nextConfig);