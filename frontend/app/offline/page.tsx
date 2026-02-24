"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-3xl font-bold text-content-primary mb-3">오프라인 상태입니다</h1>
      <p className="text-content-muted mb-8 max-w-md">
        인터넷 연결이 없습니다. 연결을 확인한 후 다시 시도해 주세요.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary px-6 py-3 font-semibold"
      >
        다시 시도
      </button>
    </div>
  );
}
