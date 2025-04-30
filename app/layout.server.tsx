import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'M.E.K.H.Y Control System',
  description: 'Advanced electronic suit control interface',
};

export default function RootLayoutServer({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}