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

## What is riff?
riff is a function service designed to run on Kubernetes.
- Developers write functions.
- Functions are packaged as containers.
- Kubernetes custom resources keep track of functions and event topics.
- riff watches event topics to autoscale functions.
- Sidecars handle connections to event brokers.
- This enables first class event stream processing with riff.