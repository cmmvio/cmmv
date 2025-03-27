<p align="center">
  <a href="https://cmmv.io/" target="blank"><img src="https://raw.githubusercontent.com/cmmvio/docs.cmmv.io/main/public/assets/logo_CMMV2_icon.png" width="300" alt="CMMV Logo" /></a>
</p>
<p align="center">Contract-Model-Model-View (CMMV) <br/> Building scalable and modular applications using contracts.</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@cmmv/email"><img src="https://img.shields.io/npm/v/@cmmv/email.svg" alt="NPM Version" /></a>
    <a href="https://github.com/cmmvio/cmmv-email/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cmmv/core.svg" alt="Package License" /></a>
</p>

<p align="center">
  <a href="https://cmmv.io">Documentation</a> &bull;
  <a href="https://github.com/cmmvio/cmmv-email/issues">Report Issue</a>
</p>

## Description

The `@cmmv/email` module provides a unified interface for email delivery using `nodemailer`. It supports SMTP, AWS SES, and other transport options, allowing developers to send emails with ease using the CMMV framework.

## Features

* Multi-Transport Support: Works with SMTP, AWS SES, and custom transports.

* Integration with CMMV Framework: Seamless integration with other CMMV modules.

* Logging and Error Handling: Built-in logging for monitoring email sending.

## Installation

Install the `@cmmv/email` package via npm:

```bash
$ pnpm add @cmmv/email
```

## Configuration

The `@cmmv/email` module requires configuration for the email provider and credentials. This can be set in the `.cmmv.config.js` file:

```javascript
module.exports = {
    env: process.env.NODE_ENV,

    email: {
        host: process.env.EMAIL_HOST || "smtp.example.com",
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || "user@example.com",
            pass: process.env.EMAIL_PASS || "password"
        },
        SES: process.env.AWS_SES_ENABLED ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        },
        logger: process.env.EMAIL_LOGGER || false
    }
};
```

## Setting Up the Application

In your `index.ts`, include the `EmailService` in the application:

```typescript
import { Application } from "@cmmv/core";
import { EmailService } from "@cmmv/email";

Application.create({
    services: [EmailService],
});
```

## Sending Emails

Emails can be sent using the `EmailService`:

```typescript
import { EmailService } from "@cmmv/email";

async function sendEmail() {
    const success = await EmailService.getInstance().send(
        "from@example.com",
        "to@example.com",
        "Test Email",
        "<h1>Hello World</h1>",
        { cc: "cc@example.com" }
    );

    if (success) {
        console.log("Email sent successfully!");
    } else {
        console.error("Failed to send email.");
    }
}
```

## AWS SES Integration

The module supports AWS Simple Email Service (SES) for scalable email delivery.

To enable SES, configure it in `.cmmv.config.js`:

```javasript
email: {
    SES: {
        accessKeyId: "your-access-key",
        secretAccessKey: "your-secret-key",
        region: "us-east-1"
    }
}
```