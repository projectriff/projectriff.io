---
layout: splash
permalink: /
header:
  overlay_image: /images/playriff.png
  overlay_color: "#333"
excerpt: '<a href="https://github.com/projectriff/riff">https://github.com/projectriff/riff</a>'
feature_row:
  - image_path: "/images/container.png"
    alt: "containers"
    title:
    excerpt: "Functions are packaged as containers."
  - image_path: "/images/sidecar.png"
    alt: "sidecars"
    title:
    excerpt: "Event brokers drive functions."
  - image_path: "/images/events.png"
    alt: "scaling"
    title:
    excerpt: "Functions scale with events."
---

{% include feature_row %}

{% for post in site.posts %}
  {% include archive-single.html %}
{% endfor %}

---

{% for post in site.docs %}
  {% include archive-single.html %}
{% endfor %}