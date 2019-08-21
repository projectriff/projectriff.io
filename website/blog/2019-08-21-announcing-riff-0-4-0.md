---
title: "Announcing riff v0.4.0"
---

We are happy to announce the release of riff v0.4.0. Thank you all riff, Cloud Native Buildpack, and Knative contributors.

The riff CLI can be downloaded from our [releases page](https://github.com/projectriff/cli/releases/tag/v0.4.0) on GitHub. Please follow one of the [getting started](/docs/v0.4/getting-started) guides, to create a new cluster on GKE, Minikube, Docker Desktop for Mac, or Docker Desktop for Windows.

A lot has changed, buckle up.

<!--truncate-->

![Boston skyline at night](assets/boston-night.jpeg)

## Notable changes

### Knative and Istio

riff no longer has a hard dependency on Knative and Istio. Knative integration is provided by riff's [Knative runtime](#knative-runtime), which is available in clusters with Knative Serving installed. Istio is only required for the Knative runtime.

### builds

riff Builds now encompass more than functions with the addition of application and container builds. Each build resource reports the latest image that a [runtime](#runtimes) uses to deploy the built workload. The built image is always reported as a digested image to make the detection and rollout of changes more deterministic.

Builds are transitioning from one-off tasks to continuous streams of images. riff 0.4 sets up the API to enable ongoing updated builds, but does not yet hook into sources to trigger rebuilding.

#### function builds

A riff Function uses buildpacks with function invokers to convert function source code into a runnable container. The same invokers and buildpacks provided by riff 0.3 are available. Unlike riff 0.3, a Function resource is only responsible for building a container image. The deployment of the container is managed by the [runtime](#runtimes).

#### application builds

In addition to functions, riff can now build Applications using the [Cloud Foundry, Cloud Native Buildpack builder](https://hub.docker.com/r/cloudfoundry/cnb).

#### container builds

A riff Container resource is a way to bring your own builds to riff. It resolves to an existing container image to a digest providing the same interface as Application and Function.

### runtimes

Runtimes deploy built containers in different ways. By offering users a choice of Runtimes, we plan to make the platform more extensible and support a variety of workloads including long-running applications, stream processors, and finite jobs. This release includes two runtimes, Core and Knative,and Streaming is under development.

#### Core runtime

The Core runtime is a thin layer creating a Kubernetes Deployment and a Service that targets the deployment. The deployment is automatically updated for new build images creating a new replicaset based on the rollout strategy.

The workload is accessible from within the cluster by default, but must be explicitly exposed externally. A single replica is run by default, but the deployment can be targeted by a HorizontalPodAutoscaler or any other scaler that supports the `/scale` subresource on deployment. Custom scalers, observability and ingress can be provided for Deployers as none are provided by default.

See the [Core runtime](/docs/v0.4/runtimes/core) docs for details.

#### Knative runtime

The Knative runtime is most analogous to riff 0.3. It requires that Knative Serving and Istio are installed into the cluster in addition to riff. There are two models for consuming Knative: Deployers and Adapters.

Deployers create a Knative Configuration and Route from the latest image available for a referenced build. The Configuration is updated as the build produces new images.

Adapters reference an existing Knative Service or Configuration, updating the image property as the build produces new ones. The Route rules are preserved as new images trigger the creation of Knative Revisions.

See the [Knative runtime docs](/docs/v0.4/runtimes/knative) for details.

#### Streaming runtime

The new streaming runtime is under active development, and not included in this release.

The goal of the streaming runtime is to enable workloads to consume, process, and produce message streams, in conjunction with streaming platforms like Kafka.

Streaming component development can be tracked on GitHub, including:
- [streaming-processor](https://github.com/projectriff/streaming-processor)
- [kafka-provider](https://github.com/projectriff/kafka-provider)
- [streaming-http-adapter](https://github.com/projectriff/streaming-http-adapter)

### riff CLI

The [riff CLI](/docs/v0.4/cli/riff) was rewritten from the ground up to support the new riff Build and Runtime models. The CLI behavior is more consistent and predictable. No more deleting a "service" which was created as a function.

The most significant change is that creating a function builds the container image, but it no longer deploys the function as a Knative workload. Functions are deployed using the deployment features of the runtime, and Knative is just one runtime option

riff is no longer installed into a Kubernetes cluster using the CLI. [Helm charts](#helm-charts) are available to aid the installation, and we are exploring other installation options, like [Cloud Native Application Bundles](https://cnab.io) (CNAB).

Other highlights of the new CLI include:
- table `list`ings with rolled up status
- colorized output
- `--tail` to watch logs during `create` until the resource is ready or fails
- `tail` command to watch all logs for a resource until canceled
- `delete` and `list` for every resource that is `create`d


### riff System and CRDs

Powering the new build and runtime models is [riff System](https://github.com/projectriff/system). riff System provides Kubernetes CRDs and a controller to reconcile the state of these custom riff resources into other resources, to achieve the desired outcome.

The system provides four API groups, one for builds and one per runtime:

- `build.projectriff.io/v1alpha1`
  - `Application` - applications built from source using application buildpacks
  - `Function` - functions built from source using function buildpacks
  - `Container` - polls a container repository for updated images
- `core.projectriff.io/v1alpha1`
  - `Deployer` - deployers map applications, functions, or containers to Kubernetes core resources: Deployment and Service
- `streaming.projectriff.io/v1alpha1`
  - `Stream` - streams of messages
  - `Processor` - processors apply functions to messages on streams
- `knative.projectriff.io/v1alpha1`
  - `Adapter` - deployers map applications, functions, or containers to an existing Knative Service or Configuration.
  - `Deployer` - deployers map applications, functions, or containers to Knative resources: Configuration and Route

The [riff CLI](#riff-cli) is but one client that interacts with these CRDs. One the the design goals was to avoid deep knowledge of the system implementation in the CLI. All of that knowledge lives behind the CRDs and is managed by the system. We hope to see additional clients consume these CRDs to provide riff outcomes.

### Helm charts

riff and its dependencies are published as Helm charts in a custom chart repository.

```sh
helm repo add projectriff https://projectriff.storage.googleapis.com/charts/releases
```

More information about the charts is available [on GitHub](https://github.com/projectriff/charts/tree/v0.4.x#readme).

## Looking to the future

<!-- TODO describe the 0.5 road map at a high level -->

- replace Knative Build (which has reached end-of-life) with Pivotal Build Service for continuous builds ([projectriff/riff#1348](https://github.com/projectriff/riff/issues/1348))
- continued development of the Streaming runtime ([projectriff/riff#1159](https://github.com/projectriff/riff/issues/1159))
- a better install/uninstall/upgrade experience for runtimes ([projectriff/riff#1352](https://github.com/projectriff/riff/issues/1352))
- use Kubebuilder ([projectriff/system#58](https://github.com/projectriff/system/issues/58))
- [and more](https://app.zenhub.com/workspaces/projectriff-5d5ace6071abaa14abfe8680/board?milestones=v0.5.0%23&filterLogic=any&repos=98690441,109905076,153138133,110752475,194789082,175896907,192814161)
