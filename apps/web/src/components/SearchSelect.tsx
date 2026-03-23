import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md";
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  size = "sm",
  allowEmpty = true,
  emptyLabel = "All",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label || (value ? value : "");

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel || "").toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Position dropdown relative to trigger
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus input + calc position when opened, and attach scroll listener
  useEffect(() => {
    if (!open) return;
    updatePosition();
    setTimeout(() => inputRef.current?.focus(), 0);

    const handleScroll = (e: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      updatePosition();
    };
    window.addEventListener("scroll", handleScroll, true); // true = capture phase to catch all nested scrolls
    window.addEventListener("resize", updatePosition);
    
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Reset highlight when search changes
  useEffect(() => { setHighlightIndex(0); }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current) {
      const offset = allowEmpty ? 1 : 0;
      const el = listRef.current.children[highlightIndex + offset] as HTMLElement;
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open, allowEmpty]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setSearch("");
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightIndex]) select(filtered[highlightIndex].value);
    } else if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
    }
  };

  const isSm = size === "sm";

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed animate-fade-in"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: Math.max(dropdownPos.width, 220),
            minWidth: dropdownPos.width,
            zIndex: 9999,
          }}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #18182a 0%, #12121e 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Search */}
            <div className="p-2 border-b border-white/[0.04]">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search..."
                  className={`w-full pl-8 pr-3 bg-white/[0.03] border border-white/[0.06] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-aura-500/40 transition-colors ${
                    isSm ? "py-1.5 text-xs rounded-lg" : "py-2 text-sm rounded-lg"
                  }`}
                />
              </div>
            </div>

            {/* Options */}
            <div ref={listRef} className="max-h-56 overflow-y-auto py-1">
              {allowEmpty && (
                <button
                  type="button"
                  onClick={() => select("")}
                  className={`w-full text-left flex items-center gap-2 transition-colors ${
                    isSm ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
                  } ${value === "" ? "text-aura-300 bg-aura-500/[0.08]" : "text-gray-400 hover:bg-white/[0.04]"}`}
                >
                  <span className="italic">{emptyLabel}</span>
                </button>
              )}

              {filtered.length === 0 && (
                <div className={`text-gray-600 text-center ${isSm ? "px-3 py-4 text-xs" : "px-3.5 py-5 text-sm"}`}>
                  No matches
                </div>
              )}

              {filtered.map((option, i) => {
                const isSelected = option.value === value;
                const isHighlighted = i === highlightIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => select(option.value)}
                    className={`w-full text-left flex items-center justify-between gap-2 transition-colors ${
                      isSm ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
                    } ${
                      isSelected
                        ? "text-aura-300 bg-aura-500/[0.08]"
                        : isHighlighted
                          ? "text-gray-200 bg-white/[0.04]"
                          : "text-gray-300 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-gray-600 text-[10px] shrink-0">{option.sublabel}</span>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-aura-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer ${
          isSm ? "rounded-lg px-2.5 py-[7px] text-xs" : "rounded-[10px] px-3.5 py-2.5 text-sm"
        } ${open ? "ring-[3px] ring-aura-500/10" : ""}`}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          border: `1px solid ${open ? "rgba(84,104,246,0.6)" : "rgba(255,255,255,0.07)"}`,
          boxShadow: open
            ? "0 0 0 3px rgba(84,104,246,0.1), 0 1px 2px rgba(0,0,0,0.2)"
            : "0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <span className={displayLabel ? "text-gray-100 truncate" : "text-gray-500 truncate"}>
          {displayLabel || placeholder}
        </span>
        <svg
          className={`shrink-0 transition-transform duration-200 text-gray-500 ${open ? "rotate-180" : ""} ${isSm ? "w-3 h-3" : "w-3.5 h-3.5"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <polyline points="6 9 12 15 18 9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {dropdown}
    </div>
  );
}
