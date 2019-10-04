---
id: streaming
title: Streaming Runtime
sidebar_label: Streaming
---
The streaming runtime allows execution of function on **streams** of messages, permitting more complex interactions than the simple request / reply used by the [core](core.md) or [knative](knative.md) runtimes.

## Install

The streaming runtime is not installed with riff by default. See the platform [getting started guide](../getting-started.md) for how to install the streaming runtime.

> NOTE: It is currently impossible to install both the knative and the streaming runtimes.

> NOTE: Not all invokers support streaming. Invokers conforming to the full invoker [specification](https://github.com/projectriff/invoker-specification) can be used with the streaming runtimes, while some can't. In particular, the [command](../invokers/command.md) invoker does not support streaming.

## Providers

When using the streaming runtime, messages flow between functions using **streams**, which are backed by some concrete messaging system, such as Kafka.
**Providers** abstract away the protocol details of concrete messaging systems (riff uses [liiklus](https://github.com/bsideup/liiklus) to that effect), as well as the way to provision topics/queues corresponding to each stream. 

Providers are namespaced resources and manage streams in their own namespace. They typically target their own messaging system, but are implemented in such a way that two different provider instances could use the same broker (_e.g._ the same Kafka cluster) without interference.
Conversely, functions can interact with streams managed by two (or more) different providers.

The reconciliation of some providers is taken care of by the riff streaming runtime, while it is expected that _extension_ providers may be handled by custom controllers.
The configuration needed by each kind of provider varies greatly depending on the backing message broker. For both of these reasons, creation of an instance of a provider is not carried out _via_ the riff CLI, but rather "manually" using yaml files. Additionally, the installation of concrete message brokers (inside or outside the cluster) is out of scope of this document.

### KafkaProvider

At of riff 0.5.x, the only available kind of **Provider** available is **KafkaProvider**, which maps each riff stream to a Kafka _topic_.

Here is an example declaration of a `KafkaProvider` named `franz`, which assumes that a Kafka broker is reachable at `kafkabroker:9092`.

```yaml
apiVersion: streaming.projectriff.io/v1alpha1
kind: KafkaProvider
metadata:
  name: franz
spec:
  bootstrapServers: kafkabroker:9092
```

Upon application, two deployments and two services should appear:
```bash
kubectl get deploy,svc
```

```
NAME                                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.extensions/franz-kafka-liiklus       1/1     1            1           23h
deployment.extensions/franz-kafka-provisioner   1/1     1            1           23h

NAME                              TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)                          AGE
service/franz-kafka-liiklus       ClusterIP      10.11.251.168   <none>           6565/TCP                         23h
service/franz-kafka-provisioner   ClusterIP      10.11.255.151   <none>           80/TCP                           23h
```

## Streams

Streams are namespaced resources that allow the flow (and typically persist) of messages serialized by riff streaming. Each stream has a **content-type** assigned to it and only messages of that MIME type are allowed on that stream.

To declare a stream (and maybe provision any backing resources in the concrete message broker supporting it), use the riff cli and specify the _address of the **provisioner** service of the provider to use_.

Building on the example above, here is how to create two streams, named `in` and `out` respectively, both managed by the `franz` provider:
```bash
riff streaming stream create in  --provider franz-kafka-provisioner --content-type application/json 
riff streaming stream create out --provider franz-kafka-provisioner --content-type application/json 
```

## Processors

**Processors** are the glue between streams and functions. An instance of a processor tells the streaming runtime that a given function should react to messages flowing on its _input_ stream(s) and forward results to its _output_ stream(s).

Upon creation of a processor, a deployment is created that hosts both the function (with its dedicated invoker) and a sidecar container running the [streaming processor](https://github.com/projectriff). The role of that sidecar is to connect to each stream, using a reactive API and invoke the function using the riff streaming [rpc protocol](https://github.com/projectriff/invoker-specification/blob/master/streaming.md). The function is not invoked just once, but rather several times and it is the responsibility of the _streaming processor_ sidecar to chop inputs into _windows_.

> NOTE: The windowing function implemented by the streaming processor is currently hardcoded to create windows every minute.

Here is how to create an example processor using a function that averages numbers over time:
```bash
riff function create time-averager \
	--git-repo https://github.com/projectriff-samples/time-averager.git \
	--handler com.acme.TimeAverager
```

```bash
riff processor create time-averager --function-ref time-averager --input numbers --output avgs
```

