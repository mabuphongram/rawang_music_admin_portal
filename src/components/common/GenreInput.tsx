import React, { useId } from 'react';

interface GenreInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export const GenreInput: React.FC<GenreInputProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select or type a genre',
}) => {
  const listId = useId();

  return (
    <div>
      <input
        type="text"
        list={listId}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#141414] border border-[#282828] rounded px-3 py-2 text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#3ecf8e]"
      />
      <datalist id={listId}>
        {options.map((genre) => (
          <option key={genre} value={genre} />
        ))}
      </datalist>
      <p className="mt-1 text-[10px] text-[#666666]">
        Pick an existing genre or type a new one.
      </p>
    </div>
  );
};
