import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import { storagePut } from "../storage";

export function registerStorageProxy(app: Express) {
  // Upload endpoint — accepts multipart/form-data with a 'file' field and optional 'key' field
  app.post("/api/storage/upload", async (req: Request, res: Response) => {
    try {
      // Parse multipart manually using the raw body
      const contentType = req.headers["content-type"] ?? "";
      if (!contentType.includes("multipart/form-data")) {
        res.status(400).json({ error: "Expected multipart/form-data" });
        return;
      }

      // Read raw body stream into a buffer
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", resolve);
        req.on("error", reject);
      });
      const rawBody = Buffer.concat(chunks);

      // Extract boundary from content-type header
      const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
      if (!boundaryMatch) {
        res.status(400).json({ error: "Missing boundary" });
        return;
      }
      const boundary = "--" + boundaryMatch[1];
      const boundaryBuf = Buffer.from(boundary);

      // Split body by boundary
      const parts: { headers: string; body: Buffer }[] = [];
      let start = rawBody.indexOf(boundaryBuf);
      while (start !== -1) {
        start += boundaryBuf.length;
        // Skip \r\n after boundary
        if (rawBody[start] === 0x0d && rawBody[start + 1] === 0x0a) start += 2;
        // Check for final boundary (--)
        if (rawBody[start] === 0x2d && rawBody[start + 1] === 0x2d) break;
        const end = rawBody.indexOf(boundaryBuf, start);
        if (end === -1) break;
        const part = rawBody.slice(start, end - 2); // strip trailing \r\n
        const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
        if (headerEnd === -1) { start = end; continue; }
        parts.push({
          headers: part.slice(0, headerEnd).toString("utf8"),
          body: part.slice(headerEnd + 4),
        });
        start = end;
      }

      let fileBuffer: Buffer | null = null;
      let fileName = "upload";
      let contentTypePart = "application/octet-stream";
      let keyField = "";

      for (const part of parts) {
        const dispMatch = part.headers.match(/Content-Disposition:.*?name="([^"]+)"(?:.*?filename="([^"]+)")?/i);
        if (!dispMatch) continue;
        const fieldName = dispMatch[1];
        const fn = dispMatch[2];
        const ctMatch = part.headers.match(/Content-Type:\s*([^\r\n]+)/i);
        if (fieldName === "file") {
          fileBuffer = part.body;
          if (fn) fileName = fn;
          if (ctMatch) contentTypePart = ctMatch[1].trim();
        } else if (fieldName === "key") {
          keyField = part.body.toString("utf8").trim();
        }
      }

      if (!fileBuffer) {
        res.status(400).json({ error: "No file field found in upload" });
        return;
      }

      const key = keyField || `uploads/${Date.now()}_${fileName}`;
      const result = await storagePut(key, fileBuffer, contentTypePart);
      res.json({ url: result.url, key: result.key });
    } catch (err: any) {
      console.error("[StorageUpload] error:", err);
      res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  });

  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
