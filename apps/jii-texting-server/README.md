## Deployment
Build the container:
```bash
nx run jii-texting-server:container \
  --configuration=dev
```

```bash
nx run jii-texting-server:deploy \
  --configuration=staging \ # or prod
  --tag=latest \
  --migrate=false
```

