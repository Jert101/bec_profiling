export default function Chip({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`cursor-pointer select-none rounded-full border px-3.5 py-2 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? "border-sage bg-sage-light font-semibold text-teal-dark"
          : "border-line hover:border-sage"
      }`}
    >
      {label}
    </button>
  );
}