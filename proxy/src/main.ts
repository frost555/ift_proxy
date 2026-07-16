import { fetchCoreSettings } from "./fetchCoreSettings";
import { getIndexHtml } from "./getIndexHtml";
import { writeFileSync } from "fs";

export const main = async () => {
  const coreSettings = await fetchCoreSettings();
  const html = await getIndexHtml(coreSettings);

  console.log(html);

  writeFileSync("./build/index.html", html, { encoding: "utf8" });
};

main();
