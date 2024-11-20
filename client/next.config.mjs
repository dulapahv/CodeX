/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@monaco-editor/react', '@mdxeditor/editor'],
  },
};

export default nextConfig;
