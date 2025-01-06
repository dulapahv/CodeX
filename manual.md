# Kasca User manual

- [Kasca User manual](#kasca-user-manual)
  - [Getting Started](#getting-started)
    - [Accessing Kasca](#accessing-kasca)
    - [Creating a Room](#creating-a-room)
    - [Joining a Room](#joining-a-room)
      - [Method 1: Using a Room ID](#method-1-using-a-room-id)
      - [Method 2: Using an Invite Link](#method-2-using-an-invite-link)
      - [Method 3: Scanning QR Code](#method-3-scanning-qr-code)
    - [User Interface Overview](#user-interface-overview)
      - [Top Bar](#top-bar)
      - [Main Work Area (Split into Panels)](#main-work-area-split-into-panels)
      - [Bottom Panel](#bottom-panel)
      - [Status Bar](#status-bar)
  - [Room Sharing](#room-sharing)
    - [Method 1: Room ID](#method-1-room-id)
    - [Method 2: Invite Link](#method-2-invite-link)
    - [Method 3: QR Code](#method-3-qr-code)
  - [Code Editor](#code-editor)
    - [Cursor](#cursor)
    - [Text Selection](#text-selection)
    - [Code Editor Settings](#code-editor-settings)
  - [Follow Mode](#follow-mode)
    - [Enabling Follow Mode](#enabling-follow-mode)
    - [Limitations](#limitations)
  - [Code Execution](#code-execution)
    - [Passing Arguments and Input (stdin)](#passing-arguments-and-input-stdin)
  - [Shared Terminal](#shared-terminal)
    - [Download Output](#download-output)
    - [Clear Output](#clear-output)
  - [GitHub Integration](#github-integration)
    - [Authentication](#authentication)
    - [Opening Files from GitHub](#opening-files-from-github)
    - [Saving Files to GitHub](#saving-files-to-github)
  - [Live UI Preview](#live-ui-preview)
    - [Supported Libraries](#supported-libraries)
    - [Preview Panel Usage](#preview-panel-usage)
    - [Real-time Updates](#real-time-updates)
    - [Tailwind CSS Integration](#tailwind-css-integration)
  - [Notepad](#notepad)
    - [Notepad Features](#notepad-features)
    - [Markdown Support](#markdown-support)
    - [Real-time Synchronization](#real-time-synchronization)
    - [Saving and Opening Notes](#saving-and-opening-notes)
  - [Video \& Voice Communication](#video--voice-communication)
  - [Troubleshooting](#troubleshooting)
    - [Live Preview not Updating or Displaying Error](#live-preview-not-updating-or-displaying-error)
    - [Follow Mode not working](#follow-mode-not-working)
    - [Code is not Syncing Between Users](#code-is-not-syncing-between-users)
    - [This language may not be supported or the server is down](#this-language-may-not-be-supported-or-the-server-is-down)
    - [No code to execute](#no-code-to-execute)
    - [Error parsing markdown](#error-parsing-markdown)
    - [Please check the information and try again](#please-check-the-information-and-try-again)
    - [Failed to import settings. Please check the file format](#failed-to-import-settings-please-check-the-file-format)
    - [Parsing of the Following Markdown Structure Failed](#parsing-of-the-following-markdown-structure-failed)
    - [Error accessing media devices](#error-accessing-media-devices)
    - [Please grant `media-device` permissions to see available devices](#please-grant-media-device-permissions-to-see-available-devices)
    - [Error enumerating devices](#error-enumerating-devices)
    - [Error toggling `media-device`](#error-toggling-media-device)
    - [Error Setting Audio Output](#error-setting-audio-output)
    - [No active media stream](#no-active-media-stream)
    - [No audio track found](#no-audio-track-found)
    - [Error creating peer connection](#error-creating-peer-connection)
    - [Performance Tips](#performance-tips)
  - [Security Considerations](#security-considerations)
  - [Privacy and Security](#privacy-and-security)
    - [Data Handling](#data-handling)
    - [User Privacy](#user-privacy)
    - [GitHub Access Permissions](#github-access-permissions)
  - [Appendix](#appendix)
    - [Supported Editor Languages](#supported-editor-languages)
    - [Supported Execution Languages](#supported-execution-languages)
    - [Keyboard Shortcuts](#keyboard-shortcuts)

## Getting Started

### Accessing Kasca

Kasca is a web-based application that requires no installation. To access Kasca:

1. Open your web browser
2. Navigate to [https://kasca.dulapahv.dev/](https://kasca.dulapahv.dev/).
3. The platform will load automatically in your browser

### Creating a Room

To create a new coding session:

1. On the homepage, locate the `Create a Room` section
2. Enter your preferred display name in the `Name` field
3. Click `+ Create Room` to start a new session
4. You'll be automatically redirected to your coding room

### Joining a Room

A valid room ID must be in a `XXXX-XXXX` format where `X` is an alphanumeric character.

There are three ways to join an existing room:

#### Method 1: Using a Room ID

1. On the homepage, find the `Join a Room` section
2. Input the room ID provided by the room creator in the `Room ID` field.
   > When inputting the room ID, no need to include the hyphen `-` as it will be added automatically.
3. Enter your display name in the `Name` field
4. Click `Join Room →`

#### Method 2: Using an Invite Link

1. Click the invite link shared with you
2. Enter your display name in the `Name` field when prompted
3. Click `Join Room →`

#### Method 3: Scanning QR Code

1. Use your mobile device to scan the QR code shared by the room creator
2. Enter your display name in the `Name` field when prompted
3. Click `Join Room →`

### User Interface Overview

Once you enter a room, you'll see several key interface elements.
The interface is divided into several sections, each section contains multiple panels.

- Panels can be resized by dragging the dividers
- Panels can be hidden/shown using toolbar buttons (`view > panel name`)

#### Top Bar

1. **Menu Bar**
   - Contains File, Edit, Selection, View, and Help menus
2. **Run Code Button**
   - Execute your code directly from the editor
   - For list of supported execution languages, refer to the [Supported Execution Languages](#supported-execution-languages) section
3. **User List**
   - Displays the list of users in the room
4. **Share Button**
   - Share your room with others via a link or QR code
5. **Follow User**
   - Opens a dropdown to follow another user's actions
6. **Settings**
   - Connect to GitHub, and adjust editor settings

#### Main Work Area (Split into Panels)

1. **Left Most Panel - Notepad**

   - Rich text formatting toolbar (Bold, Italic, Underline, etc.)
   - Block type selector for different content types
   - Collaborative note-taking area
   - Table and media insertion tools

2. **Center Left Panel - Code Editor**

   - Main coding area with syntax highlighting
   - Line numbers
   - Real-time collaboration
   - Multi-cursor support

3. **Right Right Panel - Live UI Preview**
   - Live preview of code output
   - UI rendering for web development
   - Real-time updates

4. **Right Most Panel - Video & Voice Communication**
   - Video and voice communication controls
   - Toggle camera, microphone, and audio settings
   - See and hear other participants

#### Bottom Panel

1. **Terminal**

- Shared terminal with welcome message
- Command output display
- Download and clear outputs options
- Color-coded text output

#### Status Bar

1. **Language Selector:**
   - Shows current programming language (e.g., "HTML")
   - For list of supported editor languages, refer to the [Supported Editor Languages](#supported-editor-languages) section
2. **Line and Column Indicator:**
   - Shows cursor position in the editor

## Room Sharing

Kasca allows you to share your room with others using multiple methods:

### Method 1: Room ID

1. Click the `Share` button in the top bar
2. Copy the room ID from the `Room ID` field

### Method 2: Invite Link

1. Click the `Share` button in the top bar
2. Click the `Copy Invite Link` button

### Method 3: QR Code

1. Click the `Share` button in the top bar

## Code Editor

The Monaco Editor forms the core of Kasca's collaborative coding environment, enabling multiple users to code together in real-time. Key features include:

- Real-time synchronization of code changes across all participants
- Multi-cursor support showing everyone's positions
- Syntax highlighting for over 90 programming languages (For a list of supported editor languages, refer to the [Supported Editor Languages](#supported-editor-languages) section)
- Intellisense for code completion
- Error detection and linting
- You can configure, import and export editor settings to customize your coding environment. Learn more in the [Code Editor Settings](#code-editor-settings) section
- The editor supports multiple shortcuts for common actions. Refer to the [Keyboard Shortcuts](#keyboard-shortcuts) section for a list of supported shortcuts

### Cursor

Each participant's cursor is displayed with a unique color. The color is generated from user name and is consistent across all participants

- Cursor labels show usernames and colors
- Cursor positions are updated in real-time as users type or move
- Cursor labels appear above the text by default, and appear below when at the first line of the editor

### Text Selection

- Active selections are highlighted for all participants
- Selection highlights appear in both the main editor and minimap
- Multiple concurrent selections from different users are supported
- Selection information (character count) is displayed in the lower right corner of the status bar

### Code Editor Settings

You can configure the code editor as well as its theme to suit your preferences by going to `Settings` in the upper right corner of the top bar.

- To import settings, click on the `Import Settings` button and upload a JSON file
- To export settings, click on the `Export Settings` button to download a JSON file

The settings are persisted across sessions and are stored in your browser's local storage.

## Follow Mode

Follow Mode allows users to track another participant's actions in real-time by syncing their view with the followed user's view.

### Enabling Follow Mode

1. Click on the Follow User button in the upper right corner of the top bar
2. Select or search for the user you want to follow
3. Your editor view will now sync with the selected user's actions

### Limitations

- You cannot follow a user who is already following you
- You cannot follow a user who is already following another user

## Code Execution

You can execute code directly from the editor using the `Run Code` button in the top bar. The output will be displayed in the [Shared Terminal](#shared-terminal).

For a list of supported execution languages, refer to the [Supported Execution Languages](#supported-execution-languages) section.

### Passing Arguments and Input (stdin)

You can pass arguments to your code by:

1. Click on the arrow down icon next to the `Run Code` button
2. Enter your arguments or input in the text area

Arguments and Input must be separated by a newline. For example:

```txt
input1
42 Bangkok
1 2 3
```

Empty lines are ignored. You can also use `'` and `"` in your arguments and input.

## Shared Terminal

### Download Output

### Clear Output

## GitHub Integration

### Authentication

### Opening Files from GitHub

### Saving Files to GitHub

## Live UI Preview

### Supported Libraries

### Preview Panel Usage

### Real-time Updates

### Tailwind CSS Integration

## Notepad

### Notepad Features

### Markdown Support

### Real-time Synchronization

### Saving and Opening Notes

## Video & Voice Communication

## Troubleshooting

### Live Preview not Updating or Displaying Error

The Live Preview is not updating or displaying this error (where `x` is a random string):

```txt
The webpage at https://xxxxxx-preview.sandpack-static-server.codesandbox.io/ might be temporarily down or it may have moved permanently to a new web address.
```

**This issue can be caused by:**

- Idling for an extended period
- Network connectivity problems

**To resolve this issue:**

- Re-toggle the Live Preview panel by going to `View > Live Preview` in the top menu bar

### Follow Mode not working

**This issue can be caused by:**

- Following a user who is already following you
- Following a user who is already following another user
- Network connectivity problems

**To resolve this issue:**

- Stop following the user
- Ask the user to stop following you
- Re-enable Follow Mode

### Code is not Syncing Between Users

**This issue can be caused by:**

- Network connectivity problems

This issue cannot be caused by idling for an extended period as Socket.IO maintains a persistent connection by pinging the server periodically.

**To resolve this issue:**

1. Save your work, either by saving to local or GitHub
2. Leave the room and create a new room

### This language may not be supported or the server is down

**This issue can be caused by:**

- The selected language is not supported for execution
- The execution server is down

**To resolve this issue:**

- Check the list of [supported execution languages](<[#supported-execution-languages](https://github.com/engineer-man/piston?tab=readme-ov-file#supported-languages)>)
- Wait for the [execution server](https://github.com/engineer-man/piston) to come back online

### No code to execute

**This issue can be caused by:**

- No code in the editor

**To resolve this issue:**

- Write code in the editor

### Error parsing markdown

**This issue can be caused by:**

- Incorrect markdown syntax
- Incorrect markdown commands

**To resolve this issue:**

1. Switch to `source` mode in the Notepad
2. Correct the markdown syntax or commands
3. Switch back to `rich text` mode to see if the error disappears

### Please check the information and try again

**This issue can be caused by:**

- Not filling in the required fields
- Fields containing incorrect information
  - Name must not be empty and must not exceed 64 characters
  - Room ID must be in `XXXX-XXXX` format where `X` is an alphanumeric character

**To resolve this issue:**

- Check the information entered in the fields
- Correct any errors

### Failed to import settings. Please check the file format

**This issue can be caused by:**

- Trying to import settings from an unsupported file format
- Settings file is not a valid JSON file or is corrupted

**To resolve this issue:**

- Check the file format and ensure it is a valid JSON file

### Parsing of the Following Markdown Structure Failed

**This issue can be caused by:**

- Incorrect markdown syntax
- Incorrect markdown commands

**To resolve this issue:**

1. Switch to `source` mode in the Notepad
2. Correct the markdown syntax or commands
3. Switch back to `rich text` mode to see if the error disappears

### Error accessing media devices

**This issue can be caused by:**

- Browser permissions are not granted

**To resolve this issue:**

- Grant the browser permissions to access media devices (camera, microphone, audio)

### Please grant `media-device` permissions to see available devices

**This issue can be caused by:**

- Browser permissions are not granted

**To resolve this issue:**

- Grant the browser permissions to access media devices (camera, microphone, audio)

### Error enumerating devices

**This issue can be caused by:**

- Browser permissions are not granted

**To resolve this issue:**

- Grant the browser permissions to access media devices (camera, microphone, audio)

### Error toggling `media-device`

**This issue can be caused by:**

- Media device is invalid
- Browser permissions are not granted

**To resolve this issue:**

- Grant the browser permissions to access media devices (camera, microphone, audio)
- Leave the room and refresh the page then rejoin the room
- Reopen the browser and recreate the room

### Error Setting Audio Output

**This issue can be caused by:**

- Audio device is invalid

**To resolve this issue:**

- Leave the room and refresh the page then rejoin the room
- Reopen the browser and recreate the room
- Change to other audio devices

### No active media stream

**This issue can be caused by:**

- Disconnected from the server

**To resolve this issue:**

- Leave the room and refresh the page then rejoin the room
- Reopen the browser and recreate the room

### No audio track found

**This issue can be caused by:**

- Disconnected from the server

**To resolve this issue:**

- Leave the room and refresh the page then rejoin the room
- Reopen the browser and recreate the room

### Error creating peer connection

**This issue can be caused by:**

- Disconnected from the server

**To resolve this issue:**

- Leave the room and refresh the page then rejoin the room
- Reopen the browser and recreate the room

### Performance Tips

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

### Supported Editor Languages

| Language | File Extensions |
|----------|----------------|
| Plain Text | `txt` |
| abap | `abap` |
| Apex | `cls` |
| Azure CLI | `azcli` |
| Batch | `bat`,`cmd` |
| Bicep | `bicep` |
| Cameligo | `mligo` |
| clojure | `clj`,`cljs`,`cljc`,`edn` |
| CoffeeScript | `coffee` |
| C | `c`,`h` |
| C++ | `cpp`,`cc`,`cxx`,`hpp`,`hh`,`hxx` |
| C# | `cs`,`csx`,`cake` |
| CSP | - |
| CSS | `css` |
| Cypher | `cypher`,`cyp` |
| Dart | `dart` |
| Dockerfile | `dockerfile` |
| ECL | `ecl` |
| Elixir | `ex`,`exs` |
| Flow9 | `flow` |
| F# | `fs`,`fsi`,`ml`,`mli`,`fsx`,`fsscript` |
| FreeMarker2 | `ftl`,`ftlh`,`ftlx` |
| FreeMarker2 | `Angle/Dollar` |
| FreeMarker2 | `Bracket/Dollar` |
| FreeMarker2 | `Angle/Bracket` |
| FreeMarker2 | `Bracket/Bracket` |
| FreeMarker2 | `Auto/Dollar` |
| FreeMarker2 | `Auto/Bracket` |
| Go | `go` |
| GraphQL | `graphql`,`gql` |
| Handlebars | `handlebars`,`hbs` |
| Terraform | `tf`,`tfvars`,`hcl` |
| HTML | `html`,`htm`,`shtml`,`xhtml`,`mdoc`,`jsp`,`asp`,`aspx`,`jshtm` |
| Ini | `ini`,`properties`,`gitconfig` |
| Java | `java`,`jav` |
| JavaScript | `js`,`es6`,`jsx`,`mjs`,`cjs` |
| julia | `jl` |
| Kotlin | `kt`,`kts` |
| Less | `less` |
| Lexon | `lex` |
| Lua | `lua` |
| Liquid | `liquid`,`html.liquid` |
| Modula-3 | `m3`,`i3`,`mg`,`ig` |
| Markdown | `md`,`markdown`,`mdown`,`mkdn`,`mkd`,`mdwn`,`mdtxt`,`mdtext` |
| MDX | `mdx` |
| MIPS | `s` |
| DAX | `dax`,`msdax` |
| MySQL | - |
| Objective-C | `m` |
| Pascal | `pas`,`p`,`pp` |
| Pascaligo | `ligo` |
| Perl | `pl`,`pm` |
| PostgreSQL | - |
| PHP | `php`,`php4`,`php5`,`phtml`,`ctp` |
| Unknown | `pla` |
| ATS | `dats`,`sats`,`hats` |
| PQ | `pq`,`pqm` |
| PowerShell | `ps1`,`psm1`,`psd1` |
| protobuf | `proto` |
| Pug | `jade`,`pug` |
| Python | `py`,`rpy`,`pyw`,`cpy`,`gyp`,`gypi` |
| Q# | `qs` |
| R | `r`,`rhistory`,`rmd`,`rprofile`,`rt` |
| Razor | `cshtml` |
| redis | `redis` |
| Redshift | - |
| reStructuredText | `rst` |
| Ruby | `rb`,`rbx`,`rjs`,`gemspec`,`pp` |
| Rust | `rs`,`rlib` |
| Small Basic | `sb` |
| Scala | `scala`,`sc`,`sbt` |
| scheme | `scm`,`ss`,`sch`,`rkt` |
| Sass | `scss` |
| Shell | `sh`,`bash` |
| sol | `sol` |
| aes | `aes` |
| sparql | `rq` |
| SQL | `sql` |
| StructuredText | `st`,`iecst`,`iecplc`,`lc3lib`,`TcPOU`,`TcDUT`,`TcGVL`,`TcIO` |
| Swift | `swift` |
| SV | `sv`,`svh` |
| V | `v`,`vh` |
| tcl | `tcl` |
| Twig | `twig` |
| TypeScript | `ts`,`tsx`,`cts`,`mts` |
| Visual Basic | `vb` |
| WebGPU Shading Language | `wgsl` |
| XML | `xml`,`xsd`,`dtd`,`ascx`,`csproj`,`config`,`props`,`targets`,`wxi`,`wxl`,`wxs`,`xaml`,`svg`,`svgz`,`opf`,`xslt`,`xsl` |
| YAML | `yaml`,`yml` |
| JSON | `json`,`bowerrc`,`jshintrc`,`jscsrc`,`eslintrc`,`babelrc`,`har` |

### Supported Execution Languages

Referenced from the [Piston documentation](https://github.com/engineer-man/piston#Supported-Languages).

`awk`,`bash`,`befunge93`,`brachylog`,`brainfuck`,`bqn`,`c`,`c++`,`cjam`,`clojure`,`cobol`,`coffeescript`,`cow`,`crystal`,`csharp`,`csharp.net`,`d`,`dart`,`dash`,`dragon`,`elixir`,`emacs`,`emojicode`,`erlang`,`file`,`forte`,`forth`,`fortran`,`freebasic`,`fsharp.net`,`fsi`,`go`,`golfscript`,`groovy`,`haskell`,`husk`,`iverilog`,`japt`,`java`,`javascript`,`jelly`,`julia`,`kotlin`,`lisp`,`llvm_ir`,`lolcode`,`lua`,`matl`,`nasm`,`nasm64`,`nim`,`ocaml`,`octave`,`osabie`,`paradoc`,`pascal`,`perl`,`php`,`ponylang`,`powershell`,`prolog`,`pure`,`pyth`,`python`,`python2`,`racket`,`raku`,`retina`,`rockstar`,`rscript`,`ruby`,`rust`,`samarium`,`scala`,`smalltalk`,`sqlite3`,`swift`,`typescript`,`basic`,`basic.net`,`vlang`,`vyxal`,`yeethon`,`zig`,

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Command Palette | `F1` |
| Open from Local | `Ctrl + O` |
| Open from GitHub | `Ctrl + Shift + O` |
| Save to Local | `Ctrl + S` |
| Save to GitHub | `Ctrl + Shift + S` |
| Settings | `Ctrl + ,` |
| Leave Room | `Ctrl + Q` |
| Undo | `Ctrl + Z` |
| Redo | `Ctrl + Y` |
| Cut | `Ctrl + X` |
| Copy | `Ctrl + C` |
| Paste | `Ctrl + V` |
| Find | `Ctrl + F` |
| Replace | `Ctrl + H` |
| Toggle Line Comment | `Ctrl + /` |
| Toggle Block Comment | `Ctrl + Shift + /` |
| Select All | `Ctrl + A` |
| Copy Line Up | `Shift + Alt + ↑` |
| Copy Line Down | `Shift + Alt + ↓` |
| Move Line Up | `Alt + ↑` |
| Move Line Down | `Alt + ↓` |
| Add Cursor Above | `Ctrl + Alt + ↑` |
| Add Cursor Below | `Ctrl + Alt + ↓` |
| Zoom In | `Ctrl + =` |
| Zoom Out | `Ctrl + -` |
