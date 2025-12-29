"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CandidateDashboard() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to jobs page immediately
        router.replace('/candidate/jobs');
    }, [router]);

    return null; // No need to render anything as we're redirecting
}
