interface BaseProps {
  label: string;
  name: string;
  required?: boolean;
}

interface TextProps extends BaseProps {
  type?: "text" | "date" | "number" | "tel";
  value: string;
  onChange: (value: string) => void;
  options?: undefined;
  placeholder?: string;
}

interface SelectProps extends BaseProps {
  type?: "select";
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

type FormFieldProps = TextProps | SelectProps;

export default function FormField(props: FormFieldProps) {
  const { label, name, value, onChange, required } = props;
  const placeholder = props.placeholder ?? "Select...";

  const isSelect = props.type === "select";

  const inputClass =
    "w-full rounded-md border border-line bg-white px-3 py-2.5 font-sans text-sm text-slate outline-none transition focus:border-sage focus:ring-3 focus:ring-sage-light";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-light">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {isSelect ? (
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">{placeholder}</option>
          {props.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={props.type ?? "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}