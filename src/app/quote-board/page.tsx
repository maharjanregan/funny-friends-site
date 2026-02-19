import { Suspense } from "react";

import RoomInner from "./RoomInner";

export default function RoomPage() {
  return (
    <Suspense fallback={null}>
      <RoomInner />
    </Suspense>
  );
}
