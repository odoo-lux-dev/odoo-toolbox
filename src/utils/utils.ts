import type { DebugModeType, DefaultColorScheme, TechnicalListPosition } from "@/types";

const getDefaultDebugMode = () =>
  document.body.dataset.defaultDebugMode as DebugModeType | undefined;
const getShowTechnicalModel = () => document.body.dataset.showTechnicalModel;
const getShowPrintOptionsHTML = () => document.body.dataset.showPrintOptionsHTML;
const getShowPrintOptionsPDF = () => document.body.dataset.showPrintOptionsPDF;
const getDefaultColorScheme = () => document.body.dataset.defaultColorScheme as DefaultColorScheme;
const getShowTechnicalList = () => document.body.dataset.showTechnicalList;
const getTechnicalListPosition = () =>
  document.body.dataset.technicalListPosition as TechnicalListPosition;
const getShowLoginButtons = () => document.body.dataset.showLoginButtons;
const getOdooToolboxTheme = () => document.body.dataset.odooToolboxTheme;

const isOnSpecificRecordPage = () => {
  const odooWindowObject = window.odoo;
  const recordLocalState =
    odooWindowObject?.__WOWL_DEBUG__?.root?.actionService?.currentController?.getLocalState?.();

  return (
    (!!odooWindowObject?.__WOWL_DEBUG__?.root?.actionService?.currentController?.props?.resId ||
      !!recordLocalState?.resId) &&
    !!odooWindowObject?.__WOWL_DEBUG__?.root?.actionService?.currentController?.props?.resModel
  );
};

const hasNewOdooURL = () => {
  const odooWindowObject = window.odoo;
  if (!odooWindowObject) return false;

  const currentVersion = odooWindowObject.info?.server_version_info
    ?.slice(0, 2)
    .join(".")
    .replace(/^saas~/, "")
    .replace(/\.0$/, "");

  if (!currentVersion) return false;

  return parseFloat(currentVersion) >= 17.2;
};

const getOdooVersion = () => {
  const odooWindowObject = window.odoo;

  return (odooWindowObject?.info || odooWindowObject?.session_info)?.server_version_info
    ?.slice(0, 2)
    .join(".")
    .replace(/^saas~/, "")
    .replace(/\.0$/, "");
};

const isOnNewURLPos = () => {
  if (!hasNewOdooURL()) return false;
  const odooWindowObject = window.odoo;
  if (!odooWindowObject) return false;

  return odooWindowObject.__WOWL_DEBUG__?.root && "pos" in odooWindowObject.__WOWL_DEBUG__.root;
};

const retrieveIdFromAvatar = () => {
  const res: Record<"partnerId" | "userId", number | null> = {
    partnerId: null,
    userId: null,
  };
  const odooVersion = getOdooVersion();
  const userAvatar = document.querySelector(".o_user_avatar") as HTMLImageElement | null;

  if (!odooVersion || !userAvatar) return res;

  const userAvatarLink = userAvatar.src;

  if (parseFloat(odooVersion) >= 18.0) {
    // Link example : */web/image/res.partner/3/avatar_128?unique=1768400056000
    const partnerId = userAvatarLink.match(/\/res\.partner\/(\d+)/);
    res.partnerId = partnerId ? parseInt(partnerId[1]) : null;
  } else {
    // Link example : */web/image?model=res.users&field=avatar_128&id=2
    const avatarUrlSearchParams = new URL(userAvatarLink).searchParams;
    const userId = avatarUrlSearchParams.get("id");
    res.userId = userId ? parseInt(userId) : null;
  }

  return res;
};

export {
  getDefaultDebugMode,
  hasNewOdooURL,
  isOnSpecificRecordPage,
  getOdooVersion,
  getShowTechnicalModel,
  getShowPrintOptionsHTML,
  getShowPrintOptionsPDF,
  isOnNewURLPos,
  getDefaultColorScheme,
  getShowTechnicalList,
  getTechnicalListPosition,
  retrieveIdFromAvatar,
  getShowLoginButtons,
  getOdooToolboxTheme,
};
