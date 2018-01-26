---
layout: single
title: "Announcing the 0.0.3 release of riff"
header:
  overlay_image: /images/scothis-boston.jpg
excerpt:
  With a new go function-controller, better cli, windows support and more.
permalink: /blog/announcing-riff-0-0-3-release/
---

We are excited to announce a shiny new release of riff. Thank you, all the riff team and community members
who contributed to make this happen.

Highlights of the 0.0.3 release include the following:

- A rewrite of the [function controller](https://github.com/projectriff/function-controller) written in go.

- A much improved `riff` command line script, supporting the following commands.
  ```
    init         Initialize a function
    build        Build a function container
    apply        Apply function resource definitions
    create       Create function resources, build container and apply the function resources
    update       Build the container and apply the modified function resources
    delete       Delete function resources
    list         List current function resources
    logs         Show logs for a function resource
    publish      Publish data to a topic using the http-gateway
    version      Display the riff version
  ``` 
  `riff init` will generate a new Dockerfile as well as yaml files for Function and Topic
  resource defintions. `riff create` is a combination of `riff init` and `riff build` and `riff apply`.

- Windows support for the same commands via a new `riff.bat`.

- JavaScript async or promised functions can now be used in addition to synchronous functions.
  ```js
  // sync
  module.exports = name => `Hello ${name}!`;

  // promise
  module.exports = name => Promise.resolve(`Hello ${name}!`);

  // async
  module.exports = async name => `Hello ${name}!`;
  ```

- A quicker cold start for the java function invoker.

- Improved message headers and gRPC support.


