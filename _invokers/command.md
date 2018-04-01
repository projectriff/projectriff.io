---
name: command
title: "Command Function Invoker"
author: projectriff
href: https://github.com/projectriff/command-function-invoker
development:
  href: https://github.com/projectriff/command-function-invoker/raw/master/command-invoker.yaml
releases: [
  # - version: v0.0.6
  #   href: https://github.com/projectriff/command-function-invoker/raw/v0.0.6/command-invoker.yaml
  #   date: 2000-01-01
]
---

The command function invoker provides a Docker base layer for a function consisting of a single command.
It accepts gRPC requests, invokes the command for each request in the input stream,
and sends the command's output to the stream of gRPC responses.

## Install as a riff invoker

```bash
riff invokers apply -f https://github.com/projectriff/command-function-invoker/raw/master/command-invoker.yaml
```

## riff Commands

- [riff init command](#riff-init-command)
- [riff create command](#riff-create-command)

<!-- riff-init -->

### riff init command

Initialize a command function

#### Synopsis

Generate the function based on the executable command specified as the filename, using the name
and version specified for the function image repository and tag.

For example, from a directory named 'echo' containing a function 'echo.sh', you can simply type :

    riff init command -a echo.sh

to generate the resource definitions using sensible defaults.


```
riff init command [flags]
```

#### Options

```
  -h, --help                     help for command
      --invoker-version string   the version of invoker to use when building containers (default "0.0.6-snapshot")
```

#### Options inherited from parent commands

```
  -a, --artifact string      path to the function artifact, source code or jar file
      --config string        config file (default is $HOME/.riff.yaml)
      --dry-run              print generated function artifacts content to stdout only
  -f, --filepath string      path or directory used for the function resources (defaults to the current directory)
      --force                overwrite existing functions artifacts
  -i, --input string         the name of the input topic (defaults to function name)
  -n, --name string          the name of the function (defaults to the name of the current directory)
  -o, --output string        the name of the output topic (optional)
  -u, --useraccount string   the Docker user account to be used for the image repository (default "current OS user")
  -v, --version string       the version of the function image (default "0.0.1")
```

#### SEE ALSO

* [riff init](https://github.com/projectriff/riff/blob/master/riff-cli/docs/riff_init.md)	 - Initialize a function


<!-- /riff-init -->

<!-- riff-create -->

### riff create command

Create a command function

#### Synopsis

Create the function based on the executable command specified as the filename, using the name
and version specified for the function image repository and tag.

For example, from a directory named 'echo' containing a function 'echo.sh', you can simply type :

    riff create command -a echo.sh

to create the resource definitions, and apply the resources, using sensible defaults.


```
riff create command [flags]
```

#### Options

```
  -h, --help                     help for command
      --invoker-version string   the version of invoker to use when building containers (default "0.0.6-snapshot")
      --namespace string         the namespace used for the deployed resources (defaults to kubectl's default)
      --push                     push the image to Docker registry
```

#### Options inherited from parent commands

```
  -a, --artifact string      path to the function artifact, source code or jar file
      --config string        config file (default is $HOME/.riff.yaml)
      --dry-run              print generated function artifacts content to stdout only
  -f, --filepath string      path or directory used for the function resources (defaults to the current directory)
      --force                overwrite existing functions artifacts
  -i, --input string         the name of the input topic (defaults to function name)
  -n, --name string          the name of the function (defaults to the name of the current directory)
  -o, --output string        the name of the output topic (optional)
  -u, --useraccount string   the Docker user account to be used for the image repository (default "current OS user")
  -v, --version string       the version of the function image (default "0.0.1")
```

#### SEE ALSO

* [riff create](https://github.com/projectriff/riff/blob/master/riff-cli/docs/riff_create.md)	 - Create a function (equivalent to init, build, apply)


<!-- /riff-create -->
