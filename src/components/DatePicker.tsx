type Props = {
  value: string;
  onChange: (date: string) => void;
  /** The race's official date. When provided, a reset button and hint are shown. */
  officialDate?: string;
};

export function DatePicker({ value, onChange, officialDate }: Props) {
  const isOfficialDate = officialDate !== undefined && value === officialDate;

  return (
    <div className="date-picker">
      <label htmlFor="ritt-date" className="date-picker__label">
        Velg dato
      </label>
      <div className="date-picker__controls">
          <input
            id="ritt-date"
            type="date"
            value={value}
            min="2000-01-01"
            max="2099-12-31"
            onChange={(e) => onChange(e.target.value)}
            className="date-picker__input"
          />
        {officialDate !== undefined && !isOfficialDate && (
          <button
            type="button"
            onClick={() => onChange(officialDate)}
            className="date-picker__reset"
          >
            Tilbake til offisiell dato
          </button>
        )}
      </div>
      {isOfficialDate && (
        <div className="date-picker__hint">Dette er den offisielle startdatoen</div>
      )}
    </div>
  );
}
