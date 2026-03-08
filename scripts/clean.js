/**
 * Cleanup script for removing build artifacts and node_modules.
 * Features:
 * - Directory cleanup
 * - Interactive prompts
 * - Process cleanup
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

const fs = require("node:fs/promises");
const path = require("node:path");
const readline = require("node:readline");
const { execSync } = require("node:child_process");

const dirsToClean = [
  "apps/client/.next",
  "apps/client/.turbo",
  "apps/client/node_modules",
  "apps/client/playwright-report",
  "apps/client/test-results",
  "apps/server/.turbo",
  "apps/server/dist",
  "apps/server/node_modules",
  "apps/server/test-results",
  "packages/types/.turbo",
  "packages/types/dist",
  ".turbo",
  "node_modules",
];

function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function promptUser(question) {
  const rl = createPrompt();
  try {
    return await new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.toLowerCase().startsWith("y"));
      });
    });
  } finally {
    rl.close();
  }
}

function killProcesses() {
  try {
    switch (process.platform) {
      case "win32":
        execSync("taskkill /F /IM turbo.exe /T 2>nul", { stdio: "ignore" });
        execSync("taskkill /F /IM node.exe /T 2>nul", { stdio: "ignore" });
        break;
      case "darwin":
      case "linux":
        execSync('pkill -f "turbo"', { stdio: "ignore" });
        execSync('pkill -f "node"', { stdio: "ignore" });
        break;
      default:
        break;
    }
  } catch (_err) {
    // Ignore if no processes found
  }
}

async function removePath(filepath) {
  try {
    const stats = await fs.stat(filepath);
    if (stats.isDirectory()) {
      if (process.platform === "win32") {
        try {
          execSync(`rd /s /q "${filepath}"`, { stdio: "ignore" });
          console.log(`✅ Removed using rd: ${filepath}`);
          return true;
        } catch (_err) {
          // Fall back to Node.js fs
        }
      } else {
        try {
          execSync(`rm -rf "${filepath}"`, { stdio: "ignore" });
          console.log(`✅ Removed using rm: ${filepath}`);
          return true;
        } catch (_err) {
          // Fall back to Node.js fs
        }
      }
      await fs.rm(filepath, { recursive: true, force: true });
      console.log(`✅ Removed: ${filepath}`);
      return true;
    }
    await fs.unlink(filepath);
    console.log(`✅ Removed file: ${filepath}`);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(`ℹ️ Already clean: ${filepath}`);
      return false;
    }

    const isPermissionError = err.code === "EPERM" || err.code === "ENOTEMPTY";

    if (isPermissionError) {
      console.warn(`⚠️ Permission error removing ${filepath}`);
      const shouldKill = await promptUser(
        "❓ Would you like to terminate Node processes and try again? (y/N) "
      );

      if (shouldKill) {
        await killProcesses();
        // Wait for processes to fully terminate
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Try removal again
        return removePath(filepath);
      }
    } else {
      console.warn(`⚠️ Failed to remove ${filepath}:`, err.message);
    }
    return false;
  }
}

async function clean() {
  console.log("🧹 Starting cleanup...\n");

  let cleanedCount = 0;
  let skippedCount = 0;

  for (const dir of dirsToClean) {
    const fullPath = path.join(import.meta.dirname, "..", dir);
    console.log(`🗑️ Cleaning: ${dir}`);
    const wasRemoved = await removePath(fullPath);
    if (wasRemoved) {
      cleanedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log("\n📊 Cleanup Summary:");
  console.log(`   ${cleanedCount} directories cleaned`);
  console.log(`   ${skippedCount} directories skipped`);

  if (cleanedCount === 0 && skippedCount === dirsToClean.length) {
    console.log("\n✨ Nothing to clean - all directories are already clean!");
  } else {
    console.log("\n✨ Cleanup completed!");
  }
}

// Handle script termination
process.on("SIGINT", () => {
  console.log("\n⚠️ Cleanup interrupted");
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled promise rejection:", err);
  process.exit(1);
});

clean().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
