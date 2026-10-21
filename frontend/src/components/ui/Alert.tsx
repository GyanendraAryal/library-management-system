interface AlertProps {
  tone?: "error" | "success" | "info";
  children: string;
}

const TONES = {
  error: "border-danger/30 bg-danger-bg text-danger",
  success: "border-brand/20 bg-ok-bg text-ok-text",
  info: "border-line bg-surface-muted text-ink-muted",
};

export default function Alert({ tone = "info", children }: AlertProps) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${TONES[tone]}`}>
      {children}
    </p>
  );
}
