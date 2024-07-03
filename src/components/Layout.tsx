import React from "preact/compat";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <header>
            </header>
            <main id="main-content" className="flex-grow flex flex-col overflow-auto ">
                {children}
            </main>
        </div>
    )
}