# Online Code Collaboration Platform

Kasca is a lightweight online code collaboration platform that enables real-time coding with others, featuring integrated Git support and no sign-up required.

> This project is part of the course "COMPSCI4025P Level 4 Individual Project" at the University of Glasgow.

## Table of Contents

- [Online Code Collaboration Platform](#online-code-collaboration-platform)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
  - [Coding Style](#coding-style)
  - [Commit Guidelines](#commit-guidelines)
  - [License](#license)

## Getting Started

Clone the repository and install the dependencies using [pnpm](https://pnpm.io/).

```bash
git clone git@github.com:dulapahv/online-code-collaboration-platform.git
cd online-code-collaboration-platform
pnpm i
```

To start the development server, run the following command:

```bash
pnpm dev
```

To build the project, run the following command:

```bash
pnpm build
```

To check if the code is formatted correctly, run the following command:

```bash
pnpm lint:check
```

To format the code, run the following command:

```bash
pnpm lint:fix
```

## Coding Style

We use [Prettier](https://prettier.io/) for code formatting, [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) for formatting Tailwind CSS, and [prettier-plugin-sort-imports](https://github.com/IanVS/prettier-plugin-sort-imports) for sorting imports.

You can run `pnpm lint:check` to check if your code is formatted correctly. If you want to format your code, you can run `pnpm lint:fix`.

## Commit Guidelines

We follow the [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) specification for commit messages.

## License

To be determined.
