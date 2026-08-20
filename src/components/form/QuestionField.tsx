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
        <label htmlFor={id} className="block text-sm font-semibold text-[#221a1b]">
          {label}
          {required && <span className="text-[#5d0c1d] ml-1 font-bold">*</span>}
        </label>
      </div>

      {helpText && (
        <p className="text-xs text-[#665a5c] italic pl-1">{helpText}</p>
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
          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
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
          className="w-full p-4 rounded-2xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition resize-y shadow-2xs"
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
          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
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
          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
        />
      )}

      {/* SELECT */}
      {type === "select" && (
        <select
          id={id}
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
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
                    ? "border-[#5d0c1d] bg-[#fbf5f2] text-[#5d0c1d] font-semibold shadow-xs"
                    : "border-[#e0d8d0] bg-white hover:border-[#5d0c1d] text-[#332628]"
                }`}
              >
                <input
                  type="radio"
                  name={id}
                  value={opt}
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => onChange(opt)}
                  className="w-4 h-4 text-[#5d0c1d] focus:ring-[#5d0c1d] accent-[#5d0c1d]"
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
                    ? "border-[#5d0c1d] bg-[#fbf5f2] text-[#5d0c1d] font-semibold shadow-xs"
                    : "border-[#e0d8d0] bg-white hover:border-[#5d0c1d] text-[#332628]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={disabled}
                  onChange={() => handleCheckboxChange(opt)}
                  className="mt-0.5 w-4 h-4 rounded text-[#5d0c1d] focus:ring-[#5d0c1d] accent-[#5d0c1d]"
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
                      ? "bg-[#5d0c1d] text-white shadow-md scale-105"
                      : "bg-white border border-[#d8d0c8] text-[#221a1b] hover:border-[#5d0c1d] hover:bg-[#fbf5f2]"
                  }`}
                >
                  <span>{num}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-[#665a5c] mt-1.5 px-2">
            <span>Leve / Mínimo</span>
            <span>Moderado</span>
            <span>Intenso / Severo</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-[#991b1b] font-medium bg-[#fee2e2] border border-[#fca5a5] p-2 rounded-lg mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
