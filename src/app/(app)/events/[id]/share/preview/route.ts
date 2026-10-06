import { renderPartyPreview } from "@/lib/party-preview";

/**
 * The same card crawlers get from opengraph-image, at a stable URL the
 * host's share screen can show. (Next only serves opengraph-image at a
 * hashed path.)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return renderPartyPreview((await params).id);
}
