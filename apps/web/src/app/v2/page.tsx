import { LAYOUTS, TIERS } from "@sayhello/engine";

// Trang trạng thái tạm của bản 2 trong lúc xây (Pha 0). Trang chủ và mọi thiệp cũ vẫn do legacy/ phục vụ.
export default function V2Status() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <p className="text-sm uppercase tracking-wide opacity-60">SayHello 2.0</p>
      <h1 className="mt-2 text-3xl font-semibold">Đang xây bản mới</h1>
      <p className="mt-4 leading-7 opacity-80">
        Trang chủ và các thiệp hiện có vẫn chạy như cũ. Bộ máy thiệp mới đã nạp được với{" "}
        {LAYOUTS.length} kiểu bố cục ({LAYOUTS.join(", ")}) và {TIERS.length} hạng mẫu ({TIERS.join(", ")}).
      </p>
    </main>
  );
}
