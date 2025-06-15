
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // More specific to images subdomain
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com', // For random images
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com', // General Unsplash domain if direct links are used
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gsbneivhlwaahcqssimc.supabase.co', // Your Supabase project ref
        port: '',
        pathname: '/storage/v1/object/public/**', // Adjust if your bucket or paths differ
      }
    ],
  },
};

export default nextConfig;
