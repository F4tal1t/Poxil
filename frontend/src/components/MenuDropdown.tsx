import { useEffect, useRef, useState } from "react";

interface MenuItem {
  label: string;
  onClick: () => void;
  shortcut?: string;
  danger?: boolean;
}

interface MenuDropdownProps {
  label: string;
  items: MenuItem[];
}

export default function MenuDropdown({ label, items }: MenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded transition text-xs font-bold uppercase ${
          isOpen ? "bg-[#3d3842] text-white" : "hover:bg-[#3d3842] hover:text-white text-gray-400"
        }`}
      >
        {label}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-[#2e2a33] border border-[#3d3842] rounded shadow-xl py-1 z-50">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs hover:bg-[#3d3842] flex items-center justify-between ${
                item.danger ? "text-red-400" : "text-gray-200"
              }`}
            >
              <span>{item.label}</span>
              {item.shortcut && <span className="text-gray-500 opacity-70 ml-2">{item.shortcut}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
