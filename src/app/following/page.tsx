import type { Metadata } from "next";
import FollowingView from "@/components/FollowingView";

export const metadata: Metadata = { title: "Following · SF6 Community Tier List" };

export default function FollowingPage() {
  return <FollowingView />;
}
