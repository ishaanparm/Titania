import './globals.css';

export const metadata = {
  title: 'Tuning the Dial',
  description: 'Personalized music recommendations from a curator.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
