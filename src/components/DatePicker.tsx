type Props = {
  value: string;
  onChange: (date: string) => void;
  /** The race's official date. When provided, a reset button and hint are shown. */
  officialDate?: string;
};

export function DatePicker({ value, onChange, officialDate }: Props) {
  const isOfficialDate = officialDate !== undefined && value === officialDate;

  return (
    <div className="picker-field">
      <label htmlFor="ritt-date" className="picker-field__label">
        Dato
        {officialDate !== undefined && !isOfficialDate && (
          <button
            type="button"
            onClick={() => onChange(officialDate)}
            className="picker-field__reset-link"
          >
            ↩ offisiell
          </button>
        )}
      </label>
      <input
        id="ritt-date"
        type="date"
        value={value}
        min="2000-01-01"
        max="2099-12-31"
        onChange={(e) => onChange(e.target.value)}
        className="picker-field__input"
      />
    </div>
  );
}
