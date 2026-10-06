import { renderPartyPreview } from "@/lib/party-preview";

export const alt = "A party on Spuds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PartyPreviewImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return renderPartyPreview((await params).id);
}
