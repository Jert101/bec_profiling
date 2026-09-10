export default function Chip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`cursor-pointer select-none rounded-full border px-3.5 py-2 text-[13px] font-medium transition ${
        checked
          ? "border-sage bg-sage-light font-semibold text-teal-dark"
          : "border-line hover:border-sage"
      }`}
    >
      {label}
    </button>
  );
}