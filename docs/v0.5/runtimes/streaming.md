---
id: streaming
title: Streaming Runtime
sidebar_label: Streaming
---

The streaming runtime allows execution of functions on **streams** of messages, permitting more complex interactions than the simple request / reply used by the [core](core.md) or [knative](knative.md) runtimes.

## Install

The Streaming runtime is not installed with riff by default. See the [getting started guide](../getting-started.md) for how to install the prerequisits and riff Build in your Kubernetes environment.

You can then install the Streaming runtime and it's dependencies using the following:

```sh
kapp deploy -n apps -a keda -f https://storage.googleapis.com/projectriff/release/0.5.0/keda.yaml
```

```sh
kapp deploy -n apps -a riff-streaming-runtime -f https://storage.googleapis.com/projectriff/release/0.5.0/riff-streaming-runtime.yaml
```

> NOTE: Not all invokers support streaming. Invokers conforming to the full invoker [specification](https://github.com/projectriff/invoker-specification) can be used with the streaming runtimes, while some can't. In particular, the [command](../invokers/command.md) invoker does not support streaming.

## Gateways

When using the streaming runtime, messages flow between functions using **streams**, which are backed by some concrete messaging system, such as Kafka.
**Gateways** abstract away the protocol details of concrete messaging systems (riff uses [liiklus](https://github.com/bsideup/liiklus) to that effect), as well as the way to provision topics/queues corresponding to each stream. 

Gateways are namespaced resources and manage streams in their own namespace. They typically target their own messaging system, but are implemented in such a way that two different gateway instances could use the same broker (_e.g._ the same Kafka cluster) without interference.
Conversely, functions can interact with streams managed by two (or more) different gateways.

The reconciliation of some gateways is taken care of by the riff streaming runtime, while it is expected that _extension_ gateways may be handled by custom controllers.
The configuration needed by each kind of gateway varies greatly depending on the backing message broker. For both of these reasons, creation of an instance of a gateway is not carried out _via_ the riff CLI, but rather "manually" using yaml files. Additionally, the installation of concrete message brokers (inside or outside the cluster) is out of scope of this document.

### KafkaGateway

As of riff 0.5.x, one kind of **Gateway** available is **KafkaGateway**, which maps each riff stream to a Kafka _topic_.

If you don't have Kafka installed in your cluster you can create a single node Kafka install using Helm 3 [(docs)](https://helm.sh/docs/) and the [Helm incubator chart for Apache Kafka](https://hub.helm.sh/charts/incubator/kafka). To install Helm 3 follow the [instructions in the Helm GitHub repo](https://github.com/helm/helm#install). Once you have Helm 3 installed you can run the following commands to install a single node Kafka deployment:

```sh
helm repo add incubator https://storage.googleapis.com/kubernetes-charts-incubator
kubectl create namespace kafka
helm install kafka --namespace kafka incubator/kafka --set replicas=1 --set zookeeper.replicaCount=1 --wait
```

The easiest way to create a KafkaGateway is using the riff CLI:

```sh
riff streaming kafka-gateway create franz --bootstrap-servers kafka.kafka:9092 --tail
```

```
Created kafka gateway "franz"
Waiting for kafka gateway "franz" to become ready...
...
KafkaGateway "franz" is ready
```

## Streams

Streams are namespaced resources that allow the flow of (and typically persist) messages serialized by riff streaming. Each stream has a **content-type** assigned to it and only messages compatible with that MIME type are allowed on that stream.

To declare a stream (and maybe provision any backing resources in the concrete message broker supporting it), use the riff CLI and specify the _address of the **provisioner** service of the gateway to use_.

Building on the example above, here is how to create two streams, named `in` and `out` respectively, both managed by the `franz` gateway:

```bash
riff streaming stream create in  --gateway franz --content-type application/json
riff streaming stream create out --gateway franz --content-type application/json
```

## Processors

**Processors** are the glue between streams and functions. An instance of a processor tells the streaming runtime that a given function should react to messages flowing on its _input_ stream(s) and forward results to its _output_ stream(s).

Upon creation of a processor, a deployment is created that hosts both the function (with its dedicated invoker) and a sidecar container running the [streaming processor](https://github.com/projectriff).

The role of the sidecar is to connect to each stream, using a reactive API and invoke the function using the riff streaming [rpc protocol](https://github.com/projectriff/invoker-specification/blob/master/streaming.md). The function is invoked once per window. It is the responsibility of the _streaming processor_ sidecar to chop inputs into windows.

> NOTE: The windowing function implemented by the streaming processor is currently hardcoded to create windows every minute.

Here is an example processor using a [time-averager](https://github.com/projectriff-samples/time-averager) function that emits an average of the input numbers computed every 10 seconds:

```bash
riff function create time-averager \
  --git-repo https://github.com/projectriff-samples/time-averager.git \
  --handler com.acme.TimeAverager \
  --tail
```

```bash
riff streaming processor create time-averager \
  --function-ref time-averager \
  --input in \
  --output out
```

## Testing with dev-utils

The [dev-utils](https://github.com/projectriff/dev-utils/) container offers CLI utilities which can be used to publish and subscribe to messages.

To run dev-utils in a pod called `riff-dev` in the `default` namespace:

```bash
kubectl create serviceaccount riff-dev
kubectl create rolebinding riff-dev-edit --clusterrole=edit --serviceaccount=default:riff-dev
kubectl run riff-dev --serviceaccount=riff-dev --generator=run-pod/v1 --image=projectriff/dev-utils
```

Using separate terminal windows, subscribe to the `in` and `out` streams to observe messages on those streams.

```bash
kubectl exec riff-dev -it -- subscribe in --payload-encoding raw
```

```bash
kubectl exec riff-dev -it -- subscribe out --payload-encoding raw
```

Publish numbers to the `in` stream.

```bash
kubectl exec riff-dev -it -- publish in --content-type application/json --payload 10
```

```bash
kubectl exec riff-dev -it -- publish in --content-type application/json --payload 100
```

```bash
kubectl exec riff-dev -it -- publish in --content-type application/json --payload 2
```

The subscriber on the `out` stream should show the resulting averages. (Your results may vary depending on window boundaries.)

```
$ kubectl exec riff-dev -it -- subscribe out --payload-encoding raw
{"payload":"55.0","contentType":"application/json","headers":{}}
{"payload":"2.0","contentType":"application/json","headers":{}}
```
