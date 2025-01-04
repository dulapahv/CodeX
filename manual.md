# Kasca User manual

- [Kasca User manual](#kasca-user-manual)
  - [Getting Started](#getting-started)
    - [System Requirements](#system-requirements)
      - [Browser Requirements](#browser-requirements)
      - [Hardware Requirements](#hardware-requirements)
      - [Device Support](#device-support)
    - [Accessing Kasca](#accessing-kasca)
    - [Creating a Room](#creating-a-room)
    - [Joining a Room](#joining-a-room)
      - [Method 1: Using a Room ID](#method-1-using-a-room-id)
      - [Method 2: Using an Invitation Link](#method-2-using-an-invitation-link)
      - [Method 3: Scanning QR Code](#method-3-scanning-qr-code)
    - [User Interface Overview](#user-interface-overview)
      - [Top Bar](#top-bar)
      - [Main Work Area (Split into Panels)](#main-work-area-split-into-panels)
      - [Bottom Panel - Terminal](#bottom-panel---terminal)
      - [Status Bar](#status-bar)
      - [Panels and Layout](#panels-and-layout)
  - [Real-time Collaboration Features](#real-time-collaboration-features)
    - [Code Editor Overview](#code-editor-overview)
    - [Cursor Sharing and Highlighting](#cursor-sharing-and-highlighting)
      - [Cursor Visibility](#cursor-visibility)
      - [Text Selection](#text-selection)
    - [Follow Mode](#follow-mode)
      - [Enabling Follow Mode](#enabling-follow-mode)
      - [Follow Mode Features](#follow-mode-features)
      - [Limitations](#limitations)
    - [User List and Presence](#user-list-and-presence)
    - [Video \& Voice Communication](#video--voice-communication)
  - [Code Editor](#code-editor)
    - [Monaco Editor Features](#monaco-editor-features)
    - [Language Support](#language-support)
    - [Syntax Highlighting](#syntax-highlighting)
    - [Editor Settings and Customisation](#editor-settings-and-customisation)
    - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Code Execution](#code-execution)
    - [Supported Languages](#supported-languages)
    - [Using the Shared Terminal](#using-the-shared-terminal)
    - [Running Code](#running-code)
    - [Passing Arguments](#passing-arguments)
    - [Handling Input/Output](#handling-inputoutput)
    - [Common Error Messages](#common-error-messages)
  - [GitHub Integration](#github-integration)
    - [Authentication](#authentication)
    - [Opening Files from GitHub](#opening-files-from-github)
    - [Saving Files to GitHub](#saving-files-to-github)
    - [Repository Browser](#repository-browser)
    - [Commit Changes](#commit-changes)
  - [Live UI Preview](#live-ui-preview)
    - [Supported Libraries](#supported-libraries)
    - [Preview Panel Usage](#preview-panel-usage)
    - [Real-time Updates](#real-time-updates)
    - [Tailwind CSS Integration](#tailwind-css-integration)
  - [Collaborative Note-Taking](#collaborative-note-taking)
    - [WYSIWYG Editor Features](#wysiwyg-editor-features)
    - [Markdown Support](#markdown-support)
    - [Real-time Synchronisation](#real-time-synchronisation)
    - [Saving and Opening Notes](#saving-and-opening-notes)
  - [Additional Features](#additional-features)
    - [Panel Management](#panel-management)
    - [Theme Customisation](#theme-customisation)
    - [Room Sharing](#room-sharing)
    - [QR Code Generation](#qr-code-generation)
    - [Mobile Device Support](#mobile-device-support)
  - [Troubleshooting](#troubleshooting)
    - [Live Preview not Updating or Displaying Error](#live-preview-not-updating-or-displaying-error)
    - [Follow Mode not working](#follow-mode-not-working)
    - [Code is not Syncing Between Users](#code-is-not-syncing-between-users)
    - [This Language may not be Supported or the Server is Down](#this-language-may-not-be-supported-or-the-server-is-down)
    - [Error Parsing Markdown](#error-parsing-markdown)
    - [Parsing of the Following Markdown Structure Failed](#parsing-of-the-following-markdown-structure-failed)
  - [Performance Tips](#performance-tips)
  - [Security Considerations](#security-considerations)
  - [Privacy and Security](#privacy-and-security)
    - [Data Handling](#data-handling)
    - [User Privacy](#user-privacy)
    - [GitHub Access Permissions](#github-access-permissions)
  - [Appendix](#appendix)
    - [Supported Programming Languages](#supported-programming-languages)
      - [Supported Editor Languages](#supported-editor-languages)
      - [Supported Execution Languages](#supported-execution-languages)
    - [Keyboard Shortcuts Reference](#keyboard-shortcuts-reference)
    - [External Service Dependencies](#external-service-dependencies)

## Getting Started

### System Requirements

To use Kasca effectively, ensure your system meets the following requirements:

#### Browser Requirements

- Google Chrome (version 90 or later)
- Mozilla Firefox (version 88 or later)
- Microsoft Edge (version 90 or later)
- Safari (version 14 or later)

#### Hardware Requirements

- Minimum 4GB RAM
- Stable internet connection (minimum 1 Mbps)
- Webcam and microphone (optional, for video/voice communication)

#### Device Support

- Desktop computers (Windows, macOS, Linux)
- Tablets (iOS, Android)
- Mobile phones (iOS, Android)

### Accessing Kasca

Kasca is a web-based application that requires no installation. To access Kasca:

1. Open your web browser.
2. Navigate to [https://kasca.dulapahv.dev/](https://kasca.dulapahv.dev/).
3. The platform will load automatically in your browser.

### Creating a Room

To create a new coding session:

1. On the homepage, locate the `Create a Room` section.
2. Enter your preferred display name in the `Name` field.
3. Click `+ Create Room` to start a new session.
4. You'll be automatically redirected to your coding room.

### Joining a Room

A valid room ID must be in a `XXXX-XXXX` format where `X` is an alphanumeric character.

There are three ways to join an existing room:

#### Method 1: Using a Room ID

1. On the homepage, find the `Join a Room` section.
2. Input the room ID provided by the room creator in the `Room ID` field.
   > When inputting the room ID, no need to include the hyphen `-` as it will be added automatically.
3. Enter your display name in the `Name` field.
4. Click `Join Room →`.

#### Method 2: Using an Invitation Link

1. Click the invitation link shared with you
2. Enter your display name in the `Name` field when prompted
3. Click `Join Room →`

#### Method 3: Scanning QR Code

1. Use your mobile device to scan the QR code shared by the room creator
2. Enter your display name in the `Name` field when prompted
3. Click `Join Room →`

### User Interface Overview

Once you enter a room, you'll see several key interface elements:

#### Top Bar

- **Menu Bar:** Contains File, Edit, Selection, View, and Help menus.
- **Run Code Button:** Execute your code directly from the editor.
- **Share Button:** Share your room with others via a link or QR code.
- **Settings:** Connect to GitHub, and adjust editor settings.
- **User Avatar:** Shows your profile and status

#### Main Work Area (Split into Panels)

1. **Left Panel - Notepad**

   - Rich text formatting toolbar (Bold, Italic, Underline, etc.)
   - Block type selector for different content types
   - Collaborative note-taking area
   - Table and media insertion tools

2. **Center Panel - Code Editor**

   - Main coding area with syntax highlighting
   - Line numbers
   - Real-time collaboration
   - Multi-cursor support

3. **Right Panel - Preview/Output**
   - Live preview of code output
   - UI rendering for web development
   - Real-time updates

#### Bottom Panel - Terminal

- Shared terminal with welcome message
- Command output display
- Download and clear options
- Color-coded text output

#### Status Bar

- **Language Selector:** Shows current programming language (e.g., "HTML")
- **Line and Column Indicator:** Shows cursor position
- **Communication Controls:** Toggle camera, microphone, and audio

#### Panels and Layout

- Panels can be resized by dragging the dividers
- Panels can be hidden/shown using toolbar buttons
- Layout preferences are preserved across sessions

## Real-time Collaboration Features

### Code Editor Overview

The Monaco Editor forms the core of Kasca's collaborative coding environment, enabling multiple users to code together in real-time. Key features include:

- Real-time synchronization of code changes across all participants
- Multi-cursor support showing everyone's positions
- Syntax highlighting for over 90 programming languages
- Intelligent code completion and suggestions
- Error detection and linting

### Cursor Sharing and Highlighting

#### Cursor Visibility

- Each participant's cursor is displayed with a unique color
- Cursor labels show usernames for easy identification
- Cursor positions are updated in real-time as users type or move
- Cursor labels appear above the text by default, switching to - below when near the top of the editor

#### Text Selection

- Active selections are highlighted for all participants
- Selection highlights appear in both the main editor and minimap
- Multiple concurrent selections from different users are supported
- Selection information (character count) is displayed in the status bar

### Follow Mode

Follow Mode allows users to track another participant's actions in real-time:

#### Enabling Follow Mode

1. Click on a user's avatar in the user list
2. Select "Follow" from the context menu
3. Your editor view will now sync with the selected user's actions

#### Follow Mode Features

- Automatic scrolling to match the followed user's view
- Real-time cursor position tracking
- Synchronized text selections
- Visual indicator showing who you're following

#### Limitations

- You cannot follow a user who is already following you
- You cannot follow a user who is already following another user

### User List and Presence

### Video & Voice Communication

## Code Editor

### Monaco Editor Features

### Language Support

### Syntax Highlighting

### Editor Settings and Customisation

### Keyboard Shortcuts

## Code Execution

### Supported Languages

### Using the Shared Terminal

### Running Code

### Passing Arguments

### Handling Input/Output

### Common Error Messages

## GitHub Integration

### Authentication

### Opening Files from GitHub

### Saving Files to GitHub

### Repository Browser

### Commit Changes

## Live UI Preview

### Supported Libraries

### Preview Panel Usage

### Real-time Updates

### Tailwind CSS Integration

## Collaborative Note-Taking

### WYSIWYG Editor Features

### Markdown Support

### Real-time Synchronisation

### Saving and Opening Notes

## Additional Features

### Panel Management

### Theme Customisation

### Room Sharing

### QR Code Generation

### Mobile Device Support

## Troubleshooting

### Live Preview not Updating or Displaying Error

The Live Preview is not updating or displaying this error (where `x` is a random string):

```txt
The webpage at https://xxxxxx-preview.sandpack-static-server.codesandbox.io/ might be temporarily down or it may have moved permanently to a new web address.
```

This issue can be caused by:

- Idling for an extended period
- Network connectivity problems

To resolve this issue:

1. Re-toggle the Live Preview panel by going to `View > Live Preview` in the top menu bar

### Follow Mode not working

This issue can be caused by:

- Following a user who is already following you
- Following a user who is already following another user
- Network connectivity problems

To resolve this issue:

1. Stop following the user
2. Ask the user to stop following you
3. Re-enable Follow Mode

### Code is not Syncing Between Users

This issue can be caused by:

- Network connectivity problems

This issue cannot be caused by idling for an extended period as Socket.IO maintains a persistent connection by pinging the server periodically.

To resolve this issue:

1. Save your work, either by saving to local or GitHub
2. Leave the room and create a new room

### This Language may not be Supported or the Server is Down

This issue can be caused by:

- The selected language is not supported for execution
- The execution server is down

To resolve this issue:

1. Check the list of [supported execution languages](<[#supported-execution-languages](https://github.com/engineer-man/piston?tab=readme-ov-file#supported-languages)>)
2. Wait for the [execution server](https://github.com/engineer-man/piston) to come back online

### Error Parsing Markdown

This issue can be caused by:

- Incorrect markdown syntax
- Incorrect markdown commands

To resolve this issue:

1. Switch to `source` mode in the Notepad
2. Correct the markdown syntax or commands
3. Switch back to `rich text` mode to view the changes

### Parsing of the Following Markdown Structure Failed

This issue can be caused by:

- Incorrect markdown syntax
- Incorrect markdown commands

To resolve this issue:

1. Switch to `source` mode in the Notepad
2. Correct the markdown syntax or commands
3. Switch back to `rich text` mode to view the changes

## Performance Tips

Live Preview is a heavy feature that may impact performance on low-end devices as it requires constant updates. To improve performance:

- Close the Live Preview panel when not in use by going to `View > Live Preview` in the top menu bar

The Notepad may also be slow on low-end devices when handling large amounts of text as it is not optimized for real-time updates. To improve performance:

- Avoid having multiple users editing the same note simultaneously
- Limit the amount of text in a single note

## Security Considerations

Live Preview and Code Execution will run code in a sandboxed environment to prevent malicious code execution. However, it is recommended to avoid running untrusted code and pasting sensitive information into the editor.

## Privacy and Security

### Data Handling

Kasca does not store any user data on the server except for:

- Display names
- User IDs
- Room IDs
- Code
- Notes

All data is stored temporarily during a session and is cleared once the session ends. The session ends and the room is automatically deleted when all users leave the room.

### User Privacy

When using Kasca, your data is encrypted in transit using HTTPS and stored securely on the server. However, it is recommended to avoid sharing sensitive information on the platform.

Kasca uses [Vercel Analytics](https://vercel.com/docs/analytics) and [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) to collect anonymous usage data for improving the platform including:

- Country of origin
- Browser type
- Operating system
- Page views\*
- Referrers

No personal data is collected or stored.

\*Page views is collected from users who visit the homepage only so other pages (e.g. session page with room ID) are not tracked.

Kasca uses [Sentry](https://sentry.io) for error tracking to help identify and fix issues quickly. No personal data is collected or stored. The [Sentry's Session Replay](https://docs.sentry.io/product/explore/session-replay/) feature is enabled for faster debugging, and **all user inputs are masked** to prevent data exposure. Learn more about [how Session Replay captures data while protecting user privacy](https://docs.sentry.io/security-legal-pii/scrubbing/protecting-user-privacy/).

### GitHub Access Permissions

Kasca uses GitHub OAuth to authenticate users and access repositories. When you connect your GitHub account, Kasca requests only one permission scope:

- `repo` - Grants full access to public and private repositories including read and write access to code, commit statuses, repository invitations, collaborators, deployment statuses, and repository webhooks. **Note**: In addition to repository related resources, the `repo` scope also grants access to manage organization-owned resources including projects, invitations, team memberships and webhooks. This scope also grants the ability to manage projects owned by users.

Kasca does not store your GitHub access token. The token is stored securely in your browser's Cookies and is used only for making API requests to GitHub on your behalf.

To prevent unauthorized access to your GitHub account, the stored GitHub access token will expire after 7 days and you will need to reconnect your GitHub account to continue using the GitHub features.

You can revoke access at any time by disconnecting your GitHub account from Kasca by going to `Settings > Github Connection` and clicking `Disconnect`.

Learn more about [GitHub's Scopes for OAuth apps](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

## Appendix

### Supported Programming Languages

#### Supported Editor Languages

#### Supported Execution Languages

### Keyboard Shortcuts Reference

### External Service Dependencies
