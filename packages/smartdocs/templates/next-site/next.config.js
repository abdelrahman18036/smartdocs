/** @type {import('next').NextConfig} */
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Only enable export mode for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    distDir: '../smartdocs-dist',
  })
}

module.exports = withMDX(nextConfig)