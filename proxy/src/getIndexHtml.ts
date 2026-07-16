import fetch from "node-fetch";

export const getIndexHtml = async (
  coreSettings: Record<string, Record<string, string>>,
) => {
  const hostName = "mf_1488_core";

  const hostVersion = coreSettings["mf_versions_platform"]["mf_1488_core"];
  const res = await fetch(
    `https://online.if.test.vtb.ru/mf/${hostName}/${hostVersion}/assets-manifest.json`,
  );
  const manifest = await res.json();

  const fileNames = ["remoteEntry.js", ...manifest];

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, minimum-scale=1.0, viewport-fit=cover" />
        <title><%= _projectName %></title>
        <link rel="stylesheet" href="/fonts.css" />
        <script src="/config.js"></script>
        ${fileNames.map((fileName) => `<script src='/mf/${hostName}/${hostVersion}/${fileName}' defer="true"></script>`).join("\n")}
        <style>
          body.light {
            background-color: #fff;
          }
          body.light #splash svg #firstCircle {
            stroke: rgba(34, 37, 43, 0.08);
          }
          body.light #splash svg #lastCircle {
            stroke: #0663EF;
          }
          body.dark {
            background-color: #101113;
          }
          body.dark #splash svg #firstCircle {
            stroke: rgba(255, 255, 255, 0.08);
          }
          body.dark #splash svg #lastCircle {
            stroke: #126CFD;
          }

          #splash svg #lastCircle {
            stroke-dasharray: 187;
            stroke-dashoffset: 0;
            transform-origin: center center;
            animation: dash 1.4s ease-in-out 0s infinite;
          }

          #splash {
            height: 100vh;
            height: 100dvh;
            width: 100vw;
            width: 100dvw;
            background: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 999999;
          }

          #splash svg {
            animation: rotation 1.4s linear 0s infinite;
          }

          @keyframes rotation {
            0% {
              transform: rotate(0);
            }
            100% {
              transform: rotate(270deg);
            }
          }
          @keyframes dash {
            0% {
              stroke-dashoffset: 187;
              transform: rotate(0);
            }
            50% {
              stroke-dashoffset: 46.75;
              transform: rotate(135deg);
            }
            100% {
              stroke-dashoffset: 187;
              transform: rotate(450deg);
            }
          }
        </style>
    </head>
    <body>
        <script> 
            
            window._coreSettings = ${JSON.stringify(coreSettings, null, 2)};
            window._VTB.cmsUrl = "";
        </script>
        <div id="splash">
            <svg viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                <circle fill="none" stroke-width="8" stroke-linecap="round" cx="33" cy="33" r="29" id="firstCircle" />
                <circle fill="none" stroke-width="8" stroke-linecap="round" cx="33" cy="33" r="29" id="lastCircle" />
            </svg>
        </div>
        <div id="root"></div>
    </body>
</html>`;
};
