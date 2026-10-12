// Photos members attach to listings, claims, chats and profiles, kept in R2 and served from /api/img/.
// The browser shrinks photos before sending (src/lib/images-client.ts), so these are small.

const MAX_BYTES = 2_500_000;

/** Accepted formats, recognised by their first bytes rather than by what the request claims. */
const FORMATS = [
  { ext: "jpg", type: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  { ext: "png", type: "image/png", magic: [0x89, 0x50, 0x4e, 0x47] },
  // "RIFF", four length bytes, then "WEBP"
  { ext: "webp", type: "image/webp", magic: [0x52, 0x49, 0x46, 0x46, -1, -1, -1, -1, 0x57, 0x45, 0x42, 0x50] },
] as const;

const refuse = (status: number, message: string) => Response.json({ message }, { status });

export async function upload(request: Request, env: Env, uploaderId: string): Promise<Response> {
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BYTES) return refuse(413, "That photo is too large.");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > MAX_BYTES) return refuse(413, "That photo is too large.");
  const format = FORMATS.find((f) => f.magic.every((b, i) => b === -1 || bytes[i] === b));
  if (!format) return refuse(415, "Photos need to be JPEG, PNG or WebP.");

  const name = `${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}.${format.ext}`;
  await env.UPLOADS.put(name, bytes, { httpMetadata: { contentType: format.type }, customMetadata: { uploader: uploaderId } });
  return Response.json({ src: `/api/img/${name}` });
}

export async function serveImage(name: string, env: Env): Promise<Response> {
  const object = /^[a-z0-9]{16,40}\.(?:jpg|png|webp)$/.test(name) ? await env.UPLOADS.get(name) : null;
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      // Names are random and never reused, so a photo can be cached for good.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
