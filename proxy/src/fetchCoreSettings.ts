import qs from "qs";
import fetch from "node-fetch";
import { tlsAgent } from "./tlsAgent";

const CORE_SETTINGS_ENDPOINT =
  "https://online.if.test.vtb.ru/msa/api-gw/core/core-settings-backend/params";

export async function fetchCoreSettings() {
  const query = qs.stringify(
    {
      groups: [],
      version: "3.0.0.0",
      channel: "web",
    },
    { arrayFormat: "comma" },
  );

  const coreSettingsResponse = await fetch(
    `${CORE_SETTINGS_ENDPOINT}?${query}`,
    {
      method: "GET",
      agent: tlsAgent,
      headers: {
        referer: "https://online.if.test.vtb.ru",
      },
    },
  );

  const response = (await coreSettingsResponse.json()) as Record<
    string,
    Record<string, string>
  >;

  return response;
}
