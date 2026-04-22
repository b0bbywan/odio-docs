<p align="center">
  <a href="https://odio.love"><img src="https://odio.love/logo.png" alt="odio" width="160" /></a>  
  </p>
  <h1 align="center">odio-docs</h1>
  <p align="center"><em>Documentation site for the odio project.</em></p>
  <p align="center">
  <a href="https://github.com/b0bbywan/odio-docs/releases"><img src="https://img.shields.io/github/v/release/b0bbywan/odio-docs?include_prereleases" alt="Release" /></a>
  <a href="https://github.com/b0bbywan/odio-docs/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-BSD--2--Clause-blue" alt="License" /></a>
  <a href="https://github.com/b0bbywan/odio-docs/actions/workflows/lint.yml"><img src="https://github.com/b0bbywan/odio-docs/actions/workflows/lint.yml/badge.svg" alt="Lint" /></a>
  <a href="https://github.com/sponsors/b0bbywan"><img src="https://img.shields.io/github/sponsors/b0bbywan?label=Sponsor&logo=GitHub" alt="GitHub Sponsors" /></a>  
  </p>
  <p align="center">
  <a href="https://docs.odio.love"><img src="https://img.shields.io/badge/Live%20docs-5ab81e" alt="Live at docs.odio.love" /></a> 
  </p>
  <p align="center">  
  Part of the <a href="https://odio.love">odio</a> project.
  </p>
  <p align="center">
  <a href="https://astro.build/"><img src="https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white" alt="Astro" /></a>
  <a href="https://starlight.astro.build/"><img src="https://img.shields.io/badge/Starlight-7C3AED" alt="Starlight" /></a>
  <a href="https://github.com/features/actions"><img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white" alt="GitHub Actions" /></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>
  
  # Starlight Starter Kit: Basics

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

```
npm create astro@latest -- --template starlight
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro + Starlight project, you'll see the following folders and files:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [Starlight’s docs](https://starlight.astro.build/), read [the Astro documentation](https://docs.astro.build), or jump into the [Astro Discord server](https://astro.build/chat).
