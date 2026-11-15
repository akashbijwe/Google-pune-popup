import './globals.css';

export const metadata = {
  title: 'Third Wave Coffee · Balewadi Highstreet',
  description: 'Third Wave Coffee, Balewadi Highstreet, Pune. Scan your table QR to browse the menu and order.',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#2E1F17' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800;1,9..40,400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
