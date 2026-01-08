import OwnerSignUp from "@/components/new-design/auth/owner-sign-up";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Registration | PSM Phuket",
  description: "Create an owner account to manage your properties",
};

const OwnerSignUpPage = () => {
  return (
    <section className="pt-20 sm:pt-24 lg:pt-28">
      <div className="p-8 sm:p-16 container mx-auto max-w-xl py-5 rounded-2xl shadow-auth dark:shadow-dark-auth">
        <OwnerSignUp />
      </div>
    </section>
  );
};

export default OwnerSignUpPage;
