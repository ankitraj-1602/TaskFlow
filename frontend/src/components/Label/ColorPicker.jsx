import React from 'react';
import { LABEL_COLORS } from '../../utils/labelColors';

/**
 * Grid of predefined color swatches.
 */
export const ColorPicker = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-9 gap-1.5">
      {LABEL_COLORS.map((color) => (
        <button
          key={color.hex}
          type="button"
          onClick={() => onChange(color.hex)}
          title={color.name}
          className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
            value === color.hex
              ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-400'
              : 'border-transparent'
          }`}
          style={{ backgroundColor: color.hex }}
        />
      ))}
    </div>
  );
};