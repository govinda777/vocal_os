const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  turbopack: {}
};

module.exports = withPWA(nextConfig);
