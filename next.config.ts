import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // publicRuntimeConfig is generally discouraged in App Router.
  // Use environment variables directly on the server (process.env.VARIABLE_NAME).
  // For client-side variables, prefix them with NEXT_PUBLIC_.
  // Remove publicRuntimeConfig if not strictly necessary for client-side exposure.
  // publicRuntimeConfig: {
  //   backendApiUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001',
  // },
};

export default nextConfig;
