import SignUp from "@/components/new-design/auth/sign-up";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign Up | Real Estate Pulse",
};

const SignUpPage = () => {
    return (
        <>
            <section className="pt-20 sm:pt-24 lg:pt-28">
                <div className="p-16 container mx-auto max-w-540 py-5 rounded-2xl shadow-auth dark:shadow-dark-auth">
                    <SignUp />
                </div>
            </section>
        </>
    );
};

export default SignUpPage;
