import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="bg-white border-t mt-auto no-print hidden md:flex">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center text-sm text-muted-foreground">
                    <p>
                        &copy; {currentYear} Radius Authentication Server by the Engineering Team of NTPLC, Nakhon Si Thammarat. All rights reserved. | Powered by FreeRadius
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;