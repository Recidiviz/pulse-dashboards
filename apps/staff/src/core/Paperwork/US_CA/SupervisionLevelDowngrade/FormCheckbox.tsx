import { observer } from "mobx-react-lite";
import { DefaultTheme, StyledComponentProps } from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { UsCaSupervisionLevelDowngradeForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsCaSupervisionLevelDowngradeForm";
import { UsCaSupervisionLevelDowngradeDraftData } from "../../../../WorkflowsStore/Opportunity/UsCa";
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
  disabled?: boolean;
  value?: string;
  label: string;
};

const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  value,
  invert,
  disabled,
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
      value || event.target.checked !== !!invert,
    );
  };

  return value ? (
    <label>
      <input
        {...props}
        value={value}
        type="radio"
        onChange={onCheckField}
        disabled={disabled}
        checked={disabled ? false : formData[name] === value}
      />
      {label}
    </label>
  ) : (
    <label>
      <input
        {...props}
        type="checkbox"
        onChange={onCheckField}
        disabled={disabled}
        checked={disabled ? false : !!formData[name] !== !!invert}
      />
      {label}
    </label>
  );
};

export default observer(FormCheckbox);