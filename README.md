# Minimal `@belopash/typeorm-store` example

A simple squid illustrating the usage of the `@belopash/typeorm-store` package with [Squid SDK](https://docs.subsquid.io/sdk/). This [custom store](https://docs.subsquid.io/sdk/resources/persisting-data/overview) batches both read and write database requests under the hood, allowing for [batch processing](https://docs.subsquid.io/sdk/resources/basics/batch-processing) in a handler-based architecture.

Effective batching of reads requires that the handlers are split into two distinct phases:

* **Phase 1:** Deferred requests for all the required entity instances are made with `ctx.store.defer`.
* **Phase 2:** The entity instances are retrieved via `.get`/`.getOrCreate`/`.getOrFail` methods of the deferred requests, updated as necessary and saved.

Read requests are batched in-memory as the `ctx.store.defer` calls are made, then the batches are executed upon calls to `.get`/`.getOrCreate`/`.getOrFail`. Write requests are batched in-memory upon calls to `ctx.store.insert`/`ctx.store.upsert`; their batches are executed internally by the store after each execution of the [blocks batch handler](https://docs.subsquid.io/sdk/reference/processors/architecture/#processorrun).

From this, the optimal execution order is:

1. Phase 1 code for all handlers
2. Phase 2 code for all handlers

To achieve this, this example uses a trivial queue of callbacks containing all the phase 2 code. Handlers add their phase 2 code to that queue as they are executed, then all the collected phase 2 code is executed at once.

## Manual controls

### Execution of batched requests

Call `ctx.store.commit()` to execute any pending database requests.

### Caching

By default, all entity instances resulting from reads and slated for writes are kept in the memory for fast retrieval upon request (by `.get`/`.getOrCreate`/`.getOrFail`). In some cases that can cause the store to consume too much RAM. You can work around that by controlling the cache manually with

* `ctx.store.clear()` - drops all entity instances cached in RAM
* `ctx.store.flush()` is a `ctx.store.commit()` followed by `ctx.store.clear()`

## Quickstart

Dependencies: Node.js v16 or newer, Git, Docker.

```bash
# 0. Install @subsquid/cli a.k.a. the sqd command globally
npm i -g @subsquid/cli

# 1. Clone the repo
git clone https://github.com/abernatskiy/belopash-typeorm-store-example
cd belopash-typeorm-store-example

# 2. Install dependencies
npm ci

# 3. Start a Postgres database container and detach
sqd up

# 4. Build the squid
sqd build

# 5. Start both the squid processor and the GraphQL server
sqd run .
```
A GraphiQL playground will be available at [localhost:4350/graphql](http://localhost:4350/graphql).

You can also start squid services one by one:
```bash
sqd process
sqd serve
```
