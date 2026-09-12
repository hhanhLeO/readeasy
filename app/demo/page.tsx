import type { Metadata } from "next";
import { DemoTour } from "./components/demo-tour";

export const metadata: Metadata = {
  title: "How it works - ReadEasy AI",
};

export default function DemoPage() {
  return <DemoTour />;
}
