---
layout: single
title: "Announcing riff v0.1.0 on Knative"
header:
  overlay_image: /images/shrubbery.jpg
  overlay_filter: 0.1
  overlay_color: "#dfd"
excerpt:
  With a new CLI and a new architecture for running in Knative   
permalink: /blog/announcing-riff-0-1-0-on-Knative/
---

We are excited to announce that the riff team has re-architected the riff core, bringing essential aspects of riff to Knative. This is the first release of riff on Knative.

[Knative](https://github.com/knative/docs) is a new open source project recently announced at [Google Cloud Next '18](https://cloud.withgoogle.com/next18).

Knative provides Kubernetes-native APIs for deploying serverless-style functions, applications, and containers to an auto-scaling runtime. 

## riff CLI will install Knative

Please follow one of our new getting started guides to download the latest riff CLI and install Knative onto a Kubernetes cluster. We currently support GKE and minikube.

## Functions build on riff Invokers, run on Knative

The riff CLI creates functions using a Knative [build](https://github.com/knative/build) template based on [Kaniko](https://github.com/GoogleContainerTools/kaniko), to build container images from function source code.

Once built, the Functions are deployed and run as Knative [Services](https://github.com/knative/serving/blob/master/docs/spec/overview.md#resource-types) with support for autoscaling, revisions, and traffic routing.

The getting started guides provide step by step instructions to create a sample function.

## Buses, Channels, Subscriptions

The riff sidecar architecture from earlier releases has changed in order to leverage the Knative revisions and routes.

This preserves the biggest differentiator of riff, which was the ability of riff functions to consume and produce event streams from topics on message brokers.

![riff Knative pubsub resources](/images/riff-knative-pubsub-resources.png)

