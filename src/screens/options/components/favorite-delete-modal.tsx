import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { t } from "@/services/i18n-service";
import { Favorite } from "@/types";

export const FavoriteDeleteModal = (props: {
  favorite: Favorite;
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
}) => {
  const handleConfirm = async () => {
    await props.onConfirm(props.favorite.name);
    props.onClose();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t("options.favorites.delete_title")}
      description={t("options.favorites.delete_desc", [props.favorite.display_name])}
      footer={
        <>
          <Button variant="outline" onClick={props.onClose}>
            {t("common.cancel")}
          </Button>
          <Button color="error" onClick={handleConfirm}>
            {t("common.delete")}
          </Button>
        </>
      }
    />
  );
};
