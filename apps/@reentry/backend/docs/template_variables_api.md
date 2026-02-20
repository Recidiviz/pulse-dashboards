# Template Variables API - Frontend Integration Guide

This guide shows how to use the Template Variables API to display available template variables to users in the config editor UI.

## API Endpoint

```
GET /api/config-management/outputs/template-schema?output_type={type}
```

**Authentication**: Requires Recidiviz staff authentication

**Parameters**:
- `output_type` (required): Either `action_plan` or `intake_summary`

## Response Format

```typescript
interface TemplateFieldSchema {
  field_name: string;              // e.g., "data_template"
  description: string;             // Human-readable description
  available_variables: string[];   // Variables that can be used
  required_variables: string[];    // Variables that must be present
}

interface TemplateVariableSchemaResponse {
  output_type: string;             // "action_plan" or "intake_summary"
  fields: TemplateFieldSchema[];   // Array of all template fields
}
```

## Example Request

```bash
curl -X GET "https://api.example.com/api/config-management/outputs/template-schema?output_type=action_plan" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Example Response

```json
{
  "output_type": "action_plan",
  "fields": [
    {
      "field_name": "system",
      "description": "System message for the LLM",
      "available_variables": [],
      "required_variables": []
    },
    {
      "field_name": "data_template",
      "description": "Initial user prompt template",
      "available_variables": ["client_data", "address", "decision_tree_statements"],
      "required_variables": ["client_data"]
    },
    {
      "field_name": "section_generation_with_resources",
      "description": "Prompt for generating section content when resources are available",
      "available_variables": ["section", "resources"],
      "required_variables": ["section", "resources"]
    },
    {
      "field_name": "edit_section_change",
      "description": "Prompt for modifying existing section content",
      "available_variables": ["section", "extra_instructions", "clean_markdown_content"],
      "required_variables": ["section", "extra_instructions", "clean_markdown_content"]
    }
    // ... more fields
  ]
}
```

## Frontend Integration Examples

### React Hook for Fetching Schema

```typescript
// hooks/useTemplateVariableSchema.ts
import { useQuery } from '@tanstack/react-query';

interface TemplateFieldSchema {
  field_name: string;
  description: string;
  available_variables: string[];
  required_variables: string[];
}

interface TemplateVariableSchemaResponse {
  output_type: string;
  fields: TemplateFieldSchema[];
}

export function useTemplateVariableSchema(outputType: 'action_plan' | 'intake_summary') {
  return useQuery({
    queryKey: ['template-schema', outputType],
    queryFn: async () => {
      const response = await fetch(
        `/api/config-management/outputs/template-schema?output_type=${outputType}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch template schema');
      return response.json() as Promise<TemplateVariableSchemaResponse>;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
```

### Display Variables in Config Editor

```typescript
// components/ConfigEditor.tsx
import { useTemplateVariableSchema } from '../hooks/useTemplateVariableSchema';

function PromptFieldEditor({
  fieldName,
  value,
  onChange,
  outputType
}: Props) {
  const { data: schema, isLoading } = useTemplateVariableSchema(outputType);

  // Find schema for this specific field
  const fieldSchema = schema?.fields.find(f => f.field_name === fieldName);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <label>{fieldName}</label>
      <textarea value={value} onChange={onChange} />

      {/* Display available variables */}
      {fieldSchema && (
        <div className="template-variables-help">
          <h4>Available Variables</h4>
          <div className="variables-list">
            {fieldSchema.available_variables.map(variable => (
              <span
                key={variable}
                className={`variable-chip ${
                  fieldSchema.required_variables.includes(variable)
                    ? 'required'
                    : 'optional'
                }`}
                onClick={() => insertVariable(variable)}
              >
                {`{${variable}}`}
                {fieldSchema.required_variables.includes(variable) && (
                  <span className="required-badge">*</span>
                )}
              </span>
            ))}
          </div>
          <p className="description">{fieldSchema.description}</p>
        </div>
      )}
    </div>
  );
}
```

### Variable Autocomplete

```typescript
// components/TemplateEditor.tsx
import { Editor } from '@monaco-editor/react';

function TemplateEditor({ fieldName, value, onChange, outputType }: Props) {
  const { data: schema } = useTemplateVariableSchema(outputType);
  const fieldSchema = schema?.fields.find(f => f.field_name === fieldName);

  // Monaco editor configuration with autocomplete
  const editorOptions = {
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
  };

  const handleEditorWillMount = (monaco: any) => {
    // Register autocomplete provider for template variables
    monaco.languages.registerCompletionItemProvider('plaintext', {
      triggerCharacters: ['{'],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Suggest available variables
        const suggestions = fieldSchema?.available_variables.map(variable => ({
          label: variable,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: `{${variable}}`,
          detail: fieldSchema.required_variables.includes(variable)
            ? 'Required variable'
            : 'Optional variable',
          range,
        })) || [];

        return { suggestions };
      },
    });
  };

  return (
    <Editor
      height="200px"
      language="plaintext"
      value={value}
      onChange={onChange}
      options={editorOptions}
      beforeMount={handleEditorWillMount}
    />
  );
}
```

### Validation Helper

```typescript
// utils/templateValidation.ts
export function validateTemplate(
  template: string,
  fieldSchema: TemplateFieldSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Extract variables used in template
  const usedVariables = extractVariablesFromTemplate(template);

  // Check for undeclared variables
  const undeclared = usedVariables.filter(
    v => !fieldSchema.available_variables.includes(v)
  );
  if (undeclared.length > 0) {
    errors.push(
      `Undeclared variables: ${undeclared.join(', ')}. ` +
      `Available: ${fieldSchema.available_variables.join(', ')}`
    );
  }

  // Check for missing required variables
  const missing = fieldSchema.required_variables.filter(
    v => !usedVariables.includes(v)
  );
  if (missing.length > 0) {
    errors.push(`Missing required variables: ${missing.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function extractVariablesFromTemplate(template: string): string[] {
  const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*?)\}/g;
  const matches = [...template.matchAll(regex)];
  return matches.map(m => m[1]);
}
```

### Visual Examples

#### Variable Chips UI

```tsx
// Visual indicator for required vs optional variables
<div className="variables-container">
  <span className="variable-chip required" title="Required">
    {"{client_data}"}
    <span className="required-asterisk">*</span>
  </span>
  <span className="variable-chip optional" title="Optional">
    {"{address}"}
  </span>
  <span className="variable-chip optional" title="Optional">
    {"{decision_tree_statements}"}
  </span>
</div>
```

CSS:
```css
.variable-chip {
  display: inline-block;
  padding: 4px 8px;
  margin: 2px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.variable-chip.required {
  background-color: #e3f2fd;
  border: 1px solid #1976d2;
  color: #1976d2;
}

.variable-chip.optional {
  background-color: #f5f5f5;
  border: 1px solid #9e9e9e;
  color: #616161;
}

.variable-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.required-asterisk {
  color: #d32f2f;
  font-weight: bold;
  margin-left: 2px;
}
```

#### Inline Help Panel

```tsx
function VariableHelp({ fieldSchema }: { fieldSchema: TemplateFieldSchema }) {
  return (
    <div className="variable-help-panel">
      <h4>
        <InfoIcon size={16} />
        Template Variables
      </h4>

      <p className="description">{fieldSchema.description}</p>

      <div className="variable-section">
        <h5>Required Variables</h5>
        {fieldSchema.required_variables.length > 0 ? (
          <ul>
            {fieldSchema.required_variables.map(v => (
              <li key={v}>
                <code>{`{${v}}`}</code>
                <span className="required-badge">Required</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No required variables for this field</p>
        )}
      </div>

      {fieldSchema.available_variables.length > fieldSchema.required_variables.length && (
        <div className="variable-section">
          <h5>Optional Variables</h5>
          <ul>
            {fieldSchema.available_variables
              .filter(v => !fieldSchema.required_variables.includes(v))
              .map(v => (
                <li key={v}>
                  <code>{`{${v}}`}</code>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Cache the schema**: The schema doesn't change often, so cache it for at least 5 minutes
2. **Show visual indicators**: Use different colors/badges for required vs optional variables
3. **Provide autocomplete**: Help users by suggesting variables as they type
4. **Validate on blur**: Check templates when user leaves the field
5. **Show friendly errors**: Transform validation errors into user-friendly messages
6. **Allow click-to-insert**: Let users click variable chips to insert them
7. **Tooltip on hover**: Show variable descriptions on hover

## Error Handling

```typescript
function ConfigEditorPage() {
  const { data, error, isLoading } = useTemplateVariableSchema('action_plan');

  if (isLoading) {
    return <LoadingSpinner message="Loading template information..." />;
  }

  if (error) {
    return (
      <ErrorBanner>
        Unable to load template variable information.
        You can still edit the config, but autocomplete won't be available.
      </ErrorBanner>
    );
  }

  // Render editor with schema data
  return <ConfigEditor schema={data} />;
}
```

## Testing

### Mock Data for Tests

```typescript
// __mocks__/templateSchema.ts
export const mockActionPlanSchema: TemplateVariableSchemaResponse = {
  output_type: 'action_plan',
  fields: [
    {
      field_name: 'data_template',
      description: 'Initial user prompt template',
      available_variables: ['client_data', 'address', 'decision_tree_statements'],
      required_variables: ['client_data'],
    },
    // ... more fields
  ],
};

// In your tests
import { mockActionPlanSchema } from './__mocks__/templateSchema';

jest.mock('../hooks/useTemplateVariableSchema', () => ({
  useTemplateVariableSchema: () => ({
    data: mockActionPlanSchema,
    isLoading: false,
    error: null,
  }),
}));
```

## API Updates

The template variable schema is automatically generated from the Pydantic models in the backend. When new variables are added or changed:

1. The API response updates automatically
2. No frontend code changes needed for new variables
3. Frontend should handle new variables gracefully
4. Tests ensure schema stays in sync with actual code

## Support

For questions or issues:
- Backend schema: See `docs/template_deprecation_guide.md`
- API endpoint: `GET /api/config-management/outputs/template-schema`
- Tests: `app/tests/test_template_variable_schema_api.py`
