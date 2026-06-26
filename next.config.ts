/** @type {import('next').NextConfig} */
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '<https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js>; rel=preload; as=script',
          },
        ],
      },
    ];
  },
};

export default nextConfig;