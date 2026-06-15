import React from "react";

/**
 * TextField — the standard text input. Slate-950 well, slate-700 hairline,
 * rounded-xl, with a small slate-500 label above. Border turns sky on focus.
 */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  type = "text",
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: "block", fontFamily: "var(--font-sans)", ...style }}>
      {label && (
        <span
          style={{
            display: "block",
            marginBottom: "4px",
            fontSize: "var(--text-xs)",
            color: "var(--text-meta)",
          }}
        >
          {label}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "8px 12px",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-sans)",
          color: "var(--text-strong)",
          background: "var(--surface-field)",
          border: "1px solid",
          borderColor: focus ? "var(--border-focus)" : "var(--border-default)",
          borderRadius: "var(--radius-xl)",
          outline: "none",
          transition: "var(--transition-colors)",
          opacity: disabled ? 0.5 : 1,
          ...inputStyle,
        }}
        {...rest}
      />
    </label>
  );
}
