import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages that must run as regular Node modules (not bundled)
  serverExternalPackages: ["@prisma/client", "bcryptjs", "node-cron", "nodemailer"],
  // Allow opening the dev server from other computers on the local network
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  poweredByHeader: false,
};

export default nextConfig;
