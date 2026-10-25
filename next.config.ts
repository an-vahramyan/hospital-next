import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Пакеты, которые должны работать как обычные Node-модули (не бандлиться)
  serverExternalPackages: ["@prisma/client", "bcryptjs", "node-cron", "nodemailer"],
  // Разрешить открывать dev-сервер с других компьютеров локальной сети
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  poweredByHeader: false,
};

export default nextConfig;
