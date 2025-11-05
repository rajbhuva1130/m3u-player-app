import React from "react";

function SearchBar({ value, onChange, onMicClick }) {
  return (
    <div 
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
      }}
    >
      <input
        className="input"
        placeholder="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        style={{ flex: 1, minWidth: 0 }}
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onMicClick?.();
        }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          opacity: 0.7,
        }}
      >
        🎤
      </button>
    </div>
  );
}

export default React.memo(SearchBar);
