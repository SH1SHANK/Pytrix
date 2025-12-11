import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Security headers for SharedArrayBuffer support.
   * Required for true interruption of Python execution via Web Worker.
   *
   * Cross-Origin-Opener-Policy: same-origin
   * Cross-Origin-Embedder-Policy: require-corp
   *
   * WARNING: These headers enable cross-origin isolation which may affect:
   * - Third-party scripts/embeds
   * - window.opener access
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
