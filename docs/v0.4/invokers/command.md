---
id: command
title: Command Function Invoker
sidebar_label: Command
---

Command functions will be invoked using a [Command Function Invoker](https://github.com/projectriff/command-function-invoker) that is provided by riff when you build the function.

The *command function invoker* provides a host for functions implemented
as a single executable command (be it a shell script or a binary).
It accepts HTTP requests and invokes the command for each request.

Communication with the function is done via `stdin` and `stdout`.
Functions can log by writing to `stderr`.

For each invocation, functions are expected to read stdin until the end of the stream (EOF) and provide a result on stdout.

Correct function execution is assumed if the exit code is zero. Any other value indicates an error.

## Creating a command function

This example uses the sample [command-wordcount](https://github.com/projectriff-samples/command-wordcount) function from projectriff-samples on GitHub. It consists of a single executable file named wordcount.sh with the following content:

```bash
#!/bin/bash

tr [:punct:] ' ' | tr -s ' ' '\n' | tr [:upper:] [:lower:] | sort | uniq -c | sort -n
```

### Building the command function

You can build your function either from local source or from source committed to a GitHub repository.

> NOTE: The local-path builds option is disabled on Windows.

For local build use:

```
chmod +x wordcount.sh
riff function create wordcount --artifact wordcount.sh --local-path .
```

When building from a GitHub repo use something like the example below and replace the `--git-repo` argument with your own repository URL.

> NOTE: If you are creating command functions on Windows then you can't set the excute flag on a local file. Before commiting your function file to a Git repository you should set the excute flag using the following Git command: `git update-index --chmod=+x wordcount.sh`.

For building from a Git repository use:

```
riff function create wordcount --artifact wordcount.sh --git-repo https://github.com/projectriff-samples/command-wordcount
```
