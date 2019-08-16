## projectriff.io website
[![Netlify Status](https://api.netlify.com/api/v1/badges/19a10200-d02a-45dd-a275-e873334f8624/deploy-status)](https://app.netlify.com/sites/hardcore-darwin-8dc428/deploys)


This repo contains configuration and markdown content for [projectriff.io](projectriff.io).

The site is built with [Docusaurus](https://docusaurus.io/), but does not use the built-in Docusuarus versioning. A complete set of markdown content is maintained in a directory for each published version, e.g the `v0.3.x` documentation is maintained in `docs/v0.3`.

Generated HTML is published online using Netlify. The build configuration for Netlify is in `netlify.toml`.

### Getting started
To bring in dependencies for the first time:

```sh
cd website
npm install
```

To preview using a local dev server:
```sh
npm start
```

### Creating docs pages

Documentation markdown files live in the `/docs` directory at the same level as this `/website` directory. Each markdown file should include at least the following frontmatter:

```markdown
---
id: documentation-url-slug
title: Documentation Page Title
---

Content...
```
To allow access through the sidebar, docs pages need to be referenced (by their id) in `sidebar.json`.

### Creating blog posts

Blog posts live in the `/website/blog` directory.

Blog post files should follow a naming convention of `YYYY-MM-DD-my-blog-post-title.md`. The lowercase, slugified name following the date will be used for the page url.

```markdown
---
title: New Blog Post
---

Lorem Ipsum...
```
