// kc-frontend/src/enumLabels.js
import { useTranslation } from "react-i18next";

export function useEnumLabels() {
  const { t } = useTranslation();
  return {
    type: (v) => t(`enums.type.${String(v||"").toLowerCase()}`),
    method: (v) => t(`enums.method.${String(v||"").toLowerCase()}`),
    session: (v) => t(`enums.session.${String(v||"").toUpperCase()}`),
    channel: (v) => t(`enums.channel.${String(v||"").toLowerCase()}`)
  };
}