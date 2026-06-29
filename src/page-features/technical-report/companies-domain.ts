import { retrieveIdFromAvatar } from "@/utils/utils";

export const generatesCompaniesDomain = () => {
  const { partnerId, userId } = retrieveIdFromAvatar();

  if (!partnerId && !userId) return [];

  if (partnerId) {
    return [["user_ids.partner_id", "in", [partnerId]]];
  } else {
    return [["user_ids", "in", [userId]]];
  }
};
