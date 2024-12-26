# Kasca - Code Collaboration Platform

<div align="center">
  <img src="client/public/images/kasca.png?raw=true" width="600" alt="kasca cover image"/>
</div>

Kasca is an online code collaboration platform that enables real-time coding with others, featuring integrated Git support and no sign-up required. Experience seamless collaboration with features like real-time cursor sharing, live UI preview, and integrated video communication.

**✨ Try now at [kasca.dulapahv.dev](https://kasca.dulapahv.dev/)**

> This project is part of the course "COMPSCI4025P Level 4 Individual Project" at the University of Glasgow.

For detailed usage instructions and feature documentation, please see **[manual.md](manual.md)**.

## Features

- **Real-time Collaboration** - Code together in real-time with cursor sharing, highlighting, and follow mode
- **Shared Terminal** - Execute code and see results together with over 80 supported languages
- **Live UI Preview** - Preview UI changes instantly with loaded libraries like Tailwind CSS, and more
- **GitHub Integrated** - Save your work and open files from your repositories
- **Shared Notes** - Take notes together in real-time with rich text and markdown support
- **Video & Voice** - Communicate with your team using video and voice chat

## Table of Contents

- [Kasca - Code Collaboration Platform](#kasca---code-collaboration-platform)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
  - [Development](#development)
  - [Deployment](#deployment)
  - [Tech Stack](#tech-stack)
  - [Coding Style](#coding-style)
  - [Contributing](#contributing)
  - [User Manual](#user-manual)
  - [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A package manager ([pnpm](https://pnpm.io/) recommended)

> While this project uses pnpm for development, you can use [npm](https://www.npmjs.com/) instead. Simply replace `pnpm` with `npm` in all commands. However, we recommend using pnpm for its better performance and disk space efficiency.

## Project Structure

The project is organized into three main directories:

```txt
.
├── client/          # Frontend Next.js application
├── server/          # Backend Socket.IO server
└── common/          # Shared types and enums
```

## Getting Started

1. Clone the repository

    ```bash
    git clone https://github.com/dulapahv/kasca.git
    cd kasca
    ```

2. Install dependencies in both client and server directories:

    ```bash
    # Install client dependencies
    cd client
    pnpm install

    # Install server dependencies
    cd ../server
    pnpm install
    ```

## Development

To run the development environment, you need to start both the client and server:

1. Start the server (in the server directory):

    ```bash
    pnpm dev
    ```

2. In a new terminal, start the client (in the client directory):

    ```bash
    pnpm dev
    ```

The application will be available at:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:3001>

## Deployment

The project is configured for automatic deployment:

- Frontend (client): Automatically deploys to [Vercel](https://vercel.com)
- Backend (server): Automatically deploys to [Render](https://render.com)

Simply push to the main branch, and both platforms will automatically build and deploy the changes.

For manual builds:

```bash
# Build frontend
cd client
pnpm build

# Build backend
cd server
pnpm build
```

## Tech Stack

- **Frontend:**
  - [Next.js](https://nextjs.org)
  - [TypeScript](https://www.typescriptlang.org)
  - [Tailwind CSS](https://tailwindcss.com)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Monaco Editor](https://microsoft.github.io/monaco-editor/)
  - [Socket.IO Client](https://socket.io)
  - [Sandpack](https://sandpack.io)
  - [MDXEditor](https://mdxeditor.dev/)
  - [simple-peer (WebRTC)](https://github.com/feross/simple-peer)
  - [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev/)
- **Backend:**
  - [Node.js](https://nodejs.org)
  - [TypeScript](https://www.typescriptlang.org)
  - [Socket.IO](https://socket.io) (binded to [µWebSockets.js](https://github.com/uNetworking/uWebSockets.js) server)

## Coding Style

We use several tools to maintain code quality:

- **[ESLint](https://eslint.org/)** for static code analysis (frontend only)
- **[Prettier](https://prettier.io/)** for code formatting
- **[prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)** for Tailwind CSS class sorting
- **[prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports)** for import statement organization
- **[prettier-plugin-classnames](https://github.com/ony3000/prettier-plugin-classnames)** for wrapping long Tailwind CSS class names

Check and fix code style:

```bash
# Frontend (in client directory)
pnpm lint:check     # Check TypeScript code with ESLint
pnpm lint:fix       # Fix ESLint issues
pnpm format:check   # Check formatting with Prettier
pnpm format:fix     # Fix formatting issues

# Backend (in server directory)
pnpm format:check   # Check formatting with Prettier
pnpm format:fix     # Fix formatting issues
```

## Contributing

1. Create a new branch for your feature
2. Commit changes following [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines)
3. Submit a Pull Request with a description of your changes

## User Manual

For detailed information about using Kasca, including:

- Feature guides
- Keyboard shortcuts
- Troubleshooting

Please refer to our [User Manual](manual.md).

## License

MIT License - see the [LICENSE](LICENSE) file for details
