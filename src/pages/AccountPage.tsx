import React from "react";
import { supabase } from "../../src/supabaseClient";
import { StyledInput, StyledButton } from "../../src/ui";

// (Removed broken duplicate export default function declaration)
type AccountPageProps = {
  user: any;
  onLogout: () => void;
  onHome: () => void;
  themeVars: any;
};

export default function AccountPage({
  user,
  onLogout,
  onHome,
  themeVars,
}: AccountPageProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState(
    user?.user_metadata?.display_name || ""
  );
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!currentPassword || !newPassword) return;
    // Re-authenticate user with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setErr("Current password is incorrect.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setErr(error.message);
    else setMsg("Password updated!");
    setCurrentPassword("");
    setNewPassword("");
  }

  async function handleUpdateDisplayName(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!displayName) return;
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    if (error) setErr(error.message);
    else setMsg("Display name updated!");
  }

  return (
    <div className="account-bg">
      <div className="account-card">
        <h2 className="account-title">Account</h2>
        <p>
          <b>Email:</b> {user?.email}
        </p>
        <form onSubmit={handleUpdateDisplayName} className="account-form">
          <label className="account-label">Display Name</label>
          <StyledInput
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            themeVars={themeVars}
            className="account-input"
          />
          <StyledButton
            type="submit"
            themeVars={themeVars}
            className="account-btn"
          >
            Update Display Name
          </StyledButton>
        </form>
        <form onSubmit={handleUpdatePassword} className="account-form">
          <label className="account-label">Change Password</label>
          <StyledInput
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            themeVars={themeVars}
            className="account-input"
          />
          <StyledInput
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            themeVars={themeVars}
            className="account-input"
          />
          <StyledButton
            type="submit"
            themeVars={themeVars}
            className="account-btn account-btn-alt"
          >
            Update Password
          </StyledButton>
        </form>
        {(err || msg) && (
          <p className={err ? "account-error" : "account-success"}>
            {err || msg}
          </p>
        )}
        <div className="account-actions">
          <StyledButton
            onClick={onHome}
            themeVars={themeVars}
            className="account-btn"
          >
            Home
          </StyledButton>
          <StyledButton
            onClick={onLogout}
            themeVars={themeVars}
            danger
            className="account-btn account-btn-danger"
          >
            Log Out
          </StyledButton>
        </div>
      </div>
    </div>
  );
}
