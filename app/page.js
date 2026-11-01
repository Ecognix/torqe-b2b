import ConsoleApp from "../components/ConsoleApp";
import "./console.css";

export const metadata = {
  title: "Torqe Console",
  description: "The Torqe command center for conversations, approvals, and agent operations.",
  robots: { index: false, follow: false },
};

export default function ConsolePage() {
  return <ConsoleApp />;
}
