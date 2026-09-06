export const metadata = { title: 'Datum Platform API' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body style={{ fontFamily: 'ui-monospace, Menlo, monospace', maxWidth: 860, margin: '40px auto', padding: '0 20px', lineHeight: 1.5 }}>{children}</body></html>);
}
