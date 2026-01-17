"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import config from "@/config";

const ButtonSignIn = ({ extraStyle }: { extraStyle?: string }) => {
    const { data: session, status } = useSession();

    if (status === "authenticated") {
        return (
            <Link
                href={config.auth.callbackUrl}
                className={`btn ${extraStyle ? extraStyle : ""}`}
            >
                {session.user?.image ? (
                    <img
                        src={session.user?.image}
                        alt={session.user?.name || "Account"}
                        className="w-6 h-6 rounded-full shrink-0"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <span className="w-6 h-6 bg-base-300 flex items-center justify-center rounded-full shrink-0">
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
                    </span>
                )}
                {session.user?.name || "Account"}
            </Link>
        );
    }

    return (
        <button
            className={`btn ${extraStyle ? extraStyle : ""}`}
            onClick={() => signIn(undefined, { callbackUrl: config.auth.callbackUrl })}
        >
            Sign in
        </button>
    );
};

export default ButtonSignIn;
