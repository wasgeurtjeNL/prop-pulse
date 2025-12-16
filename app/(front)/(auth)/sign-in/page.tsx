import Signin from "@/components/new-design/auth/sign-in";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In | Real Estate Pulse",
};

const SigninPage = () => {
    return (
        <>
            <section className="pt-20 sm:pt-24 lg:pt-28">
                <div className="p-16 container mx-auto max-w-540 py-5 rounded-2xl shadow-auth dark:shadow-dark-auth">
                    <Signin />
                </div>
            </section>
        </>
    );
};

export default SigninPage;
