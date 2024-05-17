## How is my {{resident.portionServedNeeded}} time date calculated?

Your {{resident.portionServedNeeded}} time date falls {{#if (equals resident.portionServedNeeded "1/2")}} halfway {{else}} two thirds of the way {{/if}} between the date you first entered a DOC facility and your current release date. If your current release date moves earlier because you keep earning good time, your {{resident.portionServedNeeded}} time date will also move earlier.

For example, if you entered a DOC facility on 1/1/2020, and your current release date is 1/1/2026, your {{resident.portionServedNeeded}} time date would be on 1/1/202{{#if (equals resident.portionServedNeeded "1/2")}}3{{else}}4{{/if}}.

Since your sentence is {{#if (equals resident.portionServedNeeded "1/2")}} between 0 and {{else}} more than {{/if}} 5 years long, you must pass your {{resident.portionServedNeeded}} time date to be eligible for SCCP.
