/** The live room: full screen, no navigation, nothing that competes with the conversation. */
export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <main className="h-dvh overflow-hidden">{children}</main>;
}
