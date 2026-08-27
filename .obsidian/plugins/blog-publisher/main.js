const { FileSystemAdapter, Notice, Platform, Plugin } = require("obsidian");
const { execFile } = require("child_process");
const path = require("path");

module.exports = class BlogPublisherPlugin extends Plugin {
  onload() {
    // The manifest prevents loading on iOS and Android. Avoid exposing the
    // publishing UI on Windows and Linux, where the helper is not supported.
    if (!Platform.isMacOS || !Platform.isDesktopApp) {
      return;
    }

    this.addRibbonIcon("upload-cloud", "Publish blog", () => {
      this.publishBlog();
    });

    this.addCommand({
      id: "publish-blog",
      name: "Publish blog",
      callback: () => this.publishBlog(),
    });
  }

  publishBlog() {
    if (!Platform.isMacOS || !Platform.isDesktopApp) {
      new Notice("Publishing requires running Obsidian on a Mac.");
      return;
    }

    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) {
      new Notice("Publishing requires a local vault on your Mac.");
      return;
    }

    const vaultPath = adapter.getBasePath();
    const scriptPath = path.join(vaultPath, "scripts", "publish");

    new Notice("Publishing blog…");

    execFile(scriptPath, [], { cwd: vaultPath, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const detail = stderr.trim() || stdout.trim() || error.message;
        console.error("Publish Blog failed:", error, detail);
        new Notice(`Publishing failed: ${detail}`, 10000);
        return;
      }

      const result = stdout.trim();
      console.log("Publish Blog:", result);
      new Notice(result.includes("Nothing to publish") ? "Nothing to publish." : "Blog published successfully.");
    });
  }
};
