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

Invokers are the extension point in projectriff that enable different invocation models, languages and runtimes.

{% for invoker in site.invokers %}
{%- unless invoker.deprecated %}
- [{{ invoker.title }}]({{ invoker.url }})
{%- endunless %}
{%- endfor %}
