import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_CONFIG, deriveActiveRole, getSwitchableRoles } from "@/lib/roleConfig";

/**
 * 4px colored bar at the top of the page indicating active role.
 * Renders nothing for single-role users.
 */
const RoleAccentBar = () => {
  const { roles } = useAuth();
  const location = useLocation();
  const switchable = getSwitchableRoles(roles);
  if (switchable.length < 2) return null;
  const active = deriveActiveRole(location.pathname, roles);
  if (!active) return null;
  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-1 transition-colors duration-300"
      style={{ backgroundColor: ROLE_CONFIG[active].accentHex }}
    />
  );
};

export default RoleAccentBar;
