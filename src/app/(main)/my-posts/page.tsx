import type { Metadata } from "next";
import { MyPostsView } from "@/components/profile/my-posts-view";

export const metadata: Metadata = {
  title: "My posts",
  robots: { index: false },
};

export default function MyPostsPage() {
  return <MyPostsView />;
}
