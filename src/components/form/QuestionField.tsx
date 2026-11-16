"use client";

import React from "react";
import { QuestionItem } from "@/lib/types";
import { formatDateInput } from "@/lib/formatters";

interface QuestionFieldProps {
  question: QuestionItem;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  disabled?: boolean;
}

export const QuestionField: React.FC<QuestionFieldProps> = ({
  question,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const { id, label, type, placeholder, required, options = [], helpText } = question;

  const handleCheckboxChange = (opt: string) => {
    const currentArray = Array.isArray(value) ? [...value] : [];
    if (currentArray.includes(opt)) {
      onChange(currentArray.filter((item) => item !== opt));
    } else {
      onChange([...currentArray, opt]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="block text-sm font-semibold text-on-surface">
          {label}
          {required && <span className="text-primary ml-1 font-bold">*</span>}
        </label>
      </div>

      {helpText && (
        <p className="text-xs text-on-surface-variant italic pl-1">{helpText}</p>
      )}

      {/* TEXT */}
      {type === "text" && (
        <input
          id={id}
          type="text"
          disabled={disabled}
          placeholder={placeholder || "Digite sua resposta..."}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-outline bg-white text-on-surface placeholder-on-surface-subtle text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-2xs"
        />
      )}

      {/* TEXTAREA */}
      {type === "textarea" && (
        <textarea
          id={id}
          rows={4}
          disabled={disabled}
          placeholder={placeholder || "Escreva detalhadamente..."}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 rounded-2xl border border-outline bg-white text-on-surface placeholder-on-surface-subtle text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-y shadow-2xs"
        />
      )}

      {/* NUMBER */}
      {type === "number" && (
        <input
          id={id}
          type="number"
          disabled={disabled}
          placeholder={placeholder || "0"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-outline bg-white text-on-surface placeholder-on-surface-subtle text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-2xs"
        />
      )}

      {/* DATE (BRL FORMAT DD/MM/AAAA) */}
      {type === "date" && (
        <input
          id={id}
          type="text"
          disabled={disabled}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          value={value || ""}
          onChange={(e) => onChange(formatDateInput(e.target.value))}
          className="w-full h-12 px-4 rounded-xl border border-outline bg-white text-on-surface placeholder-on-surface-subtle text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-2xs"
        />
      )}

      {/* SELECT */}
      {type === "select" && (
        <select
          id={id}
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-outline bg-white text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition shadow-2xs"
        >
          <option value="">Selecione uma opção...</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {/* RADIO */}
      {type === "radio" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {options.map((opt, i) => {
            const isChecked = value === opt;
            return (
              <label
                key={i}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition text-sm ${
                  isChecked
                    ? "border-primary bg-surface-low text-primary font-semibold shadow-xs"
                    : "border-outline bg-white hover:border-primary text-on-surface"
                }`}
              >
                <input
                  type="radio"
                  name={id}
                  value={opt}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* CHECKBOX (Multiple choice) */}
      {type === "checkbox" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {options.map((opt, i) => {
            const isChecked = Array.isArray(value) && value.includes(opt);
            return (
              <label
                key={i}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition text-sm ${
                  isChecked
                    ? "border-primary bg-surface-low text-primary font-semibold shadow-xs"
                    : "border-outline bg-white hover:border-primary text-on-surface"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => handleCheckboxChange(opt)}
                  className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                />
                <span className="leading-snug">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* SCALE 1-10 */}
      {type === "scale_1_10" && (
        <div className="pt-2">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
              const isSelected = String(value) === String(num);
              return (
                <button
                  key={num}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(String(num))}
                  className={`h-11 rounded-xl font-bold text-sm transition flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-primary text-white shadow-md scale-105"
                      : "bg-white border border-outline text-on-surface hover:border-primary hover:bg-surface-low"
                  }`}
                >
                  <span>{num}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-on-surface-variant mt-1.5 px-2">
            <span>Leve / Mínimo</span>
            <span>Moderado</span>
            <span>Intenso / Severo</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-error font-medium bg-error-container border border-error-outline p-2 rounded-lg mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
