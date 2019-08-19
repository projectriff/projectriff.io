---
id: command
title: Command Function Invoker
sidebar_label: Command
---

Command functions are invoked using a [Command Function Invoker](https://github.com/projectriff/command-function-invoker) that is provided by riff when building the function.

The *command function invoker* provides a host for functions implemented
as a single executable command (be it a shell script or a binary).
It accepts HTTP requests and invokes the command for each request.

Communication with the function is done via `stdin` and `stdout`.
Functions can log by writing to `stderr`.

For each invocation, functions are expected to read stdin until the end of the stream (EOF) and provide a result on stdout.

Correct function execution is assumed if the exit code is zero. Any other value indicates an error.

## Authoring a function

This example uses the sample [command-wordcount](https://github.com/projectriff-samples/command-wordcount) function from projectriff-samples on GitHub. It consists of a single executable file named wordcount.sh with the following content:

```bash
#!/bin/bash

tr [:punct:] ' ' | tr -s ' ' '\n' | tr [:upper:] [:lower:] | sort | uniq -c | sort -n
```

Then set the execute bit to make the function executable.

```sh
chmod +x wordcount.sh
```

> NOTE: If creating a command function on Windows then the the execute bit cannot be set on the local file. Before committing the function file to a Git repository it must have the execute bit set using the following Git command: `git update-index --chmod=+x wordcount.sh`.

## Creating a function

Function can either be built from local source or from source committed to a Git repository.

### build from local source

> NOTE: The `--local-path` builds option is disabled on Windows.

For local build use:

```
riff function create wordcount --artifact wordcount.sh --local-path .
```

### build from git repository

When building from a Git repo use something like the example below and replace the `--git-repo` value with the new repository URL.

For building from a Git repository use:

```
riff function create wordcount --artifact wordcount.sh --git-repo https://github.com/projectriff-samples/command-wordcount
```

## Deploying a function

Please see the runtime documentation for how to deploy and invoke the function.

- [Core runtime](../runtimes/core.md)
- [Knative runtime](../runtimes/knative.md)

## Cleanup

When done with the function, delete the function resource to stop creating new builds. 

> NOTE: Images built by the function continue to exist in the container registry and may continue to be consumed by a runtime.

```sh
riff function delete wordcount
```

```
Deleted function "wordcount"
```
