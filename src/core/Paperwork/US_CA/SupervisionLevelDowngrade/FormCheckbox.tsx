import { observer } from "mobx-react-lite";
import { DefaultTheme, StyledComponentProps } from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { UsCaSupervisionLevelDowngradeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsCaSupervisionLevelDowngradeForm";
import { UsCaSupervisionLevelDowngradeDraftData } from "../../../../WorkflowsStore/Opportunity/UsCaSupervisionLevelDowngradeReferralRecord";
import { useOpportunityFormContext } from "../../OpportunityFormContext";

type FormCheckboxProps = StyledComponentProps<
  "input",
  DefaultTheme,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  never
> & {
  name: keyof UsCaSupervisionLevelDowngradeDraftData;
  invert?: boolean;
  label: string;
};

const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  invert,
  ...props
}) => {
  const { firestoreStore } = useRootStore();
  const opportunityForm =
    useOpportunityFormContext() as UsCaSupervisionLevelDowngradeForm;

  const { formData } = opportunityForm;

  const onCheckField = (event: React.ChangeEvent<HTMLInputElement>) => {
    firestoreStore.updateFormDraftData(
      opportunityForm,
      name,
      event.target.checked !== !!invert
    );
  };

  return (
    <label>
      <input
        {...props}
        type="checkbox"
        onChange={onCheckField}
        checked={!!formData[name] !== !!invert}
      />
      {label}
    </label>
  );
};

export default observer(FormCheckbox);
