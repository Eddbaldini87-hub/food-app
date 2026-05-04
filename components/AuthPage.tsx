export function AuthPage(props: any) {
  const {
    styles,
    passwordInput,
    setPasswordInput,
    passwordError,
    setPasswordError,
    showPasswordInput,
    setShowPasswordInput,
    handleLogin,
    renderGpLogoFrame,
  } = props;

  return (
    <div style={styles.loginScreen}>
      <form style={styles.loginCard} onSubmit={handleLogin}>
        <div style={{ alignSelf: "center" }}>{renderGpLogoFrame(90, 24)}</div>
        <div style={styles.loginBadge}>GP POLICE</div>
        <h1 style={styles.loginTitle}>Kitchen Control Unit</h1>
        <p style={styles.loginSubtitle}>Your GP has been reported.</p>
        <input
          type={showPasswordInput ? "text" : "password"}
          value={passwordInput}
          onChange={(event: any) => {
            setPasswordInput(event.target.value);
            if (passwordError) setPasswordError("");
          }}
          style={styles.loginInput}
          placeholder="Password"
        />
        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => setShowPasswordInput((previous: boolean) => !previous)}
        >
          {showPasswordInput ? "Hide password" : "Show password"}
        </button>
        {passwordError ? <div style={styles.loginError}>{passwordError}</div> : null}
        <button type="submit" style={styles.loginButton}>
          Unlock
        </button>
      </form>
    </div>
  );
}
