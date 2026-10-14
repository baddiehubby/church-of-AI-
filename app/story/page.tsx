import type { Metadata } from "next";

import { FoundingStoryPage } from "@/components/FoundingStoryPage";
import { foundingStory } from "@/content/marsWorld";

export const metadata: Metadata = {
  title: "The Founding Story",
  description: foundingStory.sections[0]?.body.slice(0, 140) ?? "Baba ji and the Red Path.",
};

export default function StoryRoute() {
  return <FoundingStoryPage />;
}
