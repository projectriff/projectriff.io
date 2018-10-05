---
layout: doc
title: "Getting started"
permalink: /docs/getting-started/
excerpt: "How to run Knative using **riff**"
header:
  overlay_image: /images/sunrise.jpg
  overlay_filter: 0.3
  overlay_color: "#333"
redirect_from:
- /docs/
---

# Pick your environment

While riff should work in any certified Kubernetes environment, we actively test with these environments:

{% for doc in site.docs %}
  {% if doc.categories contains 'getting-started' %}
    {% include archive-single.html post=doc title=doc.short_title %}
  {% endif %}
{% endfor %}
