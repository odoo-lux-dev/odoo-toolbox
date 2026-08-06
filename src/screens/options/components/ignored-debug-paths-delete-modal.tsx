import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { t } from "@/services/i18n-service";

interface IgnoredDebugPathsDeleteModalProps {
  open: boolean;
  summary: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export const IgnoredDebugPathsDeleteModal = (props: IgnoredDebugPathsDeleteModalProps) => {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t("options.ignored_debug.delete_title")}
      description={t("options.ignored_debug.delete_desc", [props.summary])}
      footer={
        <>
          <Button variant="outline" onClick={props.onClose}>
            {t("common.cancel")}
          </Button>
          <Button color="error" onClick={props.onConfirm}>
            {t("common.delete")}
          </Button>
        </>
      }
    />
  );
};
