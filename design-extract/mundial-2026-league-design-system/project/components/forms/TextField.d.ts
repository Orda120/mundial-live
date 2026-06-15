import React from "react";

export interface TextFieldProps {
  /** Small label shown above the field. */
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

/** Standard text input — slate well, slate-700 hairline, sky focus border, with optional label. */
export function TextField(props: TextFieldProps): JSX.Element;
