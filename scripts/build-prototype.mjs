// Next.js 화면을 그대로 묶어 단일 HTML 파일(dist/wellfit-prototype.html)로 만든다.
import { build } from "esbuild";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });
execSync("npx @tailwindcss/cli -i app/globals.css -o dist/.proto.css --minify", { stdio: "inherit" });
const res = await build({
  entryPoints: ["prototype/main.tsx"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = readFileSync("dist/.proto.css", "utf8");
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#f6f7f9" />
<title>WellFit — AI 기업 웰니스 플랫폼</title>
<style>${css}</style>
</head>
<body class="antialiased">
<div id="root"></div>
<script>${js}</script>
</body>
</html>`;
writeFileSync("dist/wellfit-prototype.html", html);
console.log("dist/wellfit-prototype.html", (html.length / 1024).toFixed(0) + " KB");
