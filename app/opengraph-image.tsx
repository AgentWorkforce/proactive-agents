import { createOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";
import { SITE_DESCRIPTION } from "@/lib/seo";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return createOgImage("Proactive Agents", SITE_DESCRIPTION, "peach");
}
