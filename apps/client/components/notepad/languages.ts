/**
 * Languages offered for notepad code blocks, and the Prism grammars that
 * highlight them. Prism grammars extend each other, so the import order
 * below matters.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import Prism from "prismjs";

import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-scheme";
import "prismjs/components/prism-basic";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-clojure";
import "prismjs/components/prism-cobol";
import "prismjs/components/prism-crystal";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-d";
import "prismjs/components/prism-dart";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-elixir";
import "prismjs/components/prism-erlang";
import "prismjs/components/prism-fortran";
import "prismjs/components/prism-fsharp";
import "prismjs/components/prism-gdscript";
import "prismjs/components/prism-go";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-groovy";
import "prismjs/components/prism-haskell";
import "prismjs/components/prism-haxe";
import "prismjs/components/prism-http";
import "prismjs/components/prism-ini";
import "prismjs/components/prism-json";
import "prismjs/components/prism-julia";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-latex";
import "prismjs/components/prism-lisp";
import "prismjs/components/prism-lua";
import "prismjs/components/prism-makefile";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-matlab";
import "prismjs/components/prism-nasm";
import "prismjs/components/prism-nginx";
import "prismjs/components/prism-nim";
import "prismjs/components/prism-objectivec";
import "prismjs/components/prism-ocaml";
import "prismjs/components/prism-odin";
import "prismjs/components/prism-pascal";
import "prismjs/components/prism-perl";
import "prismjs/components/prism-php";
import "prismjs/components/prism-powershell";
import "prismjs/components/prism-prolog";
import "prismjs/components/prism-protobuf";
import "prismjs/components/prism-python";
import "prismjs/components/prism-r";
import "prismjs/components/prism-racket";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sass";
import "prismjs/components/prism-scala";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-solidity";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-tcl";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-v";
import "prismjs/components/prism-vbnet";
import "prismjs/components/prism-verilog";
import "prismjs/components/prism-vhdl";
import "prismjs/components/prism-wasm";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-zig";

export const PLAIN_TEXT = "plain";

// Keys are the fence names written to markdown
export const CODE_LANGUAGES: Record<string, string> = {
  [PLAIN_TEXT]: "Plain Text",
  bash: "Bash",
  c: "C",
  clojure: "Clojure",
  cobol: "COBOL",
  cpp: "C++",
  crystal: "Crystal",
  csharp: "C#",
  css: "CSS",
  d: "D",
  dart: "Dart",
  diff: "Diff",
  dockerfile: "Dockerfile",
  elixir: "Elixir",
  erlang: "Erlang",
  fortran: "Fortran",
  fsharp: "F#",
  gdscript: "GDScript",
  go: "Go",
  graphql: "GraphQL",
  groovy: "Groovy",
  haskell: "Haskell",
  haxe: "Haxe",
  html: "HTML",
  http: "HTTP",
  ini: "INI",
  java: "Java",
  javascript: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  julia: "Julia",
  kotlin: "Kotlin",
  latex: "LaTeX",
  lisp: "Lisp",
  lua: "Lua",
  makefile: "Makefile",
  markdown: "Markdown",
  matlab: "MATLAB",
  nasm: "NASM",
  nginx: "Nginx",
  nim: "Nim",
  objectivec: "Objective-C",
  ocaml: "OCaml",
  odin: "Odin",
  pascal: "Pascal",
  perl: "Perl",
  php: "PHP",
  powershell: "PowerShell",
  prolog: "Prolog",
  protobuf: "Protocol Buffers",
  python: "Python",
  r: "R",
  racket: "Racket",
  ruby: "Ruby",
  rust: "Rust",
  sass: "Sass",
  scala: "Scala",
  scheme: "Scheme",
  scss: "SCSS",
  solidity: "Solidity",
  sql: "SQL",
  swift: "Swift",
  tcl: "Tcl",
  toml: "TOML",
  tsx: "TSX",
  typescript: "TypeScript",
  v: "V",
  vbnet: "VB.NET",
  verilog: "Verilog",
  vhdl: "VHDL",
  wasm: "WebAssembly",
  xml: "XML",
  yaml: "YAML",
  zig: "Zig",
};

// Aliases like `py` or `sh` share a grammar object with their language
export const getLanguageKey = (language: string | null | undefined) => {
  if (!language) {
    return PLAIN_TEXT;
  }
  if (language in CODE_LANGUAGES) {
    return language;
  }
  const grammar = Prism.languages[language];
  const match = Object.keys(CODE_LANGUAGES).find(
    (key) => grammar && Prism.languages[key] === grammar
  );
  return match ?? language;
};
