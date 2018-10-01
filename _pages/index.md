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
    excerpt: "Sidecars connect functions with event brokers."
  - image_path: "/images/events.png"
    alt: "scaling"
    title:
    excerpt: "Functions scale with events."
---

{% include feature_row %}

<article class="page">
  {% for post in site.posts limit: 3 %}
    {% include archive-single.html %}
  {% endfor %}
  <p><a href="/blog/">More posts</a></p>

  <hr />

  {% for post in site.docs limit: 3 %}
    {% include archive-single.html %}
  {% endfor %}
  <p><a href="/docs/">More docs</a></p>
</article>