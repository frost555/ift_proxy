import {
  IS_MOCK_LOGGING,
  PROXY_HCMS_TARGET_URL,
  PROXY_MF_ALIASES,
  PROXY_TARGET_URL,
  PROXY_WSO_TARGET_URL,
} from "../../../lib/env";
import { Configuration } from "webpack";
import { normalizePathToAllOs } from "../../../lib/helpers";

// PROXY_TARGET=https://online.if.test.vtb.ru

// # Авторизация
// PROXY_WSO_TARGET=https://sso.if.test.vtb.ru

// # Если необходимо задать кастомный урл для hcms.
// PROXY_HCMS_TARGET=https://h.if.vtb.ru

/**
 * Настройки проксирования для микрофронтов.
 * @param proxyMfAliases Список микрофронтов с адресами проксирования.
 */
export const getMfProxy = (proxyMfAliases: string[] | undefined) => {
  const mfProxy: Configuration["devServer"]["proxy"] = [];

  proxyMfAliases?.forEach((entry) => {
    const [mfName, proxyPath] = entry.split("=");

    if (mfName && proxyPath) {
      // @ts-ignore
      let requestLogger: Configuration["devServer"]["proxy"]["onProxyReq"];

      if (IS_MOCK_LOGGING) {
        requestLogger = (_proxyReq, req, _res, _options) => {
          const method = req.method.toLowerCase();
          const resourcePath = normalizePathToAllOs(`${proxyPath}${req.url}`);

          console.log(
            `\x1b[37m\x1b[41mproxy-mf\x1b[0m \x1b[34m${mfName} \x1b[32m${method} \x1b[35m${resourcePath}\x1b[0m`,
          );
        };
      }

      mfProxy.push({
        context: `/mf/${mfName}/`,
        target: proxyPath,
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          [`mf/${mfName}/.*?/`]: "",
        },
        onProxyReq: requestLogger,
      });
    }
  });

  return mfProxy;
};

export const proxy: Configuration["devServer"]["proxy"] = [
  ...getMfProxy(PROXY_MF_ALIASES),
  {
    context: ["/oauth2", "/oidc", "/v1/oauth2", "/v2/oauth2"],
    target: PROXY_WSO_TARGET_URL,
    changeOrigin: true,
    secure: false,
  },
  {
    context: [
      "/services",
      "/msa",
      "/mf",
      "/async",
      "/processor",
      "/content",
      "/webauth",
      "/routing",
    ],
    target: PROXY_TARGET_URL,
    changeOrigin: true,
    secure: false,
  },
  {
    context: ["/projects"],
    target: PROXY_HCMS_TARGET_URL,
    changeOrigin: true,
    secure: false,
  },
];
