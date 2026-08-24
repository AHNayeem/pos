import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | POS + - Next.js Dashboard Template",
  description: "This is Next.js SignUp Page POS + Dashboard Template",
};

export default function SignUp() {
  return <SignUpForm />;
}
