import type {NextConfig} from 'next';

// Define the backend URL, prioritizing environment variables but falling back to the Render URL
const backendApiUrl = process.env.BACKEND_API_URL || 'https://seedvault.onrender.com';
console.log(`[next.config.ts] Using Backend API URL: ${backendApiUrl}`);

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
  // Define environment variables available to the Node.js environment during build and runtime.
  // This makes `process.env.BACKEND_API_URL` available in Server Components and Server Actions.
  // For client-side access (if needed, which is unlikely for the API URL), use `NEXT_PUBLIC_`.
  env: {
    BACKEND_API_URL: backendApiUrl,
    // NEXT_PUBLIC_BACKEND_API_URL: backendApiUrl, // Uncomment if needed client-side (discouraged)
  },
  // publicRuntimeConfig is generally discouraged in App Router.
  // Use environment variables directly via process.env.VARIABLE_NAME.
  // The `env` property above achieves making it available server-side.
  // publicRuntimeConfig: {
  //   backendApiUrl: backendApiUrl,
  // },
};

export default nextConfig;
