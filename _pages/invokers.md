---
layout: single
permalink: /invokers/
title: "Invokers"
header:
  overlay_image: /images/invokers.jpg
sidebar:
  nav: "docs"
---

# {{ page.title }}

Invokers are the extension point in projectriff that enable different invocation models, languages and runtimes. A clean install of projectriff does not include any invokers. Install individual invokers based on the capabilities needed for your functions.

Invokers listed here are provided by both projectriff and the community. To be included in this listing, please [send a pull request](https://github.com/projectriff/projectriff.io/pulls?q=is%3Aopen+is%3Apr+label%3Ainvoker).

{% for invoker in site.invokers %}
{%- unless invoker.deprecated %}
- [{{ invoker.title }}]({{ invoker.url }})
{%- endunless %}
{%- endfor %}

### Install latest invokers

```bash
{% assign invokers = site.invokers | sort: 'name' -%}
{% include invokers.txt invokers=invokers -%}
```