export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required,
  label,
}) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="password-input">
        <input
          id={id}
          name={name}
          type="password"
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label="Show password"
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling
            const isHidden = input.type === 'password'
            input.type = isHidden ? 'text' : 'password'
            e.currentTarget.setAttribute(
              'aria-label',
              isHidden ? 'Hide password' : 'Show password'
            )
          }}
        >
          👁
        </button>
      </div>
    </div>
  )
}
