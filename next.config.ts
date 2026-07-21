import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // @wagmi/connectors의 Coinbase 커넥터가 참조하는 결제(x402) 모듈은
    // 설치하지 않는 선택적 의존성이라 빈 모듈로 처리한다
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/evm": false,
      "@x402/core": false,
      "@x402/svm": false,
      "@x402/svm/exact/client": false
    };
    return config;
  }
};

export default nextConfig;
