<p align="center">
  <a href="https://cmmv.io/" target="blank"><img src="https://raw.githubusercontent.com/cmmvio/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png" width="300" alt="CMMV Logo" /></a>
</p>
<p align="center">Contract-Model-Model-View (CMMV) <br/> Building scalable and modular applications using contracts.</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@cmmv/core"><img src="https://img.shields.io/npm/v/@cmmv/core.svg" alt="NPM Version" /></a>
    <a href="https://github.com/cmmvio/cmmv/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cmmv/core.svg" alt="Package License" /></a>
    <a href="https://dl.circleci.com/status-badge/redirect/circleci/QyJWAYrZ9JTfN1eubSDo5u/7gdwcdqbMYfbYYX4hhoNhc/tree/main" target="_blank"><img src="https://dl.circleci.com/status-badge/img/circleci/QyJWAYrZ9JTfN1eubSDo5u/7gdwcdqbMYfbYYX4hhoNhc/tree/main.svg" alt="CircleCI" /></a>
</p>

<p align="center">
  <a href="https://cmmv.io">Documentation</a> &bull;
  <a href="https://github.com/cmmvio/cmmv/issues">Report Issue</a>
</p>

## Description

CMMV (Contract-Model-Model-View) is a revolutionary approach to web application development, redefining how we create, maintain, and scale modern projects. By leveraging contract-based development, CMMV automates the generation of APIs, controllers, ORM entities, and RPC communication, delivering an optimized and robust experience.

With a **high-performance HTTP server (@cmmv/server)** that replaces Express, CMMV ensures **4x better performance** while maintaining a familiar syntax inspired by NestJS. It now supports **RESTful API, RPC, and GraphQL(Future) outputs**, with seamless **SSR directive integration**.

CMMV also **merges @cmmv/view into @cmmv/http**, eliminating extra installations while retaining flexibility for **EJS, Mustache, and other view engines**. Additionally, new modules like **@cmmv/vault** (AES-256-GCM & ECC encryption) and **@cmmv/openapi** (automatic documentation generation) have been introduced, replacing the deprecated **@cmmv/swagger** module.

## Philosophy

CMMV simplifies development by leveraging TypeScript decorators and a modular architecture. It **removes complexity** by automating the core functionalities while allowing full **customization** for advanced use cases.

## Features

- **Contract-Driven Development:** Define models, controllers, and APIs with TypeScript contracts.
- **High-Performance HTTP Server:** Replaces Express with an optimized native server.
- **Modular Architecture:** Separate core and optional modules for scalability.
- **Multi-Protocol Support:** REST, RPC, and GraphQL with automatic type inference.
- **Integrated SSR:** Simple syntax for Server-Side Rendering.
- **Advanced Security:** Vault module for encrypted data storage (AES-256-GCM & ECC).
- **Automatic Documentation:** OpenAPI-based documentation from contracts.

## Setup with CLI

CMMV now provides a CLI (Command Line Interface) to streamline the installation process and quickly set up your project with the desired configurations.

To initialize a new project, you can use the following command:

```bash
$ pnpm dlx @cmmv/cli@latest create project-name
```

This command will walk you through a guided setup process, asking about your preferred configurations, such as enabling Vite, RPC, caching, repository type, and view setup (e.g., Vue 3 or Reactivity). It will automatically create the necessary files and folders, set up dependencies, and configure the project.

## Legacy Setup (Manual)

If you prefer to set up the project manually, you can still install the necessary modules individually:

```bash
$ pnpm add @cmmv/core @cmmv/http reflect-metadata fast-json-stringify
```

## Quick Start

Below is a simple example of how to create a new CMMV application:

```typescript
import { Application } from "@cmmv/core";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";
import { ApplicationModule } from "./app.module";

Application.create({
    httpAdapter: DefaultAdapter,    
    modules: [
        DefaultHTTPModule,                      
        ApplicationModule
    ],
    providers: [...],
    contracts: [...]
});
```

# Features

## 🟢 Core
- [x] Application control, contract loading, models, and model generation
- [x] Base for creating transpilers
- [x] Singleton-based architecture
- [x] Core abstraction for HTTP, WS, contracts, and services
- [x] Contracts, hooks, and metadata decorators
- [x] Configuration validation and access control across all modules
- [x] Telemetry and logging
- [x] Base for creating registries

## 🔐 Auth
- [x] Full authentication & session control
- [x] Local login & user registration
- [ ] Login via provider (Google, Facebook, etc.)
- [x] reCAPTCHA integration
- [x] Token-based authentication
- [x] 2FA with QR Code generation
- [x] Session control based on fingerprint, IP, and user-agent

## 🚀 Cache
- [x] High-performance caching with Redis, Memcached, MongoDB, or binary storage
- [x] Decorators for controller & gateway integration
- [x] Full caching API with retrieval, update, and removal

## 🌐 HTTP
- [x] High-performance API server using `@cmmv/server`
- [x] Automatic controller and service generation
- [x] Integrated SSR support
- [x] Integration with `@cmmv/cache` and `@cmmv/auth`
- [x] View engine with EJS, Mustache, and other templates

## 📡 Protobuf
- [x] `.proto` file generation for RPC communication based on contracts
- [x] JSON contract generation for frontend integration
- [x] TypeScript type definitions from contracts

## 🗄 Repository
- [x] SQL, MySQL, PostgreSQL, SQL Server, Oracle, and MongoDB integration
- [x] Automatic entity generation (TypeORM)
- [x] Built-in indexing & relationship handling
- [x] Data validation
- [x] Auto-generated CRUD for RPC and REST APIs
- [x] Search filters (sorting, ID filtering, pagination)
- [x] Service overrides for direct repository integration
- [x] Integration with `@cmmv/cache`, `@cmmv/auth`

## ⏳ Scheduling
- [x] Simple cron-based task decorators
- [x] Task execution management

## 🔄 WS (WebSocket)
- [x] Built-in RPC WebSocket gateway
- [x] Binary data packaging
- [x] High-performance communication stack

## 🧩 Modules
- [x] OpenAPI: OpenAPI documentation for auto-generated APIs
- [x] Testing: Now includes unit testing, S2S testing, and mocks.
- [x] Elastic: Elasticsearch integration for managing indices, documents.
- [x] Email: Email handling module using SMTP or AWS SES.
- [x] Encryptor: ECC & AES-256 encryption utilities
- [x] Events: Event-driven architecture for seamless communication
- [x] Inspector: Debugging and monitoring tools
- [x] Keyv: Key-Value storage (Redis, Memcached, MongoDB)
- [x] Normalizer: Data transformation module for parsing (JSON, XML, YAML, CSV)
- [x] Queue: Job queue management (Kafka, RabbitMQ, Redis)
- [x] UI: UI components for building dynamic applications
- [x] Vue: Enables integration with Vue.js
- [x] Vault: Securely stores and retrieves encrypted secrets.

# Deprecations

From version 0.8.33, the following changes apply:

* `@cmmv/view` → Merged into `@cmmv/http` (no separate installation needed)
* `@cmmv/swagger` → Replaced by `@cmmv/openapi`
* Express is no longer required, replaced by @cmmv/server (4x faster)

---

## 📚 Documentation

- **[Complete Documentation](docs/)** - All project documentation
- **[OpenSpec Proposals](openspec/changes/)** - Improvement proposals
- **[Test Coverage Analysis](docs/TEST_COVERAGE_ANALYSIS.md)** - Coverage report
- **[Next Steps](docs/NEXT_STEPS.md)** - Immediate actions and priorities
