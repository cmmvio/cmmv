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

CMMV (Contract Model View) is a revolution in web application development, breaking paradigms and redefining how we create, maintain, and scale digital projects. Inspired by best practices and innovative concepts, CMMV integrates the power of contracts to automatically generate robust and secure structures, eliminating the complexity of manual code and providing an unprecedented development experience.

Imagine a platform where the definition of contracts in TypeScript becomes the heart of your application, automatically generating APIs, controllers, ORM entities, and even communication via binary RPC, all with optimized performance and seamless integration with the most modern technologies. With CMMV, you not only accelerate development, but also ensure the quality and consistency of your code, drastically reducing errors and rework.

In addition, CMMV offers a reactive and lightweight interface, based on Vue 3, but with the ability to support other frameworks such as React and Angular, always focusing on performance and SEO. With CMMV, the frontend is not just a presentation layer, but an integral and dynamic part of your application, synchronized in real time with the backend.

Whether you are an experienced developer or a programming newbie, CMMV empowers everyone to build powerful, scalable, modern systems by eliminating technical barriers and allowing creativity and innovation to be at the center of your development journey. It is more than a framework; it is a new way of thinking and building the future of web applications.

## Philosophy

CMMV aims to simplify the development process by leveraging TypeScript's powerful type system and decorators. It eliminates the need for heavy frontend frameworks by focusing on direct control over data binding and interactions, while maintaining flexibility through modular design.

## Features

- **Contract-Driven Development:** Use TypeScript contracts to define models, controllers, and more.
- **Modular Architecture:** Compose your application using modules, making it easy to manage and scale.
- **RPC & REST Support:** Integrated support for both binary RPC via WebSocket and traditional REST APIs.
- **Express Integration:** Seamless integration with Express for a familiar and robust HTTP server environment.
- **Extensible:** Highly customizable and easy to extend with your own modules and components.

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
$ pnpm add @cmmv/core @cmmv/http @cmmv/view reflect-metadata fast-json-stringify
```

## Quick Start

Below is a simple example of how to create a new CMMV application:

```typescript
import { Application } from "@cmmv/core";
import { DefaultAdapter, DefaultHTTPModule } from "@cmmv/http";
import { ViewModule } from "@cmmv/view";
import { ApplicationModule } from "./app.module";

Application.create({
    httpAdapter: DefaultAdapter,    
    modules: [
        DefaultHTTPModule,                
        ViewModule,        
        ApplicationModule
    ],
    services: [Repository],
    contracts: [...]
});
```

# Features

## 🟢 Core
- [x] Application control, contract loading, models, and model generation
- [x] Base for creating transpilers
- [x] Core abstraction for HTTP, WS, contracts, and services
- [x] Base implementation for Singleton class
- [x] Contract, hook, metadata, and service decorators
- [x] Configuration validation and access control across all modules
- [x] Hooks system
- [x] Telemetry and logging
- [x] Base for creating registries

## 🔐 Auth
- [x] General application access control
- [x] Local user registration and login
- [ ] Login via provider (Google, Facebook, etc.)
- [x] reCAPTCHA
- [x] Refresh token for session renewal
- [x] Full 2FA support with QR-Code generation and validation
- [x] Session control based on fingerprint, IP, and user agent

## 🚀 Cache
- [x] Optimized system responses using in-memory cache compatible with Redis, Memcached, MongoDB, or binary files
- [x] Simple integration decorators for controllers and gateways
- [x] Automatic integration with contracts
- [x] API for retrieving, updating, or removing cached data

## 🌐 HTTP
- [x] API availability via `@cmmv/server` or other adapters like Express
- [x] Automatic controller and service generation
- [x] Integration with `@cmmv/cache` and `@cmmv/auth`
- [x] Express Adapter
- [ ] Fastify Adapter

## 📡 Protobuf
- [x] `.proto` file generation for RPC communication based on contracts
- [x] Generation of interfaces and type definitions for TypeScript
- [x] JSON contract generation for frontend usage
- [x] Contract interlinking

## 🗄 Repository
- [x] SQL, MySQL, PostgreSQL, SQL Server, Oracle, and MongoDB integration
- [x] Automatic entity creation for TypeORM
- [x] Auto-generation of indexes
- [x] Auto-generation of relationships
- [x] Data validation
- [x] CRUD operations for RPC and REST
- [x] Search filters (sorting, ID filtering, pagination)
- [x] Service overrides for direct repository integration
- [x] Integration with `@cmmv/cache`, `@cmmv/auth`

## ⏳ Scheduling
- [x] Decorators for scheduled task creation (cron)
- [x] Scheduled task management

## 🎨 View
- [x] SSR for SEO optimization
- [x] Dynamic templates similar to EJS
- [x] View engine compatible with Express
- [x] Internationalization support
- [x] Direct sub-view inclusion in HTML
- [x] Dynamic metadata handling (scripts, links, meta, header, title)
- [x] Bundled CSS and JavaScript compilation
- [x] Transparent RPC integration

## 🔄 WS (WebSocket)
- [x] Auto-generation of RPC communication gateways
- [x] Data packaging abstraction
- [x] WebSocket communication implementation for both client and server

## 🧩 Modules
- [x] Swagger: Provides API documentation with Swagger integration.
- [x] Testing: Now includes unit testing, S2S testing, and mocks.
- [x] Elastic: Elasticsearch integration for managing indices, documents.
- [x] Email: Email handling module using SMTP or AWS SES.
- [x] Encryptor: ECC-based encryption, AES-256-GCM
- [x] Events: Event-driven architecture for seamless communication
- [x] Inspector: Debugging and monitoring tools
- [x] Keyv: Key-value store integration using Keyv
- [x] Normalizer: Data transformation module for parsing (JSON, XML, YAML, CSV)
- [x] Queue: Manages job queues (Kafka, RabbitMQ, Redis)
- [x] UI: UI components for building dynamic applications
- [x] Vue: Enables integration with Vue.js
