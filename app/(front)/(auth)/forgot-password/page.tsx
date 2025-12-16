import ForgotPasword from "@/components/new-design/auth/forgot-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Real Estate Pulse",
};

const ForgotPasswordPage = () => {
  return (
    <>
        <ForgotPasword />
    </>
  );
};

export default ForgotPasswordPage;
