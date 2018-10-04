---
layout: splash
permalink: /
header:
  overlay_image: /images/playriff2.jpg
  overlay_color: "#333"
excerpt: '<a href="/docs">Get started with riff</a>'
feature_row:
  - image_path: "/images/build.png"
    alt: Cloud Native Buildpacks logo
    url: https://buildpacks.io
    btn_label: Cloud Native Buildpacks
    excerpt: "Buildpacks combine functions with invokers producing runnable containers."
  - image_path: "/images/knative.png"
    alt: Knative logo
    url: https://github.com/knative/serving
    btn_label: Knative Serving
    excerpt: "Knative serving runs container workloads with multiple revisions and 0-to-N autoscaling."
  - image_path: "/images/events.png"
    alt: "scaling"
    btn_label: Knative Eventing
    url: https://github.com/knative/eventing
    excerpt: "Knative eventing connects workloads and event sources over broker-backed pub-sub channels."
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