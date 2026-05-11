export default function FundingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="theme-page">
            <div className="theme-container pt-24">{children}</div>
        </main>
    );
}