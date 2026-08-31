export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <style>{`@page { margin: 16mm 14mm 18mm; size: A4; }`}</style>
      {children}
    </div>
  );
}