"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme =
            (localStorage.getItem("researchos-theme") as Theme | null) || "light";

        setTheme(savedTheme);
        setMounted(true);

        document.documentElement.setAttribute("data-theme", savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }, []);

    function toggleTheme() {
        const nextTheme: Theme = theme === "light" ? "dark" : "light";

        setTheme(nextTheme);
        localStorage.setItem("researchos-theme", nextTheme);

        document.documentElement.setAttribute("data-theme", nextTheme);
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }

    if (!mounted) return null;

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-base font-semibold text-[var(--foreground)] shadow-md transition hover:bg-[var(--muted)]"
        >
            {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
    );
}

export default ThemeToggle;