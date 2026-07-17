import https from "https";

export const tlsAgent = new https.Agent({
  rejectUnauthorized: false,
});
