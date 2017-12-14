---
layout: splash
permalink: /
header:
  overlay_image: /images/sunrise.jpg
excerpt: 'a service for executing Functions <br />in response to Events. <small><a href="https://github.com/projectriff/riff"> <br />https://github.com/projectriff/riff</a></small>'
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