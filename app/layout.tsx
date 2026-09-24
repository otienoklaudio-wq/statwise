import type { Metadata } from 'next';
import WidgetConfig from '@/components/WidgetConfig';
import './globals.css';

export const metadata: Metadata = {
  title: 'Football Predictor',
  description: 'Match analysis and outcome predictions across major European leagues',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WidgetConfig />
        {children}
      </body>
    </html>
  );
}
